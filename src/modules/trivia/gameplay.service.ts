import { eq, sql } from 'drizzle-orm';
import type { Database } from '../../db/client';
import { gameSessions } from '../../db/schema/game-sessions';
import type { GameQuestion } from '../../db/schema/game-questions';
import { resolveSessionFromCookie } from '../sessions/sessions.service';
import { COOLDOWN_DURATION_MS } from '../tables/tables.service';
import { updateTableStatus } from '../../db/repositories/tables.repository';
import { revokeDevice, updateSessionStatus } from '../../db/repositories/table-sessions.repository';
import { getGroupByTableSessionId } from '../../db/repositories/groups.repository';
import {
  advanceGameSessionQuestion,
  getGameSessionByTableSessionId,
  updateGameSessionScoreAndCounts,
  updateGameSessionStatus,
} from '../../db/repositories/game-sessions.repository';
import { getCategoryById } from '../../db/repositories/categories.repository';
import {
  getGameQuestionByPosition,
  getGameQuestionsBySessionId,
  updateGameQuestionTiming,
} from '../../db/repositories/game-questions.repository';
import {
  createAnswer,
  getAnswerByGameQuestionId,
  getAnswersByGameSessionId,
  updateAnswer,
} from '../../db/repositories/answers.repository';
import { getParticipantById } from '../../db/repositories/participants.repository';
import { createAuditEvent } from '../../db/repositories/audit-events.repository';
import {
  calculatePoints,
  MAX_POSSIBLE_SCORE,
  QUESTION_DURATION_SECONDS,
  reconcileScores,
} from './scoring';
import {
  DeviceNotActiveError,
  GameAlreadyCompletedError,
  GameNotActiveError,
  GameNotConfiguredError,
  GameNotFoundError,
  GameSequenceIntegrityError,
  InvalidAnswerOptionError,
  QuestionNotResolvedError,
  QuestionPositionMismatchError,
  SessionExpiredError,
  SessionNotFoundError,
} from './errors';

import type {
  ActiveQuestionView,
  AdvanceGameResult,
  AnswerFeedbackView,
  DifficultyBreakdown,
  GameResultsView,
  GameStateResult,
  StartGameResult,
  SubmitAnswerResult,
} from './types';
import type { QuestionDifficulty } from './constants';

const QUESTION_DURATION_MS = QUESTION_DURATION_SECONDS * 1000;

function sanitizeQuestion(
  question: GameQuestion,
  targetAlias: string | null,
  now = new Date()
): ActiveQuestionView {
  return {
    position: question.position,
    difficulty: question.difficulty as QuestionDifficulty,
    targetAlias,
    isGroup: question.targetParticipantId === null,
    prompt: question.promptSnapshot,
    optionA: question.optionASnapshot,
    optionB: question.optionBSnapshot,
    optionC: question.optionCSnapshot,
    optionD: question.optionDSnapshot,
    presentedAt: question.presentedAt?.toISOString() ?? null,
    expiresAt: question.expiresAt?.toISOString() ?? null,
    serverNow: now.toISOString(),
    questionId: question.questionId,
  };
}

/**
 * Inicia la partida congelada transaccionalmente:
 * - Pasa status de 'created' a 'active'.
 * - Inicia temporizador para la pregunta 1 (server NOW + 20s).
 * - Es idempotente si la partida ya está activa.
 */
