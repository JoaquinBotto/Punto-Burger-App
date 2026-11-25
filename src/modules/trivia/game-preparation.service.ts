import { eq } from 'drizzle-orm';
import type { Database } from '../../db/client';
import { resolveSessionFromCookie } from '../sessions/sessions.service';
import { getGroupByTableSessionId } from '../../db/repositories/groups.repository';
import { getParticipantsByGroupId } from '../../db/repositories/participants.repository';
import { getGameSessionByTableSessionId } from '../../db/repositories/game-sessions.repository';
import { getCategoryById } from '../../db/repositories/categories.repository';
import { getApprovedQuestionsForCategory } from '../../db/repositories/questions.repository';
import {
  createGameQuestions,
  getGameQuestionsBySessionId,
} from '../../db/repositories/game-questions.repository';
import { createAuditEvent } from '../../db/repositories/audit-events.repository';
import { gameSessions } from '../../db/schema/game-sessions';
import type { NewGameQuestion } from '../../db/schema/game-questions';
import { buildAssignmentPlan } from './assignment-plan';
import { selectQuestionsForSlots } from './question-selection';
import {
  CategoryNotAvailableError,
  DeviceNotActiveError,
  GameAlreadyStartedError,
  GameNotConfiguredError,
  GameNotFoundError,
  GameSequenceIntegrityError,
  ParticipantsNotConfiguredError,
  SessionExpiredError,
  SessionNotFoundError,
} from './errors';
import type { GamePreparationResult, PlayPageData } from './types';

/**
 * Prepara transaccionalmente la secuencia inmutable de 10 preguntas para la partida.
 * Si ya existen exactamente 10 preguntas preparadas, actúa de forma idempotente.
 * No inicia el temporizador ni activa la partida.
 */
export async function prepareGame(
  db: Database,
  rawCookieToken: string | undefined,
  now = new Date(),
  rng?: () => number
): Promise<GamePreparationResult> {
  // 1. Autorización mediante token seguro en cookie
  if (!rawCookieToken || rawCookieToken.trim() === '') {
    throw new SessionNotFoundError();
  }

  const resolved = await resolveSessionFromCookie(db, rawCookieToken, now);
  if (!resolved) {
    throw new SessionExpiredError();
  }

  const { device, session } = resolved;

  if (device.status !== 'active' || session.activeDeviceId !== device.id) {
    throw new DeviceNotActiveError();
  }

  // 2. Comprobación preliminar de grupo y partida
  const group = await getGroupByTableSessionId(db, session.id);
  if (!group) {
    throw new GameNotConfiguredError('No se encontró el grupo de la mesa.');
  }

  const gameSession = await getGameSessionByTableSessionId(db, session.id);
  if (!gameSession) {
    throw new GameNotFoundError();
  }

  if (gameSession.status === 'active' || gameSession.status === 'completed') {
    throw new GameAlreadyStartedError();
  }

  if (gameSession.status !== 'created') {
    throw new GameAlreadyStartedError('La partida no se encuentra en estado preparatorio.');
  }

  if (!gameSession.categoryId) {
    throw new GameNotConfiguredError('La partida no tiene categoría asignada.');
  }

  // 3. Transacción atómica con bloqueo a nivel fila (SELECT ... FOR UPDATE)
  return db.transaction(async (tx) => {
    const [lockedGame] = await tx
      .select()
      .from(gameSessions)
      .where(eq(gameSessions.id, gameSession.id))
      .for('update');

    if (!lockedGame) {
      throw new GameNotFoundError();
    }

    if (lockedGame.status !== 'created') {
      throw new GameAlreadyStartedError();
    }

    // 4. Verificación de idempotencia
    const existingQuestions = await getGameQuestionsBySessionId(tx, lockedGame.id);
    if (existingQuestions.length === 10) {
      const category = await getCategoryById(tx, lockedGame.categoryId!);
      return {
        ok: true,
        game: {
          status: lockedGame.status,
          prepared: true,
          questionCount: 10,
          category: {
            slug: category?.slug ?? '',
            name: category?.name ?? '',
          },
        },
        next: '/play',
      };
    }

    if (existingQuestions.length > 0 && existingQuestions.length < 10) {
      throw new GameSequenceIntegrityError();
    }

    // 5. Cargar participantes y validar rango 1..8
    const participantsList = await getParticipantsByGroupId(tx, group.id);
    if (participantsList.length === 0 || participantsList.length > 8) {
      throw new ParticipantsNotConfiguredError();
    }

    // 6. Cargar y validar categoría
    const category = await getCategoryById(tx, lockedGame.categoryId!);
    if (!category || category.status !== 'active') {
      throw new CategoryNotAvailableError();
    }

    // 7. Cargar banco de preguntas aprobadas
    const approvedQuestions = await getApprovedQuestionsForCategory(tx, category.id);

    // 8. Construir plan de destinatarios y seleccionar 10 preguntas
    const plan = buildAssignmentPlan(participantsList);
    const selected = selectQuestionsForSlots(approvedQuestions, plan, rng);

    // 9. Crear snapshots inmutables y persistir
    const newQuestions: NewGameQuestion[] = selected.map((s) => ({
      gameSessionId: lockedGame.id,
      questionId: s.question.id,
      position: s.slot.position,
      difficulty: s.question.difficulty,
      targetParticipantId: s.slot.targetParticipantId,
      promptSnapshot: s.question.prompt,
      optionASnapshot: s.question.optionA,
      optionBSnapshot: s.question.optionB,
      optionCSnapshot: s.question.optionC,
      optionDSnapshot: s.question.optionD,
      correctOptionSnapshot: s.question.correctOption,
      explanationSnapshot: s.question.explanation,
      ageRangeSnapshot: s.question.ageRange,
      educationLevelSnapshot: s.question.educationLevel,
      presentedAt: null,
      expiresAt: null,
    }));

    await createGameQuestions(tx, newQuestions);

    // 10. Registrar auditoría inmutable
    const directedCount = plan.filter((p) => !p.isGroup).length;
    const groupCount = plan.filter((p) => p.isGroup).length;

    await createAuditEvent(tx, {
      venueId: session.venueId,
      eventType: 'game_questions_prepared',
      entityType: 'game_session',
      entityId: lockedGame.id,
      actorType: 'device',
      actorId: device.id,
      metadata: {
        gameSessionId: lockedGame.id,
        categoryId: category.id,
        categorySlug: category.slug,
        questionCount: 10,
        initialCount: 3,
        mediumCount: 4,
        advancedCount: 3,
        directedCount,
        groupCount,
      },
    });

    return {
      ok: true,
      game: {
        status: lockedGame.status,
        prepared: true,
        questionCount: 10,
        category: {
          slug: category.slug,
          name: category.name,
        },
      },
      next: '/play',
    };
  });
}

