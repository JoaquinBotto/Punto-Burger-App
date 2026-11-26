import { eq, and, sql, desc } from 'drizzle-orm';
import type { Database, DbClient } from '@/db/client';
import {
  competitions,
  competitionEntries,
  competitionRounds,
  gameSessions,
  gameQuestions,
  tableSessions,
  categories,
  participants,
  questions,
  type NewGameQuestion,
  type Competition,
} from '@/db/schema';
import {
  OFFICIAL_TIMEZONE,
  DEFAULT_REGISTRATION_MINUTES_BEFORE,
  DEFAULT_JOIN_CUTOFF_MINUTES_BEFORE_END,
  DEFAULT_GRACE_MINUTES,
} from './constants';
import {
  CompetitionNotFoundError,
  CompetitionRegistrationClosedError,
  CompetitionCutoffReachedError,
  CompetitionRoundAlreadyExistsError,
  PreviousRoundNotCompletedError,
  CompetitionAllRoundsCompletedError,
  PresenceRequiredError,
} from './errors';
import type { CompetitionStateResponse } from './types';
import { generateCompetitionBlueprint } from './blueprint-generator';
import {
  getCompetitionById,
  getCompetitionByVenueAndDate,
  getActiveOpenCompetitionByVenue,
  createCompetitionRecord,
  createCompetitionBlueprintSlots,
  getCompetitionBlueprintSlots,
  getCompetitionEntryByTableSessionId,
  createCompetitionEntry,
  updateCompetitionEntryStatus,
  createCompetitionRound,
  getCompetitionRounds,
  getUsedQuestionIdsForEntry,
  updateCompetitionStatus,
} from './competition.repository';
import { resolveSessionFromCookie } from '@/modules/sessions';
import { SessionNotFoundError } from '@/modules/trivia/errors';
import { getGroupByTableSessionId } from '@/db/repositories/groups.repository';
import { checkPresence } from '@/lib/security/presence';
import { env } from '@/lib/env';
import { buildAssignmentPlan } from '@/modules/trivia/assignment-plan';
import { defaultRng } from '@/modules/trivia/question-selection';

/**
 * Obtiene la fecha civil YYYY-MM-DD actual en la zona horaria oficial del local.
 */
export function getTodayLocalDate(date = new Date(), timezone = OFFICIAL_TIMEZONE): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

export interface RequestCookiesReader {
  get(name: string): { value: string } | undefined;
}

export interface CreateCompetitionOptions {
  venueId: string;
  timingMode?: 'scheduled' | 'open';
  localDate?: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  name?: string;
  registrationMinutesBefore?: number;
  joinCutoffMinutesBeforeEnd?: number;
  graceMinutes?: number;
  isTest?: boolean;
  rng?: () => number;
}

/**
 * Crea una nueva competencia oficial con su blueprint inmutable de 30 slots.
 */