export async function startGame(
  db: Database,
  rawCookieToken: string | undefined,
  explicitNow?: Date
): Promise<StartGameResult> {
  const now = explicitNow ?? new Date();
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

  const gameSession = await getGameSessionByTableSessionId(db, session.id);
  if (!gameSession) {
    throw new GameNotFoundError();
  }

  if (gameSession.status === 'completed') {
    throw new GameAlreadyCompletedError();
  }

  return db.transaction(async (tx) => {
    const [lockedGame] = await tx
      .select()
      .from(gameSessions)
      .where(eq(gameSessions.id, gameSession.id))
      .for('update');

    if (!lockedGame) {
      throw new GameNotFoundError();
    }

    if (lockedGame.status === 'completed') {
      throw new GameAlreadyCompletedError();
    }

    // Idempotencia si ya está activa
    if (lockedGame.status === 'active') {
      const q1 = await getGameQuestionByPosition(tx, lockedGame.id, 1);
      if (!q1) {
        throw new GameSequenceIntegrityError();
      }

      let alias: string | null = null;
      if (q1.targetParticipantId) {
        const p = await getParticipantById(tx, q1.targetParticipantId);
        alias = p?.alias ?? null;
      }

      return {
        ok: true,
        game: {
          id: lockedGame.id,
          status: 'active',
          currentQuestionIndex: lockedGame.currentQuestionIndex,
          currentPosition: lockedGame.currentQuestionIndex + 1,
        },
        question: sanitizeQuestion(q1, alias, now),
      };
    }

    if (lockedGame.status !== 'created') {
      throw new GameNotActiveError('La partida no se encuentra en estado preparatorio.');
    }

    const allQuestions = await getGameQuestionsBySessionId(tx, lockedGame.id);
    if (allQuestions.length !== 10) {
      throw new GameSequenceIntegrityError();
    }

    const q1 = allQuestions.find((q) => q.position === 1);
    if (!q1) {
      throw new GameSequenceIntegrityError();
    }

    // Configurar temporizador autoritativo de servidor para la pregunta 1
    const presentedAt = explicitNow ?? new Date();
    const expiresAt = new Date(presentedAt.getTime() + QUESTION_DURATION_MS);
    await updateGameQuestionTiming(tx, q1.id, presentedAt, expiresAt);

    // Activar sesión de juego
    await updateGameSessionStatus(tx, lockedGame.id, 'active', presentedAt);

    // Auditoría
    await createAuditEvent(tx, {
      venueId: session.venueId,
      eventType: 'game_started',
      entityType: 'game_session',
      entityId: lockedGame.id,
      actorType: 'device',
      actorId: device.id,
      metadata: {
        gameSessionId: lockedGame.id,
        firstQuestionId: q1.questionId,
        presentedAt: presentedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
      },
    });

    let alias: string | null = null;
    if (q1.targetParticipantId) {
      const p = await getParticipantById(tx, q1.targetParticipantId);
      alias = p?.alias ?? null;
    }

    const updatedQ1: GameQuestion = {
      ...q1,
      presentedAt,
      expiresAt,
    };

    return {
      ok: true,
      game: {
        id: lockedGame.id,
        status: 'active',
        currentQuestionIndex: 0,
        currentPosition: 1,
      },
      question: sanitizeQuestion(updatedQ1, alias, explicitNow ?? new Date()),
    };
  });
}

/**
 * Consulta el estado actual del juego:
 * - Si la pregunta activa superó expires_at y no fue respondida, la normaliza perezosamente como unanswered.
 * - Si está resuelta, entrega el feedback (incluyendo correctOption y explicación).
 * - Si está abierta, entrega la pregunta sanitizada SIN revelar la respuesta correcta ni explicación.
 */
