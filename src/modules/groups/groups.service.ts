import type { Database } from '../../db/client';
import { resolveSessionFromCookie } from '../sessions/sessions.service';
import {
  createGroup,
  getGroupByTableSessionId,
  updateGroupName,
} from '../../db/repositories/groups.repository';
import {
  replaceGroupParticipants,
  getParticipantsByGroupId,
} from '../../db/repositories/participants.repository';
import {
  createGameSession,
  getGameSessionByTableSessionId,
  getGameSessionsByTableSessionId,
  getGameSessionWithCategory,
  updateGameSessionCategory,
} from '../../db/repositories/game-sessions.repository';
import { countGameQuestionsBySessionId } from '../../db/repositories/game-questions.repository';
import {
  checkCategoryReadiness,
  getActiveCategoriesWithReadiness,
  getCategoryBySlug,
} from '../../db/repositories/categories.repository';
import { createAuditEvent } from '../../db/repositories/audit-events.repository';
import { groupSetupInputSchema } from './validation';
import {
  CategoryNotAvailableError,
  CategoryNotFoundError,
  CategoryNotReadyError,
  DeviceNotActiveError,
  GameAlreadyStartedError,
  GroupNameInvalidError,
  ParticipantCountInvalidError,
  ParticipantInvalidError,
  SessionExpiredError,
  SessionNotFoundError,
  SetupAlreadyLockedError,
  SetupCreationFailedError,
} from './errors';
import type {
  GroupSetupInput,
  GroupSetupResult,
  PlaySetupInitialData,
  CanonicalAgeRange,
  CanonicalEducationLevel,
} from './types';
import type { Participant } from '../../db/schema';

/**
 * Guarda o actualiza transaccionalmente la configuración del equipo, participantes y categoría.
 * Si el juego está en status 'created', permite edición e idempotencia; si está en 'active', rechaza.
 */