export async function createCompetition(
  db: Database,
  venueIdOrOptions: string | CreateCompetitionOptions,
  maybeOptions?: Omit<CreateCompetitionOptions, 'venueId'>
): Promise<Competition> {
  const options =
    typeof venueIdOrOptions === 'string'
      ? ({ ...maybeOptions!, venueId: venueIdOrOptions } as CreateCompetitionOptions)
      : venueIdOrOptions;

  const {
    venueId,
    timingMode = 'scheduled',
    localDate,
    startTime,
    endTime,
    name,
    registrationMinutesBefore = DEFAULT_REGISTRATION_MINUTES_BEFORE,
    joinCutoffMinutesBeforeEnd = DEFAULT_JOIN_CUTOFF_MINUTES_BEFORE_END,
    graceMinutes = DEFAULT_GRACE_MINUTES,
    isTest = false,
    rng = defaultRng,
  } = options;

  let startsAt: Date | null = null;
  let endsAt: Date | null = null;
  let registrationOpensAt: Date | null = null;
  let joinCutoffAt: Date | null = null;
  let finalizationGraceUntil: Date | null = null;
  let competitionStatus: 'scheduled' | 'active' = 'scheduled';

  if (timingMode === 'open') {
    // Si existe open + active para este venue, no permitir crear otra oficial
    if (!isTest) {
      const activeOpen = await getActiveOpenCompetitionByVenue(db, venueId, false);
      if (activeOpen) {
        throw new Error(
          'Ya existe una competencia abierta activa en este local. Debe finalizarse antes de crear una nueva.'
        );
      }
    }
    competitionStatus = 'active';
  } else {
    // Modo scheduled
    if (!localDate || !startTime || !endTime) {
      throw new Error('Las competencias programadas requieren localDate, startTime y endTime.');
    }

    startsAt = new Date(`${localDate}T${startTime}:00.000-03:00`);
    endsAt = new Date(`${localDate}T${endTime}:00.000-03:00`);
    registrationOpensAt = new Date(startsAt.getTime() - registrationMinutesBefore * 60_000);
    joinCutoffAt = new Date(endsAt.getTime() - joinCutoffMinutesBeforeEnd * 60_000);
    finalizationGraceUntil = new Date(endsAt.getTime() + graceMinutes * 60_000);

    if (startsAt >= endsAt) {
      throw new Error('La hora de inicio de la competencia debe ser anterior a la hora de fin.');
    }

    // Comprobar que no exista otra competencia oficial scheduled para esta fecha
    if (!isTest) {
      const existing = await getCompetitionByVenueAndDate(db, venueId, localDate);
      if (
        existing &&
        existing.status !== 'cancelled' &&
        !existing.isTest &&
        existing.timingMode === 'scheduled'
      ) {
        throw new Error(
          `Ya existe una competencia oficial (${existing.status}) para la fecha ${localDate}.`
        );
      }
    }
  }

  // Cargar las categorías activas (deben ser exactamente 6)
  const activeCats = await db
    .select({ id: categories.id, slug: categories.slug })
    .from(categories)
    .where(eq(categories.status, 'active'))
    .orderBy(categories.sortOrder);

  if (activeCats.length !== 6) {
    throw new Error(
      `Se requieren exactamente 6 categorías activas en el local. Encontradas: ${activeCats.length}`
    );
  }

  const categoryIds = activeCats.map((c) => c.id);
  const blueprintSlots = generateCompetitionBlueprint(categoryIds, rng);

  return db.transaction(async (tx) => {
    const comp = await createCompetitionRecord(tx, {
      venueId,
      timingMode,
      localDate: localDate ?? null,
      name: name ?? (timingMode === 'open' ? 'Competencia Abierta' : `Competencia ${localDate}`),
      startsAt,
      endsAt,
      registrationOpensAt,
      joinCutoffAt,
      finalizationGraceUntil,
      status: competitionStatus,
      isTest,
    });

    await createCompetitionBlueprintSlots(
      tx,
      blueprintSlots.map((s) => ({
        competitionId: comp.id,
        roundNumber: s.roundNumber,
        position: s.position,
        difficulty: s.difficulty,
        categoryId: s.categoryId,
      }))
    );

    return comp;
  });
}

/**
 * Obtiene la competencia actual (programada, activa o finalizada hoy) con normalización perezosa de estado.
 */