export async function getGameState(
  db: Database,
  rawCookieToken: string | undefined,
  now = new Date()
): Promise<GameStateResult> {
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

  const gameSession = await getGameSessionByTableSessionId(db, session.id);
  if (!gameSession) {
    throw new GameNotFoundError();
  }

  const category = gameSession.categoryId
    ? await getCategoryById(db, gameSession.categoryId)
    : null;

  const baseGameInfo = {
    id: gameSession.id,
    status: gameSession.status,
    currentQuestionIndex: gameSession.currentQuestionIndex,
    currentPosition: Math.min(gameSession.currentQuestionIndex + 1, 10),
    totalQuestions: 10,
    totalScore: gameSession.totalScore,
    correctCount: gameSession.correctCount,
    incorrectCount: gameSession.incorrectCount,
    unansweredCount: gameSession.unansweredCount,
    category: {
      slug: category?.slug ?? 'mixed',
      name: category?.name ?? 'Categorías mixtas',
    },
    group: {
      name: group.name,
    },
    table: {
      code: table.code,
      displayName: table.displayName,
    },
  };

  if (gameSession.status === 'completed') {
    return {
      ok: true,
      game: baseGameInfo,
      question: null,
      feedback: null,
      isResolved: true,
      next: '/play/results',
    };
  }

  if (gameSession.status === 'created') {
    return {
      ok: true,
      game: baseGameInfo,
      question: null,
      feedback: null,
      isResolved: false,
    };
  }

  if (gameSession.status !== 'active') {
    throw new GameNotActiveError();
  }

  const currentPosition = gameSession.currentQuestionIndex + 1;
  const currentQuestion = await getGameQuestionByPosition(db, gameSession.id, currentPosition);
  if (!currentQuestion) {
    throw new GameSequenceIntegrityError();
  }

  let alias: string | null = null;
  if (currentQuestion.targetParticipantId) {
    const p = await getParticipantById(db, currentQuestion.targetParticipantId);
    alias = p?.alias ?? null;
  }

  let answer = await getAnswerByGameQuestionId(db, currentQuestion.id);

  // Normalización perezosa si expiró y no tiene respuesta
  if (!answer && currentQuestion.expiresAt && now.getTime() > currentQuestion.expiresAt.getTime()) {
    try {
      answer = await db.transaction(async (tx) => {
        const existing = await getAnswerByGameQuestionId(tx, currentQuestion.id);
        if (existing) return existing;

        const created = await createAnswer(tx, {
          gameSessionId: gameSession.id,
          gameQuestionId: currentQuestion.id,
          selectedOption: null,
          result: 'unanswered',
          pointsAwarded: 0,
          answeredAt: now,
        });

        await updateGameSessionScoreAndCounts(tx, gameSession.id, 0, 'unanswered');

        await createAuditEvent(tx, {
          venueId: session.venueId,
          eventType: 'question_answered',
          entityType: 'game_question',
          entityId: currentQuestion.id,
          actorType: 'system',
          actorId: 'server-lazy-evaluator',
          metadata: {
            gameSessionId: gameSession.id,
            position: currentQuestion.position,
            result: 'unanswered',
            reason: 'timer_expired_lazy_normalization',
          },
        });

        return created;
      });

      baseGameInfo.unansweredCount += 1;
    } catch {
      answer = await getAnswerByGameQuestionId(db, currentQuestion.id);
    }
  }

  if (answer) {
    // Pregunta resuelta: seguro exponer respuesta correcta y explicación
    const feedback: AnswerFeedbackView = {
      result: answer.result as 'correct' | 'incorrect' | 'unanswered',
      selectedOption: answer.selectedOption as 'A' | 'B' | 'C' | 'D' | null,
      correctOption: currentQuestion.correctOptionSnapshot as 'A' | 'B' | 'C' | 'D',
      explanation: currentQuestion.explanationSnapshot,
      pointsAwarded: answer.pointsAwarded,
      totalScore: baseGameInfo.totalScore,
    };

    return {
      ok: true,
      game: baseGameInfo,
      question: sanitizeQuestion(currentQuestion, alias, new Date()),
      feedback,
      isResolved: true,
      next: currentPosition === 10 ? '/play/results' : undefined,
    };
  }

  // Pregunta abierta: ZERO LEAKAGE
  return {
    ok: true,
    game: baseGameInfo,
    question: sanitizeQuestion(currentQuestion, alias, new Date()),
    feedback: null,
    isResolved: false,
  };
}

/**
 * Registra una respuesta para la pregunta activa:
 * - Valida opción ('A'|'B'|'C'|'D').
 * - Autoridad del servidor: valida expires_at según receivedAt. Si expiró, registra 'unanswered' (+0).
 * - Si está en tiempo, compara con correctOptionSnapshot y asigna puntos sin bonus de velocidad.
 * - Idempotente ante reenvíos para la misma pregunta.
 * - Recuperación contra lazy-normalization si la respuesta llegó antes del deadline.
 */