export async function saveGameSetup(
  db: Database,
  rawCookieToken: string | undefined,
  rawInput: unknown,
  now = new Date()
): Promise<GroupSetupResult> {
  // 1. Autorización mediante token seguro en cookie
  if (!rawCookieToken || rawCookieToken.trim() === '') {
    throw new SessionNotFoundError();
  }

  const resolved = await resolveSessionFromCookie(db, rawCookieToken, now);
  if (!resolved) {
    throw new SessionExpiredError();
  }

  const { device, session, table, venue } = resolved;

  if (device.status !== 'active' || session.activeDeviceId !== device.id) {
    throw new DeviceNotActiveError();
  }

  // 2. Validación de entrada con Zod
  const parseResult = groupSetupInputSchema.safeParse(rawInput);
  if (!parseResult.success) {
    const issues = parseResult.error.issues;
    const groupNameIssue = issues.find((i) => i.path[0] === 'groupName');
    if (groupNameIssue) {
      throw new GroupNameInvalidError(groupNameIssue.message);
    }
    const participantCountIssue = issues.find(
      (i) => i.path[0] === 'participants' && i.code === 'too_small'
    );
    if (participantCountIssue) {
      throw new ParticipantCountInvalidError(participantCountIssue.message);
    }
    const participantTooBigIssue = issues.find(
      (i) => i.path[0] === 'participants' && i.code === 'too_big'
    );
    if (participantTooBigIssue) {
      throw new ParticipantCountInvalidError(participantTooBigIssue.message);
    }
    throw new ParticipantInvalidError();
  }

  const data: GroupSetupInput = parseResult.data;

  // 3. Resolución y comprobación de categoría y readiness
  const category = await getCategoryBySlug(db, data.categorySlug);
  if (!category) {
    throw new CategoryNotFoundError();
  }

  if (category.status !== 'active') {
    throw new CategoryNotAvailableError();
  }

  const readiness = await checkCategoryReadiness(db, category.id);
  if (!readiness.isReady) {
    throw new CategoryNotReadyError();
  }

  // 4. Verificación de estado de partida previa y bloqueo de setup
  const existingGame = await getGameSessionByTableSessionId(db, session.id);
  const sessionGames = await getGameSessionsByTableSessionId(db, session.id);
  const allGames = sessionGames.length > 0 ? sessionGames : existingGame ? [existingGame] : [];

  const hasActiveOrCompletedGame = allGames.some(
    (g) => g.status === 'active' || g.status === 'completed'
  );

  let hasFrozenQuestions = false;
  for (const game of allGames) {
    const qCount = await countGameQuestionsBySessionId(db, game.id);
    if (qCount > 0) {
      hasFrozenQuestions = true;
      break;
    }
  }

  const isSetupLocked = hasActiveOrCompletedGame || hasFrozenQuestions;

  // Comparar semánticamente si el payload recibido es idéntico al estado persistido
  const existingGroup = await getGroupByTableSessionId(db, session.id);
  let isIdenticalPayload = false;
  let existingParticipantsList: Participant[] = [];

  if (existingGroup) {
    existingParticipantsList = await getParticipantsByGroupId(db, existingGroup.id);
    if (
      existingGroup.name.trim() === data.groupName.trim() &&
      existingParticipantsList.length === data.participants.length
    ) {
      isIdenticalPayload = data.participants.every((p, idx) => {
        const ex = existingParticipantsList[idx];
        return (
          ex &&
          ex.alias.trim() === p.alias.trim() &&
          ex.ageRange === p.ageRange &&
          (ex.educationLevel ?? null) === (p.educationLevel ?? null) &&
          ex.position === idx + 1
        );
      });
    }
  }

  if (isSetupLocked) {
    if (isIdenticalPayload) {
      // Reintento legítimo e idempotente con preguntas ya congeladas / partida en curso
      const latestGame = allGames.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
      return {
        ok: true,
        group: {
          id: existingGroup!.id,
          name: existingGroup!.name,
        },
        participants: existingParticipantsList.map((p) => ({
          id: p.id,
          alias: p.alias,
          ageRange: p.ageRange as CanonicalAgeRange,
          educationLevel: (p.educationLevel as CanonicalEducationLevel) ?? null,
          position: p.position,
        })),
        gameSession: {
          id: latestGame ? latestGame.id : '',
          status: 'created' as const,
          categoryId: category.id,
          categoryName: category.name,
          categorySlug: category.slug,
        },
        next: '/play/setup',
      };
    }

    if (hasActiveOrCompletedGame) {
      throw new GameAlreadyStartedError();
    }

    // Intento de modificar setup cuando las preguntas ya están congeladas
    throw new SetupAlreadyLockedError();
  }

  // 5. Transacción atómica en PostgreSQL
  try {
    return await db.transaction(async (tx) => {
      // 5.1 Gestión de Grupo (Crear o Actualizar)
      let currentGroup = existingGroup;

      if (!currentGroup) {
        currentGroup = await createGroup(tx, {
          tableSessionId: session.id,
          name: data.groupName,
        });

        await createAuditEvent(tx, {
          venueId: venue.id,
          eventType: 'group_created',
          entityType: 'group',
          entityId: currentGroup.id,
          actorType: 'device',
          actorId: device.id,
          metadata: {
            tableSessionId: session.id,
            tableCode: table.code,
            groupName: currentGroup.name,
          },
        });
      } else if (currentGroup.name !== data.groupName) {
        currentGroup = await updateGroupName(tx, currentGroup.id, data.groupName);

        await createAuditEvent(tx, {
          venueId: venue.id,
          eventType: 'group_updated',
          entityType: 'group',
          entityId: currentGroup.id,
          actorType: 'device',
          actorId: device.id,
          metadata: {
            tableSessionId: session.id,
            tableCode: table.code,
            groupName: currentGroup.name,
          },
        });
      }

      // 5.2 Gestión de Participantes (posiciones estables 1..N)
      let savedParticipants: Participant[];
      if (isIdenticalPayload && existingParticipantsList.length > 0) {
        savedParticipants = existingParticipantsList;
      } else {
        const participantsWithPosition = data.participants.map((p, idx) => ({
          alias: p.alias,
          ageRange: p.ageRange,
          educationLevel: p.educationLevel ?? null,
          position: idx + 1,
        }));

        savedParticipants = await replaceGroupParticipants(
          tx,
          currentGroup.id,
          participantsWithPosition
        );

        await createAuditEvent(tx, {
          venueId: venue.id,
          eventType: 'participants_configured',
          entityType: 'group',
          entityId: currentGroup.id,
          actorType: 'device',
          actorId: device.id,
          metadata: {
            participantCount: savedParticipants.length,
            tableSessionId: session.id,
          },
        });
      }

      // 5.3 Gestión de Game Session (Crear o Actualizar categoría)
      let currentGameSession = await getGameSessionByTableSessionId(tx, session.id);

      if (!currentGameSession) {
        currentGameSession = await createGameSession(tx, {
          tableSessionId: session.id,
          groupId: currentGroup.id,
          categoryId: category.id,
          status: 'created',
        });

        await createAuditEvent(tx, {
          venueId: venue.id,
          eventType: 'game_setup_created',
          entityType: 'game_session',
          entityId: currentGameSession.id,
          actorType: 'device',
          actorId: device.id,
          metadata: {
            tableSessionId: session.id,
            groupId: currentGroup.id,
            categoryId: category.id,
            categorySlug: category.slug,
          },
        });
      } else {
        if (currentGameSession.categoryId && currentGameSession.categoryId !== category.id) {
          currentGameSession = await updateGameSessionCategory(
            tx,
            currentGameSession.id,
            category.id
          );
        }

        await createAuditEvent(tx, {
          venueId: venue.id,
          eventType: 'game_setup_updated',
          entityType: 'game_session',
          entityId: currentGameSession.id,
          actorType: 'device',
          actorId: device.id,
          metadata: {
            tableSessionId: session.id,
            groupId: currentGroup.id,
            categoryId: category.id,
            categorySlug: category.slug,
          },
        });
      }

      return {
        ok: true,
        group: {
          id: currentGroup.id,
          name: currentGroup.name,
        },
        participants: savedParticipants.map((p) => ({
          id: p.id,
          alias: p.alias,
          ageRange: p.ageRange,
          educationLevel: p.educationLevel,
          position: p.position,
        })),
        gameSession: {
          id: currentGameSession.id,
          status: 'created',
          categoryId: category.id,
          categoryName: category.name,
          categorySlug: category.slug,
        },
        next: '/play/setup',
      };
    });
  } catch (error: unknown) {
    if (
      error instanceof SessionNotFoundError ||
      error instanceof SessionExpiredError ||
      error instanceof DeviceNotActiveError ||
      error instanceof GroupNameInvalidError ||
      error instanceof ParticipantCountInvalidError ||
      error instanceof ParticipantInvalidError ||
      error instanceof CategoryNotFoundError ||
      error instanceof CategoryNotAvailableError ||
      error instanceof CategoryNotReadyError ||
      error instanceof GameAlreadyStartedError ||
      error instanceof SetupAlreadyLockedError
    ) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);
    console.error('Error al guardar configuración de grupo en transacción:', message);
    throw new SetupCreationFailedError();
  }
}