export async function getCurrentCompetition(
  db: DbClient,
  venueId: string,
  options?: { allowTest?: boolean }
): Promise<Competition | null> {
  // 1. Prioridad: si existe una competencia timingMode = 'open' and status = 'active'
  const activeOpen = await getActiveOpenCompetitionByVenue(db, venueId, options?.allowTest);
  if (activeOpen) {
    return activeOpen;
  }

  const today = getTodayLocalDate();
  const now = new Date();

  // Buscar competencia scheduled de hoy o que esté en su ventana de ejecución
  const conditions = [
    eq(competitions.venueId, venueId),
    eq(competitions.timingMode, 'scheduled'),
    sql`status != 'cancelled'`,
  ];

  if (!options?.allowTest) {
    conditions.push(eq(competitions.isTest, false));
  }

  const compList = await db
    .select()
    .from(competitions)
    .where(and(...conditions))
    .orderBy(desc(competitions.createdAt))
    .limit(5);

  let current: Competition | null = null;

  for (const c of compList) {
    // Si la fecha coincide o la ventana temporal está vigente
    if (
      c.localDate === today ||
      (c.registrationOpensAt &&
        c.finalizationGraceUntil &&
        now >= c.registrationOpensAt &&
        now <= c.finalizationGraceUntil)
    ) {
      current = c;
      break;
    }
  }

  if (!current) return null;

  // Normalización perezosa de estados (solo scheduled)
  if (
    current.status === 'scheduled' &&
    current.startsAt &&
    current.finalizationGraceUntil &&
    now >= current.startsAt &&
    now < current.finalizationGraceUntil
  ) {
    const updated = await updateCompetitionStatus(db, current.id, 'active');
    if (updated) current = updated;
  } else if (
    current.status === 'active' &&
    current.finalizationGraceUntil &&
    now >= current.finalizationGraceUntil
  ) {
    const updated = await updateCompetitionStatus(db, current.id, 'finalized');
    if (updated) current = updated;
  }

  return current;
}

/**
 * Inscribe una mesa en la competencia actual.
 */
export async function joinCompetition(
  db: Database,
  tableSessionToken: string,
  requestContext: { headers: Headers; cookies: RequestCookiesReader }
): Promise<{ ok: true; competitionId: string; entryId: string; next: string }> {
  const resolved = await resolveSessionFromCookie(db, tableSessionToken);
  if (!resolved) {
    throw new SessionNotFoundError();
  }
  const { session, table } = resolved;
  const group = await getGroupByTableSessionId(db, session.id);

  // 1. Validar presencia Wi-Fi
  const presence = checkPresence(requestContext.headers, requestContext.cookies, session.venueId);
  if (presence.mode === 'enforce' && !presence.verified) {
    throw new PresenceRequiredError();
  }

  // 2. Obtener competencia actual
  const comp = await getCurrentCompetition(db, session.venueId, { allowTest: true });
  if (!comp) {
    throw new CompetitionNotFoundError(
      'No hay ninguna competencia programada o activa en este momento.'
    );
  }

  const now = new Date();

  // 3. Validar ventana de registro
  if (comp.timingMode === 'open') {
    if (comp.status !== 'active') {
      throw new CompetitionRegistrationClosedError(
        'La competencia abierta no se encuentra activa.'
      );
    }
  } else {
    if (comp.registrationOpensAt && now < comp.registrationOpensAt) {
      throw new CompetitionRegistrationClosedError(
        `La inscripción para la competencia abrirá a las ${comp.registrationOpensAt.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}.`
      );
    }

    if (comp.joinCutoffAt && now > comp.joinCutoffAt) {
      throw new CompetitionRegistrationClosedError(
        'El horario límite de inscripción para la competencia de hoy ha finalizado.'
      );
    }
  }

  // 4. Comprobar si la sesión ya está inscripta
  const existingEntry = await getCompetitionEntryByTableSessionId(db, session.id);
  if (existingEntry) {
    return {
      ok: true,
      competitionId: comp.id,
      entryId: existingEntry.id,
      next: '/play',
    };
  }

  if (!group) {
    throw new Error(
      'Primero debés registrar el equipo y sus jugadores para ingresar a la competencia.'
    );
  }

  return db.transaction(async (tx) => {
    // 5. Extender la sesión de mesa para que cubra la competencia
    if (comp.timingMode === 'open') {
      // En modo abierto: asegurar al menos 120 minutos desde este momento
      const minExpiry = new Date(now.getTime() + 120 * 60_000);
      if (session.expiresAt < minExpiry) {
        await tx
          .update(tableSessions)
          .set({ expiresAt: minExpiry, updatedAt: new Date() })
          .where(eq(tableSessions.id, session.id));
      }
    } else if (comp.finalizationGraceUntil) {
      const targetExpiry = new Date(comp.finalizationGraceUntil.getTime() + 5 * 60_000);
      if (session.expiresAt < targetExpiry) {
        await tx
          .update(tableSessions)
          .set({ expiresAt: targetExpiry, updatedAt: new Date() })
          .where(eq(tableSessions.id, session.id));
      }
    }

    // 6. Crear entrada
    const entry = await createCompetitionEntry(tx, {
      competitionId: comp.id,
      tableId: table.id,
      tableSessionId: session.id,
      groupId: group.id,
      status: 'registered',
      joinedAt: now,
    });

    return {
      ok: true,
      competitionId: comp.id,
      entryId: entry.id,
      next: '/play',
    };
  });
}