export async function submitAnswer(
  db: Database,
  rawCookieToken: string | undefined,
  selectedOption: 'A' | 'B' | 'C' | 'D',
  receivedAt = new Date(),
  validation?: { expectedPosition?: number; expectedQuestionId?: string }
): Promise<SubmitAnswerResult> {
  if (!rawCookieToken || rawCookieToken.trim() === '') {
    throw new SessionNotFoundError();
  }

  const validOptions = ['A', 'B', 'C', 'D'];
  if (!validOptions.includes(selectedOption)) {
    throw new InvalidAnswerOptionError();
  }

  const resolved = await resolveSessionFromCookie(db, rawCookieToken, receivedAt);
  if (!resolved) {
    throw new SessionExpiredError();
  }

  const { device, session } = resolved;
  if (device.status !== 'active' || session.activeDeviceId !== device.id) {
    throw new DeviceNotActiveError();
  }

  const gameSession = await getGameSessionByTableSessionId(db, session.id);
  if (!gameSession) {
    throw new GameNotFoundError();
  }

  if (gameSession.status === 'completed') {
    throw new GameAlreadyCompletedError();
  }

  if (gameSession.status !== 'active') {
    throw new GameNotActiveError();
  }

  return db.transaction(async (tx) => {
    const [lockedGame] = await tx
      .select()
      .from(gameSessions)
      .where(eq(gameSessions.id, gameSession.id))
      .for('update');

    if (!lockedGame || lockedGame.status !== 'active') {
      throw new GameNotActiveError();
    }

    const currentPosition = lockedGame.currentQuestionIndex + 1;

    // Validación de identidad de pregunta para prevenir responder preguntas pasadas o futuras en reintentos
    if (validation?.expectedPosition && validation.expectedPosition !== currentPosition) {
      if (validation.expectedPosition < currentPosition) {
        // La pregunta ya avanzó: recuperar feedback registrado previamente para no desfasar
        const pastQuestion = await getGameQuestionByPosition(
          tx,
          lockedGame.id,
          validation.expectedPosition
        );
        if (pastQuestion) {
          const pastAnswer = await getAnswerByGameQuestionId(tx, pastQuestion.id);
          if (pastAnswer) {
            return {
              ok: true,
              answer: {
                result: pastAnswer.result as 'correct' | 'incorrect' | 'unanswered',
                selectedOption: pastAnswer.selectedOption as 'A' | 'B' | 'C' | 'D' | null,
                correctOption: pastQuestion.correctOptionSnapshot as 'A' | 'B' | 'C' | 'D',
                explanation: pastQuestion.explanationSnapshot,
                pointsAwarded: pastAnswer.pointsAwarded,
                totalScore: lockedGame.totalScore,
              },
              isLastQuestion: validation.expectedPosition === 10,
            };
          }
        }
      }
      throw new QuestionPositionMismatchError();
    }

    const question = await getGameQuestionByPosition(tx, lockedGame.id, currentPosition);
    if (!question) {
      throw new GameSequenceIntegrityError();
    }

    if (
      validation?.expectedQuestionId &&
      question.questionId !== validation.expectedQuestionId &&
      question.id !== validation.expectedQuestionId
    ) {
      throw new QuestionPositionMismatchError();
    }

    // Idempotencia y protección contra carreras con lazy-evaluation
    const existingAnswer = await getAnswerByGameQuestionId(tx, question.id);
    if (existingAnswer) {
      // Si el usuario ya respondió con una opción explícita (A, B, C, D)
      if (existingAnswer.selectedOption !== null) {
        return {
          ok: true,
          answer: {
            result: existingAnswer.result as 'correct' | 'incorrect' | 'unanswered',
            selectedOption: existingAnswer.selectedOption as 'A' | 'B' | 'C' | 'D' | null,
            correctOption: question.correctOptionSnapshot as 'A' | 'B' | 'C' | 'D',
            explanation: question.explanationSnapshot,
            pointsAwarded: existingAnswer.pointsAwarded,
            totalScore: lockedGame.totalScore,
          },
          isLastQuestion: currentPosition === 10,
        };
      }

      // Si la respuesta fue registrada como 'unanswered' por normalización perezosa
      // pero la petición real llegó a tiempo (receivedAt <= expiresAt):
      const wasReceivedOnTime =
        question.expiresAt && receivedAt.getTime() <= question.expiresAt.getTime();

      if (wasReceivedOnTime) {
        const isCorrect = selectedOption === question.correctOptionSnapshot;
        const resultType = isCorrect ? 'correct' : 'incorrect';
        const pointsAwarded = calculatePoints(
          question.difficulty as 'initial' | 'medium' | 'advanced',
          resultType
        );

        await updateAnswer(tx, existingAnswer.id, {
          selectedOption,
          result: resultType,
          pointsAwarded,
          answeredAt: receivedAt,
        });

        const [updatedGame] = await tx
          .update(gameSessions)
          .set({
            totalScore: sql<number>`${gameSessions.totalScore} + ${pointsAwarded}`,
            unansweredCount: sql<number>`GREATEST(0, ${gameSessions.unansweredCount} - 1)`,
            correctCount: sql<number>`${gameSessions.correctCount} + ${resultType === 'correct' ? 1 : 0}`,
            incorrectCount: sql<number>`${gameSessions.incorrectCount} + ${resultType === 'incorrect' ? 1 : 0}`,
            updatedAt: new Date(),
          })
          .where(eq(gameSessions.id, lockedGame.id))
          .returning();

        const currentTotalScore = updatedGame
          ? updatedGame.totalScore
          : lockedGame.totalScore + pointsAwarded;

        await createAuditEvent(tx, {
          venueId: session.venueId,
          eventType: 'question_answered',
          entityType: 'game_question',
          entityId: question.id,
          actorType: 'device',
          actorId: device.id,
          metadata: {
            gameSessionId: lockedGame.id,
            position: currentPosition,
            selectedOption,
            result: resultType,
            pointsAwarded,
            totalScore: currentTotalScore,
            recoveredFromLazyTimeout: true,
          },
        });

        return {
          ok: true,
          answer: {
            result: resultType,
            selectedOption,
            correctOption: question.correctOptionSnapshot as 'A' | 'B' | 'C' | 'D',
            explanation: question.explanationSnapshot,
            pointsAwarded,
            totalScore: currentTotalScore,
          },
          isLastQuestion: currentPosition === 10,
        };
      }

      // Expiró realmente y ya estaba unanswered
      return {
        ok: true,
        answer: {
          result: 'unanswered',
          selectedOption: null,
          correctOption: question.correctOptionSnapshot as 'A' | 'B' | 'C' | 'D',
          explanation: question.explanationSnapshot,
          pointsAwarded: 0,
          totalScore: lockedGame.totalScore,
        },
        isLastQuestion: currentPosition === 10,
      };
    }

    // Autoridad estricta del temporizador en servidor según receivedAt
    const isExpired = question.expiresAt && receivedAt.getTime() > question.expiresAt.getTime();

    if (isExpired) {
      // Expirada: 0 puntos
      await createAnswer(tx, {
        gameSessionId: lockedGame.id,
        gameQuestionId: question.id,
        selectedOption: null,
        result: 'unanswered',
        pointsAwarded: 0,
        answeredAt: receivedAt,
      });

      const updatedGame = await updateGameSessionScoreAndCounts(tx, lockedGame.id, 0, 'unanswered');

      await createAuditEvent(tx, {
        venueId: session.venueId,
        eventType: 'question_answered',
        entityType: 'game_question',
        entityId: question.id,
        actorType: 'device',
        actorId: device.id,
        metadata: {
          gameSessionId: lockedGame.id,
          position: currentPosition,
          selectedOption: null,
          result: 'unanswered',
          reason: 'timer_expired_server_authority',
          pointsAwarded: 0,
        },
      });

      return {
        ok: true,
        answer: {
          result: 'unanswered',
          selectedOption: null,
          correctOption: question.correctOptionSnapshot as 'A' | 'B' | 'C' | 'D',
          explanation: question.explanationSnapshot,
          pointsAwarded: 0,
          totalScore: updatedGame.totalScore,
        },
        isLastQuestion: currentPosition === 10,
      };
    }

    // En tiempo: calcular resultado y puntos oficiales
    const isCorrect = selectedOption === question.correctOptionSnapshot;
    const resultType = isCorrect ? 'correct' : 'incorrect';
    const pointsAwarded = calculatePoints(
      question.difficulty as 'initial' | 'medium' | 'advanced',
      resultType
    );

    await createAnswer(tx, {
      gameSessionId: lockedGame.id,
      gameQuestionId: question.id,
      selectedOption,
      result: resultType,
      pointsAwarded,
      answeredAt: receivedAt,
    });

    const updatedGame = await updateGameSessionScoreAndCounts(
      tx,
      lockedGame.id,
      pointsAwarded,
      resultType
    );

    await createAuditEvent(tx, {
      venueId: session.venueId,
      eventType: 'question_answered',
      entityType: 'game_question',
      entityId: question.id,
      actorType: 'device',
      actorId: device.id,
      metadata: {
        gameSessionId: lockedGame.id,
        position: currentPosition,
        selectedOption,
        result: resultType,
        pointsAwarded,
        totalScore: updatedGame.totalScore,
      },
    });

    return {
      ok: true,
      answer: {
        result: resultType,
        selectedOption,
        correctOption: question.correctOptionSnapshot as 'A' | 'B' | 'C' | 'D',
        explanation: question.explanationSnapshot,
        pointsAwarded,
        totalScore: updatedGame.totalScore,
      },
      isLastQuestion: currentPosition === 10,
    };
  });
}