/**
 * Recupera la configuración actual de mesa, categorías y grupo guardado para /play/setup.
 */
export async function getPlaySetupData(
  db: Database,
  rawCookieToken: string | undefined,
  now = new Date()
): Promise<PlaySetupInitialData | null> {
  if (!rawCookieToken || rawCookieToken.trim() === '') {
    return null;
  }

  const resolved = await resolveSessionFromCookie(db, rawCookieToken, now);
  if (!resolved) {
    return null;
  }

  const { table, venue, session } = resolved;
  const categoriesList = await getActiveCategoriesWithReadiness(db);

  let existingSetup: PlaySetupInitialData['existingSetup'] = null;

  const currentGroup = await getGroupByTableSessionId(db, session.id);
  if (currentGroup) {
    const participantsList = await getParticipantsByGroupId(db, currentGroup.id);
    const currentGame = await getGameSessionWithCategory(db, session.id);

    if (participantsList.length > 0) {
      existingSetup = {
        groupName: currentGroup.name,
        participants: participantsList.map((p) => ({
          alias: p.alias,
          ageRange: p.ageRange as CanonicalAgeRange,
          educationLevel: (p.educationLevel as CanonicalEducationLevel) ?? null,
          position: p.position,
        })),
        categorySlug: currentGame?.category?.slug ?? categoriesList[0]?.slug ?? '',
        isSaved: true,
      };
    }
  }

  return {
    table: {
      id: table.id,
      code: table.code,
      displayName: table.displayName,
    },
    venue: {
      id: venue.id,
      name: venue.name,
      slug: venue.slug,
    },
    categories: categoriesList,
    existingSetup,
  };
}