/**
 * Prepara un ciclo específico (1..3) para una mesa inscripta en la competencia.
 */
export async function prepareCompetitionRound(
  db: Database,
  entryId: string,
  roundNumber: 1 | 2 | 3,
  rng: () => number = defaultRng
): Promise<{ ok: true; roundNumber: number; gameSessionId: string }> {
  return db.transaction(async (tx) => {
    // 1. Cargar entrada con lock
    const [entry] = await tx
      .select()
      .from(competitionEntries)
      .where(eq(competitionEntries.id, entryId))
      .for('update');

    if (!entry) {
      throw new Error('No se encontró la inscripción a la competencia.');
    }

    const comp = await getCompetitionById(tx, entry.competitionId);
    if (!comp) {
      throw new CompetitionNotFoundError();
    }

    const now = new Date();

    // 2. Validar tiempos según ciclo
    if (comp.timingMode === 'open') {
      if (comp.status !== 'active') {
        throw new CompetitionCutoffReachedError('La competencia abierta no se encuentra activa.');
      }
    } else {
      if (roundNumber === 1) {
        if (comp.startsAt && now < comp.startsAt) {
          throw new CompetitionCutoffReachedError('La competencia todavía no ha comenzado.');
        }
      }

      // Para cualquier ciclo, no se puede iniciar un nuevo ciclo si ya pasó endsAt
      if (comp.endsAt && now >= comp.endsAt) {
        throw new CompetitionCutoffReachedError(
          'El horario de juego de la competencia ha finalizado.'
        );
      }
    }

    // Extensión de sesión para open mode:
    // Al iniciar Ciclo 2 o Ciclo 3: si quedan menos de 30 minutos de sesión, extender nuevamente hasta: now + 60 minutos
    if (comp.timingMode === 'open' && (roundNumber === 2 || roundNumber === 3)) {
      const [currentTableSession] = await tx
        .select()
        .from(tableSessions)
        .where(eq(tableSessions.id, entry.tableSessionId));

      if (
        currentTableSession &&
        currentTableSession.expiresAt.getTime() - now.getTime() < 30 * 60_000
      ) {
        const extendedExpiry = new Date(now.getTime() + 60 * 60_000);
        await tx
          .update(tableSessions)
          .set({ expiresAt: extendedExpiry, updatedAt: new Date() })
          .where(eq(tableSessions.id, entry.tableSessionId));
      }
    }

    // 3. Comprobar rondas previas y unicidad
    const existingRounds = await getCompetitionRounds(tx, entryId);
    const existingRoundNumbers = new Set(existingRounds.map((r) => r.roundNumber));

    if (existingRoundNumbers.has(roundNumber)) {
      throw new CompetitionRoundAlreadyExistsError();
    }

    if (roundNumber === 2) {
      const r1 = existingRounds.find((r) => r.roundNumber === 1);
      if (!r1 || r1.gameSession.status !== 'completed') {
        throw new PreviousRoundNotCompletedError(
          'Debés completar el Ciclo 1 antes de comenzar el Ciclo 2.'
        );
      }
    } else if (roundNumber === 3) {
      const r2 = existingRounds.find((r) => r.roundNumber === 2);
      if (!r2 || r2.gameSession.status !== 'completed') {
        throw new PreviousRoundNotCompletedError(
          'Debés completar el Ciclo 2 antes de comenzar el Ciclo 3.'
        );
      }
    }

    // 4. Cargar participantes para plan de asignación
    const participantsList = await tx
      .select()
      .from(participants)
      .where(eq(participants.groupId, entry.groupId))
      .orderBy(participants.position);

    if (participantsList.length === 0) {
      throw new Error('El equipo no tiene participantes registrados.');
    }

    const assignmentPlan = buildAssignmentPlan(participantsList);

    // 5. Cargar blueprint slots del ciclo correspondiente
    const blueprintSlots = await getCompetitionBlueprintSlots(tx, comp.id, roundNumber);
    if (blueprintSlots.length !== 10) {
      throw new Error(
        `El blueprint para el ciclo ${roundNumber} está incompleto (${blueprintSlots.length}/10 slots).`
      );
    }

    // 6. Cargar preguntas ya utilizadas por ESTA mesa en ciclos anteriores
    const usedQuestionIds = await getUsedQuestionIdsForEntry(tx, entryId);

    // 7. Seleccionar 10 preguntas distintas acordes al blueprint sin repetir ninguna previa
    const newGameQuestions: NewGameQuestion[] = [];

    // Limpiar cualquier sesión huérfana previa en estado 'created' para no violar el índice único
    await tx
      .delete(gameSessions)
      .where(
        and(
          eq(gameSessions.tableSessionId, entry.tableSessionId),
          eq(gameSessions.status, 'created')
        )
      );

    // Para crear game_session
    const [gameSession] = await tx
      .insert(gameSessions)
      .values({
        tableSessionId: entry.tableSessionId,
        groupId: entry.groupId,
        categoryId: null, // Categoría mixta oficial de blueprint
        status: 'created',
        rankingEligible: false, // Las rondas competitivas no puntúan en ranking casual
      })
      .returning();

    if (!gameSession) {
      throw new Error('Fallo al crear la sesión de juego para el ciclo.');
    }

    for (const slot of blueprintSlots) {
      const slotAssignment = assignmentPlan.find((p) => p.position === slot.position);
      const targetParticipantId = slotAssignment?.targetParticipantId ?? null;

      // Obtener preguntas aprobadas para esta categoría y dificultad
      const availableCandidates = await tx
        .select()
        .from(questions)
        .where(
          and(
            eq(questions.categoryId, slot.categoryId),
            eq(questions.difficulty, slot.difficulty),
            eq(questions.status, 'approved')
          )
        );

      const unpicked = availableCandidates.filter((q) => !usedQuestionIds.has(q.id));

      if (unpicked.length === 0) {
        throw new Error(
          `Pool insuficiente para blueprint slot (Cat: ${slot.categoryId}, Diff: ${slot.difficulty}) sin repetición.`
        );
      }

      // Selección aleatoria uniforme
      const selectedIndex = Math.floor(rng() * unpicked.length);
      const chosenQuestion = unpicked[selectedIndex]!;

      usedQuestionIds.add(chosenQuestion.id);

      newGameQuestions.push({
        gameSessionId: gameSession.id,
        questionId: chosenQuestion.id,
        position: slot.position,
        difficulty: chosenQuestion.difficulty,
        targetParticipantId,
        promptSnapshot: chosenQuestion.prompt,
        optionASnapshot: chosenQuestion.optionA,
        optionBSnapshot: chosenQuestion.optionB,
        optionCSnapshot: chosenQuestion.optionC,
        optionDSnapshot: chosenQuestion.optionD,
        correctOptionSnapshot: chosenQuestion.correctOption,
        explanationSnapshot: chosenQuestion.explanation,
        ageRangeSnapshot: chosenQuestion.ageRange,
        educationLevelSnapshot: chosenQuestion.educationLevel,
        presentedAt: null,
        expiresAt: null,
      });
    }

    // Persistir las 10 game_questions
    await tx.insert(gameQuestions).values(newGameQuestions);

    // Registrar competition_round
    await createCompetitionRound(tx, {
      competitionEntryId: entry.id,
      roundNumber,
      gameSessionId: gameSession.id,
    });

    // Actualizar estado de entry a active si estaba registered
    if (entry.status === 'registered') {
      await updateCompetitionEntryStatus(tx, entry.id, 'active');
    }

    return {
      ok: true,
      roundNumber,
      gameSessionId: gameSession.id,
    };
  });
}