/**
 * Avanza a la siguiente pregunta de la partida o completa el juego:
 * - Valida que la pregunta actual esté resuelta (o normaliza perezosamente si expiró).
 * - Si posición < 10, incrementa currentQuestionIndex y activa temporizador para la siguiente.
 * - Si posición === 10, marca la partida como 'completed' y registra finished_at.
 * - Idempotente si la partida ya fue completada.
 */
export async function advanceGame(
  db: Database,
  rawCookieToken: string | undefined,
  explicitNow?: Date
): Promise<AdvanceGameResult> {
  const now = explicitNow ?? new Date();
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

  const gameSession = await getGameSessionByTableSessionId(db, session.id);
  if (!gameSession) {
    throw new GameNotFoundError();
  }

  return db.transaction(async (tx) => {
    const [lockedGame] = await tx
      .select()
      .from(gameSessions)
      .where(eq(gameSessions.id, gameSession.id))
      .for('update');

    if (!lockedGame) {
      throw new GameNotFoundError();
    }

    if (lockedGame.status === 'completed') {
      return {
        ok: true,
        advanced: false,
        completed: true,
        next: '/play/results',
      };
    }

    if (lockedGame.status !== 'active') {
      throw new GameNotActiveError();
    }

    const currentPosition = lockedGame.currentQuestionIndex + 1;
    const currentQuestion = await getGameQuestionByPosition(tx, lockedGame.id, currentPosition);
    if (!currentQuestion) {
      throw new GameSequenceIntegrityError();
    }

    let answer = await getAnswerByGameQuestionId(tx, currentQuestion.id);

    // Si aún no está respondida, verificar si expiró
    if (!answer) {
      if (currentQuestion.expiresAt && now.getTime() > currentQuestion.expiresAt.getTime()) {
        answer = await createAnswer(tx, {
          gameSessionId: lockedGame.id,
          gameQuestionId: currentQuestion.id,
          selectedOption: null,
          result: 'unanswered',
          pointsAwarded: 0,
          answeredAt: now,
        });

        await updateGameSessionScoreAndCounts(tx, lockedGame.id, 0, 'unanswered');

        await createAuditEvent(tx, {
          venueId: session.venueId,
          eventType: 'question_answered',
          entityType: 'game_question',
          entityId: currentQuestion.id,
          actorType: 'system',
          actorId: 'server-lazy-evaluator',
          metadata: {
            gameSessionId: lockedGame.id,
            position: currentPosition,
            result: 'unanswered',
            reason: 'advance_lazy_normalization',
          },
        });
      } else {
        throw new QuestionNotResolvedError();
      }
    }

    if (currentPosition < 10) {
      const nextIndex = lockedGame.currentQuestionIndex + 1;
      const nextPosition = nextIndex + 1;

      await advanceGameSessionQuestion(tx, lockedGame.id, nextIndex);

      const nextQuestion = await getGameQuestionByPosition(tx, lockedGame.id, nextPosition);
      if (!nextQuestion) {
        throw new GameSequenceIntegrityError();
      }

      const presentedAt = explicitNow ?? new Date();
      const expiresAt = new Date(presentedAt.getTime() + QUESTION_DURATION_MS);
      await updateGameQuestionTiming(tx, nextQuestion.id, presentedAt, expiresAt);

      await createAuditEvent(tx, {
        venueId: session.venueId,
        eventType: 'question_presented',
        entityType: 'game_question',
        entityId: nextQuestion.id,
        actorType: 'device',
        actorId: device.id,
        metadata: {
          gameSessionId: lockedGame.id,
          position: nextPosition,
          presentedAt: presentedAt.toISOString(),
          expiresAt: expiresAt.toISOString(),
        },
      });

      let alias: string | null = null;
      if (nextQuestion.targetParticipantId) {
        const p = await getParticipantById(tx, nextQuestion.targetParticipantId);
        alias = p?.alias ?? null;
      }

      const updatedNextQuestion: GameQuestion = {
        ...nextQuestion,
        presentedAt,
        expiresAt,
      };

      return {
        ok: true,
        advanced: true,
        completed: false,
        currentQuestionIndex: nextIndex,
        currentPosition: nextPosition,
        question: sanitizeQuestion(updatedNextQuestion, alias, explicitNow ?? new Date()),
      };
    }

    // Posición 10: Finalizar la partida
    await updateGameSessionStatus(tx, lockedGame.id, 'completed', undefined, now);

    // Si corresponde a una competencia, actualizar ciclo/entrada
    try {
      const { handleGameSessionCompletion } = await import('@/modules/competitions');
      await handleGameSessionCompletion(tx, lockedGame.id);
    } catch {
      // No bloquear avance si no pertenece a competencia
    }

    await createAuditEvent(tx, {
      venueId: session.venueId,
      eventType: 'game_completed',
      entityType: 'game_session',
      entityId: lockedGame.id,
      actorType: 'device',
      actorId: device.id,
      metadata: {
        gameSessionId: lockedGame.id,
        totalScore: lockedGame.totalScore,
        correctCount: lockedGame.correctCount,
        incorrectCount: lockedGame.incorrectCount,
        unansweredCount: lockedGame.unansweredCount,
        finishedAt: now.toISOString(),
      },
    });

    return {
      ok: true,
      advanced: true,
      completed: true,
      next: '/play/results',
    };
  });
}

