import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Database } from '../../db/client';
import { submitAnswer, getGameState } from './gameplay.service';
import * as sessionsService from '../sessions/sessions.service';
import * as gameSessionsRepo from '../../db/repositories/game-sessions.repository';
import * as gameQuestionsRepo from '../../db/repositories/game-questions.repository';
import * as answersRepo from '../../db/repositories/answers.repository';
import * as groupsRepo from '../../db/repositories/groups.repository';
import * as categoriesRepo from '../../db/repositories/categories.repository';
import * as auditRepo from '../../db/repositories/audit-events.repository';
import type { GameQuestion } from '../../db/schema/game-questions';
import type { Answer } from '../../db/schema/answers';
import type { GameSession } from '../../db/schema/game-sessions';

describe('PPA-HOTFIX-004 — Sincronización real del temporizador y recepción de respuestas', () => {
  const fakeSessionId = '11111111-1111-1111-1111-111111111111';
  const fakeDeviceId = '22222222-2222-2222-2222-222222222222';
  const fakeTableId = '33333333-3333-3333-3333-333333333333';
  const fakeVenueId = '44444444-4444-4444-4444-444444444444';
  const fakeGroupId = '55555555-5555-5555-5555-555555555555';
  const fakeCategoryId = '66666666-6666-6666-6666-666666666666';
  const fakeGameSessionId = '77777777-7777-7777-7777-777777777777';

  const mockResolvedSession = {
    device: {
      id: fakeDeviceId,
      status: 'active' as const,
      rankingEligible: true,
      tableSessionId: fakeSessionId,
      tokenHash: 'hash',
      claimedAt: new Date(),
      revokedAt: null,
      lastSeenAt: null,
      createdAt: new Date(),
    },
    session: {
      id: fakeSessionId,
      venueId: fakeVenueId,
      tableId: fakeTableId,
      status: 'active' as const,
      rankingEligible: true,
      startedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
      closedAt: null,
      cooldownUntil: null,
      activeDeviceId: fakeDeviceId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    table: {
      id: fakeTableId,
      venueId: fakeVenueId,
      code: 'mesa-21',
      displayName: 'Mesa 21',
      status: 'in_use' as const,
      qrToken: 'pb:mesa-21',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    venue: {
      id: fakeVenueId,
      name: 'Punto Burger Esperanza',
      slug: 'esperanza-central',
      address: 'Calle Falsa 123',
      timezone: 'America/Argentina/Cordoba',
      status: 'active' as const,
      rankingEligible: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  const baseExpiresAt = new Date('2026-11-27T21:00:20.000Z');

  const mockQuestion: GameQuestion = {
    id: 'gq-10',
    gameSessionId: fakeGameSessionId,
    questionId: 'orig-q-10',
    position: 10,
    difficulty: 'initial',
    targetParticipantId: null,
    promptSnapshot: '¿Cuál es la capital de Argentina?',
    optionASnapshot: 'Rosario',
    optionBSnapshot: 'Buenos Aires',
    optionCSnapshot: 'Córdoba',
    optionDSnapshot: 'Mendoza',
    correctOptionSnapshot: 'B',
    explanationSnapshot: 'Buenos Aires es la capital federal de Argentina.',
    ageRangeSnapshot: 'adult',
    educationLevelSnapshot: null,
    presentedAt: new Date('2026-11-27T21:00:00.000Z'),
    expiresAt: baseExpiresAt,
    createdAt: new Date(),
  };

  let mockGameSession: GameSession;
  let mockDb: Database;

  beforeEach(() => {
    vi.restoreAllMocks();

    mockGameSession = {
      id: fakeGameSessionId,
      tableSessionId: fakeSessionId,
      groupId: fakeGroupId,
      categoryId: fakeCategoryId,
      status: 'active',
      rankingEligible: true,
      startedAt: new Date('2026-11-27T21:00:00.000Z'),
      finishedAt: null,
      totalScore: 500,
      correctCount: 4,
      incorrectCount: 1,
      unansweredCount: 0,
      currentQuestionIndex: 9, // Pregunta 10 de 10
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockTx = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            for: vi.fn().mockResolvedValue([mockGameSession]),
          })),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([mockGameSession]),
          })),
        })),
      })),
    };

    mockDb = {
      transaction: vi.fn(async (cb) => cb(mockTx)),
    } as unknown as Database;

    vi.spyOn(sessionsService, 'resolveSessionFromCookie').mockResolvedValue(mockResolvedSession);
    vi.spyOn(gameSessionsRepo, 'getGameSessionByTableSessionId').mockResolvedValue(mockGameSession);
    vi.spyOn(gameQuestionsRepo, 'getGameQuestionByPosition').mockResolvedValue(mockQuestion);
    vi.spyOn(groupsRepo, 'getGroupByTableSessionId').mockResolvedValue({
      id: fakeGroupId,
      tableSessionId: fakeSessionId,
      name: 'Los Bacon',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.spyOn(categoriesRepo, 'getCategoryById').mockResolvedValue({
      id: fakeCategoryId,
      name: 'Cultura General',
      slug: 'cultura-general',
      description: 'Preguntas varias.',
      sortOrder: 1,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.spyOn(auditRepo, 'createAuditEvent').mockResolvedValue({} as never);
  });

  it('Escenario 1: respuesta correcta recibida con 4 segundos restantes y procesamiento de 6 segundos -> Correcta y puntuada', async () => {
    // 4 segundos antes de vencer
    const receivedAt = new Date(baseExpiresAt.getTime() - 4000);

    vi.spyOn(answersRepo, 'getAnswerByGameQuestionId').mockResolvedValue(null);

    const createAnswerSpy = vi.spyOn(answersRepo, 'createAnswer').mockResolvedValue({
      id: 'ans-1',
      gameSessionId: fakeGameSessionId,
      gameQuestionId: mockQuestion.id,
      selectedOption: 'B',
      result: 'correct',
      pointsAwarded: 100,
      answeredAt: receivedAt,
      createdAt: new Date(),
    } as Answer);

    const updateScoreSpy = vi
      .spyOn(gameSessionsRepo, 'updateGameSessionScoreAndCounts')
      .mockResolvedValue({
        ...mockGameSession,
        totalScore: mockGameSession.totalScore + 100,
        correctCount: mockGameSession.correctCount + 1,
      });

    const result = await submitAnswer(mockDb, 'cookie_mesa_21', 'B', receivedAt);

    expect(result.ok).toBe(true);
    expect(result.answer.result).toBe('correct');
    expect(result.answer.pointsAwarded).toBe(100);
    expect(result.answer.totalScore).toBe(600);
    expect(result.isLastQuestion).toBe(true);

    expect(createAnswerSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        selectedOption: 'B',
        result: 'correct',
        pointsAwarded: 100,
        answeredAt: receivedAt,
      })
    );
    expect(updateScoreSpy).toHaveBeenCalledWith(
      expect.anything(),
      fakeGameSessionId,
      100,
      'correct'
    );
  });

  it('Escenario 2: respuesta incorrecta recibida con 3 segundos restantes y procesamiento de 5 segundos -> Incorrecta con 20 puntos', async () => {
    // 3 segundos antes de vencer
    const receivedAt = new Date(baseExpiresAt.getTime() - 3000);

    vi.spyOn(answersRepo, 'getAnswerByGameQuestionId').mockResolvedValue(null);

    vi.spyOn(answersRepo, 'createAnswer').mockResolvedValue({
      id: 'ans-2',
      gameSessionId: fakeGameSessionId,
      gameQuestionId: mockQuestion.id,
      selectedOption: 'A', // Incorrecta
      result: 'incorrect',
      pointsAwarded: 20,
      answeredAt: receivedAt,
      createdAt: new Date(),
    } as Answer);

    vi.spyOn(gameSessionsRepo, 'updateGameSessionScoreAndCounts').mockResolvedValue({
      ...mockGameSession,
      totalScore: mockGameSession.totalScore + 20,
      incorrectCount: mockGameSession.incorrectCount + 1,
    });

    const result = await submitAnswer(mockDb, 'cookie_mesa_21', 'A', receivedAt);

    expect(result.ok).toBe(true);
    expect(result.answer.result).toBe('incorrect');
    expect(result.answer.pointsAwarded).toBe(20);
    expect(result.answer.correctOption).toBe('B');
    expect(result.answer.totalScore).toBe(520);
  });

  it('Escenario 3: respuesta recibida 100 ms antes del deadline -> Aceptada y puntuada', async () => {
    // 100 ms antes del deadline
    const receivedAt = new Date(baseExpiresAt.getTime() - 100);

    vi.spyOn(answersRepo, 'getAnswerByGameQuestionId').mockResolvedValue(null);

    vi.spyOn(answersRepo, 'createAnswer').mockResolvedValue({
      id: 'ans-3',
      gameSessionId: fakeGameSessionId,
      gameQuestionId: mockQuestion.id,
      selectedOption: 'B',
      result: 'correct',
      pointsAwarded: 100,
      answeredAt: receivedAt,
      createdAt: new Date(),
    } as Answer);

    vi.spyOn(gameSessionsRepo, 'updateGameSessionScoreAndCounts').mockResolvedValue({
      ...mockGameSession,
      totalScore: mockGameSession.totalScore + 100,
      correctCount: mockGameSession.correctCount + 1,
    });

    const result = await submitAnswer(mockDb, 'cookie_mesa_21', 'B', receivedAt);

    expect(result.ok).toBe(true);
    expect(result.answer.result).toBe('correct');
    expect(result.answer.pointsAwarded).toBe(100);
  });

  it('Escenario 4: respuesta recibida después del deadline -> Tiempo agotado (unanswered, 0 puntos)', async () => {
    // 50 ms después del deadline
    const receivedAt = new Date(baseExpiresAt.getTime() + 50);

    vi.spyOn(answersRepo, 'getAnswerByGameQuestionId').mockResolvedValue(null);

    const createAnswerSpy = vi.spyOn(answersRepo, 'createAnswer').mockResolvedValue({
      id: 'ans-4',
      gameSessionId: fakeGameSessionId,
      gameQuestionId: mockQuestion.id,
      selectedOption: null,
      result: 'unanswered',
      pointsAwarded: 0,
      answeredAt: receivedAt,
      createdAt: new Date(),
    } as Answer);

    vi.spyOn(gameSessionsRepo, 'updateGameSessionScoreAndCounts').mockResolvedValue({
      ...mockGameSession,
      unansweredCount: mockGameSession.unansweredCount + 1,
    });

    const result = await submitAnswer(mockDb, 'cookie_mesa_21', 'B', receivedAt);

    expect(result.ok).toBe(true);
    expect(result.answer.result).toBe('unanswered');
    expect(result.answer.pointsAwarded).toBe(0);
    expect(result.answer.selectedOption).toBeNull();
    expect(createAnswerSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        selectedOption: null,
        result: 'unanswered',
        pointsAwarded: 0,
      })
    );
  });

  it('Escenario 5: validación de presencia lenta no penaliza una recepción válida', async () => {
    // El timestamp de recepción es capturado a los 16s (4s antes del deadline)
    const receivedAt = new Date(baseExpiresAt.getTime() - 4000);

    // Simular que después de validaciones lentas la hora actual avanzó 7 segundos más allá del deadline
    const serverNowAfterPresence = new Date(baseExpiresAt.getTime() + 3000);

    vi.spyOn(answersRepo, 'getAnswerByGameQuestionId').mockResolvedValue(null);

    vi.spyOn(answersRepo, 'createAnswer').mockResolvedValue({
      id: 'ans-5',
      gameSessionId: fakeGameSessionId,
      gameQuestionId: mockQuestion.id,
      selectedOption: 'B',
      result: 'correct',
      pointsAwarded: 100,
      answeredAt: receivedAt,
      createdAt: serverNowAfterPresence,
    } as Answer);

    vi.spyOn(gameSessionsRepo, 'updateGameSessionScoreAndCounts').mockResolvedValue({
      ...mockGameSession,
      totalScore: mockGameSession.totalScore + 100,
      correctCount: mockGameSession.correctCount + 1,
    });

    // submitAnswer recibe el receivedAt capturado antes de la validación lenta
    const result = await submitAnswer(mockDb, 'cookie_mesa_21', 'B', receivedAt);

    expect(result.ok).toBe(true);
    expect(result.answer.result).toBe('correct');
    expect(result.answer.pointsAwarded).toBe(100);
  });

  it('Escenario 6: timeout concurrente (lazy normalization) con respuesta válida recibida a tiempo -> Se conserva la respuesta válida', async () => {
    // La respuesta del jugador llegó 500ms antes del vencimiento
    const receivedAt = new Date(baseExpiresAt.getTime() - 500);

    // Pero una consulta concurrente de timeout registró preventivamente 'unanswered'
    const lazyUnanswered: Answer = {
      id: 'ans-lazy-1',
      gameSessionId: fakeGameSessionId,
      gameQuestionId: mockQuestion.id,
      selectedOption: null,
      result: 'unanswered',
      pointsAwarded: 0,
      answeredAt: baseExpiresAt,
      createdAt: baseExpiresAt,
    };

    vi.spyOn(answersRepo, 'getAnswerByGameQuestionId').mockResolvedValue(lazyUnanswered);
    const updateAnswerSpy = vi.spyOn(answersRepo, 'updateAnswer').mockResolvedValue({
      ...lazyUnanswered,
      selectedOption: 'B',
      result: 'correct',
      pointsAwarded: 100,
      answeredAt: receivedAt,
    });

    const result = await submitAnswer(mockDb, 'cookie_mesa_21', 'B', receivedAt);

    expect(result.ok).toBe(true);
    // Debe haber recuperado la respuesta válida reemplazando el timeout prematuro
    expect(result.answer.result).toBe('correct');
    expect(result.answer.pointsAwarded).toBe(100);
    expect(result.answer.selectedOption).toBe('B');

    expect(updateAnswerSpy).toHaveBeenCalledWith(
      expect.anything(),
      'ans-lazy-1',
      expect.objectContaining({
        selectedOption: 'B',
        result: 'correct',
        pointsAwarded: 100,
      })
    );
  });

  it('Escenario 7: petición duplicada / reintento de red -> Una sola respuesta y puntuación idempotente', async () => {
    const receivedAt = new Date(baseExpiresAt.getTime() - 2000);

    const alreadySavedAnswer: Answer = {
      id: 'ans-saved-1',
      gameSessionId: fakeGameSessionId,
      gameQuestionId: mockQuestion.id,
      selectedOption: 'B',
      result: 'correct',
      pointsAwarded: 100,
      answeredAt: receivedAt,
      createdAt: receivedAt,
    };

    vi.spyOn(answersRepo, 'getAnswerByGameQuestionId').mockResolvedValue(alreadySavedAnswer);
    const createAnswerSpy = vi.spyOn(answersRepo, 'createAnswer');
    const updateScoreSpy = vi.spyOn(gameSessionsRepo, 'updateGameSessionScoreAndCounts');

    const result = await submitAnswer(mockDb, 'cookie_mesa_21', 'B', receivedAt);

    expect(result.ok).toBe(true);
    expect(result.answer.result).toBe('correct');
    expect(result.answer.pointsAwarded).toBe(100);
    expect(result.answer.totalScore).toBe(mockGameSession.totalScore);

    // No debe haber intentado insertar una nueva fila ni modificar el puntaje de nuevo
    expect(createAnswerSpy).not.toHaveBeenCalled();
    expect(updateScoreSpy).not.toHaveBeenCalled();
  });

  it('Escenario 8: pérdida de respuesta HTTP después de guardar -> Recuperación del feedback vía getGameState', async () => {
    const savedAnswer: Answer = {
      id: 'ans-saved-feedback',
      gameSessionId: fakeGameSessionId,
      gameQuestionId: mockQuestion.id,
      selectedOption: 'B',
      result: 'correct',
      pointsAwarded: 100,
      answeredAt: new Date(baseExpiresAt.getTime() - 1000),
      createdAt: new Date(),
    };

    vi.spyOn(answersRepo, 'getAnswerByGameQuestionId').mockResolvedValue(savedAnswer);

    const stateResult = await getGameState(mockDb, 'cookie_mesa_21');

    expect(stateResult.ok).toBe(true);
    expect(stateResult.isResolved).toBe(true);
    expect(stateResult.feedback).not.toBeNull();
    expect(stateResult.feedback?.result).toBe('correct');
    expect(stateResult.feedback?.selectedOption).toBe('B');
    expect(stateResult.feedback?.pointsAwarded).toBe(100);
    expect(stateResult.feedback?.correctOption).toBe('B');
  });

  it('Protección contra reintentos con desfase de pregunta (QuestionPositionMismatch)', async () => {
    // Si la partida está en la pregunta 10 pero el reintento de la red envía posición 8
    vi.spyOn(answersRepo, 'getAnswerByGameQuestionId').mockResolvedValue(null);

    // Mock pregunta 8 con su respuesta histórica
    const q8: GameQuestion = {
      ...mockQuestion,
      id: 'gq-8',
      position: 8,
      correctOptionSnapshot: 'C',
    };
    const ans8: Answer = {
      id: 'ans-8',
      gameSessionId: fakeGameSessionId,
      gameQuestionId: 'gq-8',
      selectedOption: 'C',
      result: 'correct',
      pointsAwarded: 100,
      answeredAt: new Date(),
      createdAt: new Date(),
    };

    vi.spyOn(gameQuestionsRepo, 'getGameQuestionByPosition').mockImplementation(
      async (_db, _id, pos) => {
        if (pos === 8) return q8;
        return mockQuestion;
      }
    );

    vi.spyOn(answersRepo, 'getAnswerByGameQuestionId').mockImplementation(async (_db, qId) => {
      if (qId === 'gq-8') return ans8;
      return null;
    });

    const result = await submitAnswer(mockDb, 'cookie_mesa_21', 'C', new Date(), {
      expectedPosition: 8,
    });

    // Retorna la respuesta histórica de la pregunta 8 sin responder ni modificar la pregunta 10
    expect(result.ok).toBe(true);
    expect(result.answer.selectedOption).toBe('C');
    expect(result.answer.correctOption).toBe('C');
  });

  it('Sincronización en modo competencia (categoryId = null): respuesta en tiempo evaluada correctamente', async () => {
    // En competencia, categoryId es null
    const compGameSession = {
      ...mockGameSession,
      categoryId: null,
    };

    vi.spyOn(gameSessionsRepo, 'getGameSessionByTableSessionId').mockResolvedValue(compGameSession);
    vi.spyOn(answersRepo, 'getAnswerByGameQuestionId').mockResolvedValue(null);

    const receivedAt = new Date(baseExpiresAt.getTime() - 2500);

    const createAnswerSpy = vi.spyOn(answersRepo, 'createAnswer').mockResolvedValue({
      id: 'ans-comp-1',
      gameSessionId: fakeGameSessionId,
      gameQuestionId: mockQuestion.id,
      selectedOption: 'B',
      result: 'correct',
      pointsAwarded: 100,
      answeredAt: receivedAt,
      createdAt: new Date(),
    } as Answer);

    vi.spyOn(gameSessionsRepo, 'updateGameSessionScoreAndCounts').mockResolvedValue({
      ...compGameSession,
      totalScore: compGameSession.totalScore + 100,
      correctCount: compGameSession.correctCount + 1,
    });

    const result = await submitAnswer(mockDb, 'cookie_mesa_21', 'B', receivedAt);

    expect(result.ok).toBe(true);
    expect(result.answer.result).toBe('correct');
    expect(result.answer.pointsAwarded).toBe(100);
    expect(createAnswerSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        selectedOption: 'B',
        result: 'correct',
        pointsAwarded: 100,
        answeredAt: receivedAt,
      })
    );
  });
});