/**
 * Pasa al siguiente ciclo de la competencia (1, 2 o 3) para la mesa activa.
 */
export async function startNextCompetitionRound(
  db: Database,
  tableSessionToken: string,
  requestContext: { headers: Headers; cookies: RequestCookiesReader },
  rng: () => number = defaultRng
): Promise<{ ok: true; roundNumber: number; gameSessionId: string; next: string }> {
  const resolved = await resolveSessionFromCookie(db, tableSessionToken);
  if (!resolved) {
    throw new SessionNotFoundError();
  }
  const { session } = resolved;

  // Validar presencia Wi-Fi
  const presence = checkPresence(requestContext.headers, requestContext.cookies, session.venueId);
  if (presence.mode === 'enforce' && !presence.verified) {
    throw new PresenceRequiredError();
  }

  const entry = await getCompetitionEntryByTableSessionId(db, session.id);
  if (!entry) {
    throw new Error('La mesa no está inscripta en una competencia activa.');
  }

  const rounds = await getCompetitionRounds(db, entry.id);

  let nextRoundNumber: 1 | 2 | 3;
  if (rounds.length === 0) {
    nextRoundNumber = 1;
  } else if (rounds.length === 1) {
    nextRoundNumber = 2;
  } else if (rounds.length === 2) {
    nextRoundNumber = 3;
  } else {
    throw new CompetitionAllRoundsCompletedError();
  }

  const result = await prepareCompetitionRound(db, entry.id, nextRoundNumber, rng);

  return {
    ok: true,
    roundNumber: result.roundNumber,
    gameSessionId: result.gameSessionId,
    next: '/play',
  };
}