/**
 * Obtiene los datos consolidados y reconciliados para la pantalla final /play/results.
 */
export async function getGameResults(
  db: Database,
  rawCookieToken: string | undefined,
  now = new Date()
): Promise<GameResultsView> {
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

  const gameSession = await getGameSessionByTableSessionId(db, session.id);
  if (!gameSession) {
    throw new GameNotFoundError();
  }

  if (gameSession.status !== 'completed') {
    throw new GameNotActiveError('La partida aún no ha finalizado.');
  }

  const category = gameSession.categoryId
    ? await getCategoryById(db, gameSession.categoryId)
    : null;

  const allQuestions = await getGameQuestionsBySessionId(db, gameSession.id);
  const allAnswers = await getAnswersByGameSessionId(db, gameSession.id);

  // Reconciliación de integridad
  const { isConsistent, calculatedTotal } = reconcileScores(allAnswers, gameSession.totalScore);
  if (!isConsistent) {
    console.warn(
      `Puntaje inconsistente detectado en sesión ${gameSession.id}: almacenado ${gameSession.totalScore}, calculado ${calculatedTotal}`
    );
  }

  // Desglose por dificultad
  const breakdown: DifficultyBreakdown = {
    initial: { total: 0, correct: 0, score: 0, maxScore: 300 },
    medium: { total: 0, correct: 0, score: 0, maxScore: 600 },
    advanced: { total: 0, correct: 0, score: 0, maxScore: 600 },
  };

  const answerMap = new Map(allAnswers.map((a) => [a.gameQuestionId, a]));

  for (const q of allQuestions) {
    const diff = q.difficulty as 'initial' | 'medium' | 'advanced';
    const ans = answerMap.get(q.id);

    breakdown[diff].total += 1;
    if (ans) {
      breakdown[diff].score += ans.pointsAwarded;
      if (ans.result === 'correct') {
        breakdown[diff].correct += 1;
      }
    }
  }

  return {
    ok: true,
    game: {
      id: gameSession.id,
      status: 'completed',
      startedAt: gameSession.startedAt?.toISOString() ?? null,
      finishedAt: gameSession.finishedAt?.toISOString() ?? null,
      totalScore: gameSession.totalScore,
      maxScore: MAX_POSSIBLE_SCORE,
      correctCount: gameSession.correctCount,
      incorrectCount: gameSession.incorrectCount,
      unansweredCount: gameSession.unansweredCount,
      category: {
        slug: category?.slug ?? 'mixed',
        name: category?.name ?? 'Categorías mixtas',
      },
      group: {
        name: group.name,
      },
      table: {
        code: table.code,
        displayName: table.displayName,
      },
      breakdown,
    },
  };
}