/**
 * Obtiene los datos server-side seguros para la pantalla preparatoria /play.
 * No expone preguntas completas ni respuestas correctas.
 */
export async function getPlayPageData(
  db: Database,
  rawCookieToken: string | undefined,
  now = new Date()
): Promise<PlayPageData> {
  if (!rawCookieToken || rawCookieToken.trim() === '') {
    throw new SessionNotFoundError();
  }

  const resolved = await resolveSessionFromCookie(db, rawCookieToken, now);
  if (!resolved) {
    throw new SessionExpiredError();
  }

  const { device, session, table } = resolved;

  if (device.status !== 'active' || session.activeDeviceId !== device.id) {
    throw new DeviceNotActiveError();
  }

  const group = await getGroupByTableSessionId(db, session.id);
  if (!group) {
    throw new GameNotConfiguredError('No se encontró el grupo de la mesa.');
  }

  const participantsList = await getParticipantsByGroupId(db, group.id);

  const gameSession = await getGameSessionByTableSessionId(db, session.id);
  if (!gameSession || !gameSession.categoryId) {
    throw new GameNotConfiguredError('No se encontró la partida configurada.');
  }

  const category = await getCategoryById(db, gameSession.categoryId);
  if (!category) {
    throw new CategoryNotAvailableError();
  }

  const questionsCount = (await getGameQuestionsBySessionId(db, gameSession.id)).length;

  return {
    table: {
      code: table.code,
      displayName: table.displayName,
    },
    group: {
      name: group.name,
      participantCount: participantsList.length,
    },
    category: {
      slug: category.slug,
      name: category.name,
    },
    structure: {
      initial: 3,
      medium: 4,
      advanced: 3,
      total: 10,
    },
    gameStatus: gameSession.status,
    isPrepared: questionsCount === 10,
  };
}