/**
 * Verifica si la partida completada corresponde al Ciclo 3 de una competencia
 * y, de ser así, marca la entrada como completada (`status = 'completed'`).
 */
export async function handleGameSessionCompletion(
  db: DbClient,
  gameSessionId: string
): Promise<void> {
  const [round] = await db
    .select({
      roundNumber: competitionRounds.roundNumber,
      entryId: competitionRounds.competitionEntryId,
    })
    .from(competitionRounds)
    .where(eq(competitionRounds.gameSessionId, gameSessionId))
    .limit(1);

  if (!round) return;

  if (round.roundNumber === 3) {
    await updateCompetitionEntryStatus(db, round.entryId, 'completed', new Date());
  }
}

/**
 * Obtiene el estado consolidado de la competencia y de la mesa para las pantallas de cliente.
 */
export async function getCompetitionState(
  db: DbClient,
  tableSessionToken?: string | null,
  requestContext?: { headers: Headers; cookies: RequestCookiesReader }
): Promise<CompetitionStateResponse> {
  let venueId = '00000000-0000-0000-0000-000000000001';
  let tableSessionId: string | null = null;

  if (tableSessionToken) {
    try {
      const resolved = await resolveSessionFromCookie(db as unknown as Database, tableSessionToken);
      if (resolved) {
        venueId = resolved.session.venueId;
        tableSessionId = resolved.session.id;
      }
    } catch {
      // Sesión no encontrada o expirada
    }
  }

  const comp = await getCurrentCompetition(db, venueId, { allowTest: true });

  const headers = requestContext?.headers ?? new Headers({});
  const cookies = requestContext?.cookies ?? { get: () => undefined };
  const presence = checkPresence(headers, cookies, venueId);

  let entryData: CompetitionStateResponse['entry'] = null;
  let activeGameSessionId: string | null = null;

  if (comp && tableSessionId) {
    const entry = await getCompetitionEntryByTableSessionId(db, tableSessionId);
    if (entry && entry.competitionId === comp.id) {
      const rounds = await getCompetitionRounds(db, entry.id);

      const roundScores = rounds.map((r) => r.gameSession.totalScore);
      const completedRounds = rounds.filter((r) => r.gameSession.status === 'completed').length;
      const totalScore = roundScores.reduce((acc, s) => acc + s, 0);

      const latestRound = rounds[rounds.length - 1];
      const currentRoundNumber = latestRound ? latestRound.roundNumber : 0;
      const currentRoundStatus = latestRound?.gameSession.status as
        'created' | 'active' | 'completed' | undefined;

      if (latestRound && latestRound.gameSession.status !== 'completed') {
        activeGameSessionId = latestRound.gameSessionId;
      }

      entryData = {
        id: entry.id,
        status: entry.status,
        currentRoundNumber,
        currentRoundStatus,
        completedRounds,
        roundScores,
        totalScore,
        joinedAt: entry.joinedAt.toISOString(),
        completedAt: entry.completedAt ? entry.completedAt.toISOString() : null,
      };
    }
  }

  return {
    competition: comp
      ? {
          id: comp.id,
          name: comp.name,
          status: comp.status,
          timingMode: comp.timingMode,
          localDate: comp.localDate,
          startsAt: comp.startsAt ? comp.startsAt.toISOString() : null,
          endsAt: comp.endsAt ? comp.endsAt.toISOString() : null,
          registrationOpensAt: comp.registrationOpensAt
            ? comp.registrationOpensAt.toISOString()
            : null,
          joinCutoffAt: comp.joinCutoffAt ? comp.joinCutoffAt.toISOString() : null,
          finalizationGraceUntil: comp.finalizationGraceUntil
            ? comp.finalizationGraceUntil.toISOString()
            : null,
          isTest: comp.isTest,
        }
      : null,
    entry: entryData,
    activeGameSessionId,
    presence: {
      mode: presence.mode,
      verified: presence.verified,
      required: presence.required,
    },
  };
}

/**
 * Valida presencia Wi-Fi para partidas de competencia cuando VENUE_PRESENCE_MODE = enforce.
 * Si la partida es casual, permite continuar.
 */
export async function assertCompetitionPresence(
  db: DbClient,
  sessionCookie: string,
  headers: Headers,
  cookies: RequestCookiesReader
): Promise<void> {
  if (env.VENUE_PRESENCE_MODE !== 'enforce') return;

  const resolved = await resolveSessionFromCookie(db as unknown as Database, sessionCookie);
  if (!resolved) return;
  const { session } = resolved;
  const entry = await getCompetitionEntryByTableSessionId(db, session.id);
  if (!entry) return;

  const presence = checkPresence(headers, cookies, session.venueId);
  if (!presence.verified) {
    throw new PresenceRequiredError();
  }
}

/**
 * Finaliza manualmente o por cierre operativo una competencia.
 */
export async function finalizeCompetition(
  db: DbClient,
  competitionId: string
): Promise<Competition> {
  const comp = await updateCompetitionStatus(db, competitionId, 'finalized');
  if (!comp) {
    throw new CompetitionNotFoundError(`No se encontró la competencia ${competitionId}.`);
  }
  return comp;
}