/**
 * Cierra voluntariamente la sesión de mesa:
 * - Pasa table_session a 'closed' con cooldown_until = NOW + 120s.
 * - Revoca el dispositivo activo.
 * - Pasa la mesa a 'cooldown'.
 * - Registra eventos de auditoría.
 */
export async function closeTableSession(
  db: Database,
  rawCookieToken: string | undefined,
  now = new Date()
): Promise<{ ok: true; message: string; next: string }> {
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

  const cooldownUntil = new Date(now.getTime() + COOLDOWN_DURATION_MS);

  await db.transaction(async (tx) => {
    // 1. Cerrar sesión de mesa
    await updateSessionStatus(tx, session.id, 'closed', now, cooldownUntil);

    // 2. Revocar dispositivo
    await revokeDevice(tx, device.id, now);

    // 3. Colocar mesa en cooldown
    await updateTableStatus(tx, table.id, 'cooldown');

    // 4. Auditoría
    await createAuditEvent(tx, {
      venueId: session.venueId,
      eventType: 'session_closed',
      entityType: 'table_session',
      entityId: session.id,
      actorType: 'device',
      actorId: device.id,
      metadata: {
        tableId: table.id,
        tableCode: table.code,
        closedAt: now.toISOString(),
        cooldownUntil: cooldownUntil.toISOString(),
      },
    });

    await createAuditEvent(tx, {
      venueId: session.venueId,
      eventType: 'table_cooldown_started',
      entityType: 'table',
      entityId: table.id,
      actorType: 'system',
      actorId: 'server-session-close',
      metadata: {
        cooldownUntil: cooldownUntil.toISOString(),
        durationMs: COOLDOWN_DURATION_MS,
      },
    });
  });

  return {
    ok: true,
    message: 'Sesión finalizada con éxito.',
    next: '/',
  };
}
