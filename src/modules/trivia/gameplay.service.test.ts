import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Database } from '../../db/client';
import {
  advanceGame,
  closeTableSession,
  getGameResults,
  getGameState,
  startGame,
  submitAnswer,
} from './gameplay.service';
import * as sessionsService from '../sessions/sessions.service';
import * as groupsRepo from '../../db/repositories/groups.repository';
import * as gameSessionsRepo from '../../db/repositories/game-sessions.repository';
import * as categoriesRepo from '../../db/repositories/categories.repository';
import * as gameQuestionsRepo from '../../db/repositories/game-questions.repository';
import * as answersRepo from '../../db/repositories/answers.repository';
import * as tableSessionsRepo from '../../db/repositories/table-sessions.repository';
import * as tablesRepo from '../../db/repositories/tables.repository';
import * as auditRepo from '../../db/repositories/audit-events.repository';
import { GameNotActiveError, QuestionNotResolvedError } from './errors';

import type { GameQuestion } from '../../db/schema/game-questions';

describe('Gameplay Service (PPA-013)', () => {
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
      code: 'mesa-01',
      displayName: 'Mesa 01',
      status: 'in_use' as const,
      qrToken: 'pb:mesa-01',
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

  const mockGroup = {
    id: fakeGroupId,
    tableSessionId: fakeSessionId,
    name: 'Los Bacon',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCategory = {
    id: fakeCategoryId,
    slug: 'deportes',
    name: 'Deportes',
    description: 'Fútbol y más.',
    status: 'active' as const,
    rankingEligible: true,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  function makeMockQuestion(
    position: number,
    difficulty: 'initial' | 'medium' | 'advanced'
  ): GameQuestion {
    return {
      id: `gq-${position}`,
      gameSessionId: fakeGameSessionId,
      questionId: `orig-q-${position}`,
      position,
      difficulty,
      targetParticipantId: null,
      promptSnapshot: `Enunciado pregunta ${position}`,
      optionASnapshot: 'Opción A',
      optionBSnapshot: 'Opción B',
      optionCSnapshot: 'Opción C',
      optionDSnapshot: 'Opción D',
      correctOptionSnapshot: 'B',
      explanationSnapshot: `Explicación para pregunta ${position}`,
      ageRangeSnapshot: 'adult',
      educationLevelSnapshot: null,
      presentedAt: null,
      expiresAt: null,
      createdAt: new Date(),
    };
  }

  const mock10Questions: GameQuestion[] = [
    makeMockQuestion(1, 'initial'),
    makeMockQuestion(2, 'initial'),
    makeMockQuestion(3, 'initial'),
    makeMockQuestion(4, 'medium'),
    makeMockQuestion(5, 'medium'),
    makeMockQuestion(6, 'medium'),
    makeMockQuestion(7, 'medium'),
    makeMockQuestion(8, 'advanced'),
    makeMockQuestion(9, 'advanced'),
    makeMockQuestion(10, 'advanced'),
  ];

  let mockDb: Database;

  beforeEach(() => {
    vi.restoreAllMocks();

    const mockTx = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            for: vi.fn().mockResolvedValue([
              {
                id: fakeGameSessionId,
                tableSessionId: fakeSessionId,
                groupId: fakeGroupId,
                categoryId: fakeCategoryId,
                status: 'created',
                rankingEligible: true,
                startedAt: null,
                finishedAt: null,
                totalScore: 0,
                correctCount: 0,
                incorrectCount: 0,
                unansweredCount: 0,
                currentQuestionIndex: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ]),
          })),
        })),
      })),
    };

    mockDb = {
      transaction: vi.fn(async (cb) => cb(mockTx)),
    } as unknown as Database;

    vi.spyOn(sessionsService, 'resolveSessionFromCookie').mockResolvedValue(mockResolvedSession);
    vi.spyOn(groupsRepo, 'getGroupByTableSessionId').mockResolvedValue(mockGroup);
    vi.spyOn(categoriesRepo, 'getCategoryById').mockResolvedValue(mockCategory);
    vi.spyOn(gameQuestionsRepo, 'getGameQuestionsBySessionId').mockResolvedValue(mock10Questions);
    vi.spyOn(gameQuestionsRepo, 'getGameQuestionByPosition').mockImplementation(
      async (_, __, pos) => {
        return mock10Questions.find((q) => q.position === pos) ?? null;
      }
    );
    vi.spyOn(gameQuestionsRepo, 'updateGameQuestionTiming').mockResolvedValue(mock10Questions[0]!);
    vi.spyOn(auditRepo, 'createAuditEvent').mockResolvedValue({} as never);
  });

  describe('startGame', () => {
    it('inicia la partida y activa el temporizador autoritativo para la pregunta 1', async () => {
      const now = new Date('2026-11-25T12:00:00Z');
      vi.spyOn(gameSessionsRepo, 'getGameSessionByTableSessionId').mockResolvedValue({
        id: fakeGameSessionId,
        tableSessionId: fakeSessionId,
        groupId: fakeGroupId,
        categoryId: fakeCategoryId,
        status: 'created',
        rankingEligible: true,
        startedAt: null,
        finishedAt: null,
        totalScore: 0,
        correctCount: 0,
        incorrectCount: 0,
        unansweredCount: 0,
        currentQuestionIndex: 0,
        createdAt: now,
        updatedAt: now,
      });

      const updateTimingSpy = vi.spyOn(gameQuestionsRepo, 'updateGameQuestionTiming');
      const updateStatusSpy = vi
        .spyOn(gameSessionsRepo, 'updateGameSessionStatus')
        .mockResolvedValue({} as never);

      const result = await startGame(mockDb, 'raw-token', now);

      expect(result.ok).toBe(true);
      expect(result.game.status).toBe('active');
      expect(result.game.currentPosition).toBe(1);
      expect(result.question.position).toBe(1);

      // Verifica 20 segundos autoritativos en servidor
      expect(updateTimingSpy).toHaveBeenCalledWith(
        expect.anything(),
        mock10Questions[0]!.id,
        now,
        new Date(now.getTime() + 20000)
      );

      expect(updateStatusSpy).toHaveBeenCalledWith(
        expect.anything(),
        fakeGameSessionId,
        'active',
        now
      );
    });

    it('es idempotente si la partida ya fue iniciada previamente', async () => {
      const activeGame = {
        id: fakeGameSessionId,
        tableSessionId: fakeSessionId,
        groupId: fakeGroupId,
        categoryId: fakeCategoryId,
        status: 'active' as const,
        rankingEligible: true,
        startedAt: new Date(),
        finishedAt: null,
        totalScore: 0,
        correctCount: 0,
        incorrectCount: 0,
        unansweredCount: 0,
        currentQuestionIndex: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(gameSessionsRepo, 'getGameSessionByTableSessionId').mockResolvedValue(activeGame);

      const mockTx = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              for: vi.fn().mockResolvedValue([activeGame]),
            })),
          })),
        })),
      };
      mockDb = { transaction: vi.fn(async (cb) => cb(mockTx)) } as unknown as Database;

      const result = await startGame(mockDb, 'raw-token');

      expect(result.ok).toBe(true);
      expect(result.game.status).toBe('active');
      expect(result.game.currentPosition).toBe(1);
    });
  });

  describe('getGameState', () => {
    it('no filtra la respuesta correcta ni la explicación cuando la pregunta está abierta (ZERO LEAKAGE)', async () => {
      const activeGame = {
        id: fakeGameSessionId,
        tableSessionId: fakeSessionId,
        groupId: fakeGroupId,
        categoryId: fakeCategoryId,
        status: 'active' as const,
        rankingEligible: true,
        startedAt: new Date(),
        finishedAt: null,
        totalScore: 0,
        correctCount: 0,
        incorrectCount: 0,
        unansweredCount: 0,
        currentQuestionIndex: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(gameSessionsRepo, 'getGameSessionByTableSessionId').mockResolvedValue(activeGame);
      vi.spyOn(answersRepo, 'getAnswerByGameQuestionId').mockResolvedValue(null);

      const q1WithTiming = {
        ...mock10Questions[0]!,
        presentedAt: new Date(),
        expiresAt: new Date(Date.now() + 15000), // En tiempo
      };

      vi.spyOn(gameQuestionsRepo, 'getGameQuestionByPosition').mockResolvedValue(q1WithTiming);

      const result = await getGameState(mockDb, 'raw-token');

      expect(result.ok).toBe(true);
      expect(result.isResolved).toBe(false);
      expect(result.feedback).toBeNull();
      expect(result.question).toBeDefined();
      expect(result.question?.prompt).toBe('Enunciado pregunta 1');

      // Garantizar que no existe fuga de respuestas
      expect((result.question as unknown as Record<string, unknown>).correctOption).toBeUndefined();
      expect(
        (result.question as unknown as Record<string, unknown>).correctOptionSnapshot
      ).toBeUndefined();
      expect((result.question as unknown as Record<string, unknown>).explanation).toBeUndefined();
      expect(
        (result.question as unknown as Record<string, unknown>).explanationSnapshot
      ).toBeUndefined();
    });

    it('normaliza perezosamente a sin responder cuando el temporizador expiró sin respuesta', async () => {
      const now = new Date('2026-11-25T12:00:25Z');
      const activeGame = {
        id: fakeGameSessionId,
        tableSessionId: fakeSessionId,
        groupId: fakeGroupId,
        categoryId: fakeCategoryId,
        status: 'active' as const,
        rankingEligible: true,
        startedAt: new Date('2026-11-25T12:00:00Z'),
        finishedAt: null,
        totalScore: 0,
        correctCount: 0,
        incorrectCount: 0,
        unansweredCount: 0,
        currentQuestionIndex: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(gameSessionsRepo, 'getGameSessionByTableSessionId').mockResolvedValue(activeGame);
      vi.spyOn(answersRepo, 'getAnswerByGameQuestionId').mockResolvedValue(null);

      const q1Expired = {
        ...mock10Questions[0]!,
        presentedAt: new Date('2026-11-25T12:00:00Z'),
        expiresAt: new Date('2026-11-25T12:00:20Z'), // Expiró hace 5s
      };

      vi.spyOn(gameQuestionsRepo, 'getGameQuestionByPosition').mockResolvedValue(q1Expired);

      const createAnswerSpy = vi.spyOn(answersRepo, 'createAnswer').mockResolvedValue({
        id: 'ans-1',
        gameSessionId: fakeGameSessionId,
        gameQuestionId: q1Expired.id,
        selectedOption: null,
        result: 'unanswered',
        pointsAwarded: 0,
        answeredAt: now,
        createdAt: now,
      });

      const updateScoreSpy = vi
        .spyOn(gameSessionsRepo, 'updateGameSessionScoreAndCounts')
        .mockResolvedValue({} as never);

      const result = await getGameState(mockDb, 'raw-token', now);

      expect(result.ok).toBe(true);
      expect(result.isResolved).toBe(true);
      expect(result.feedback?.result).toBe('unanswered');
      expect(result.feedback?.pointsAwarded).toBe(0);
      expect(result.feedback?.correctOption).toBe('B');

      expect(createAnswerSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          result: 'unanswered',
          pointsAwarded: 0,
          selectedOption: null,
        })
      );
      expect(updateScoreSpy).toHaveBeenCalledWith(
        expect.anything(),
        fakeGameSessionId,
        0,
        'unanswered'
      );
    });
  });

  describe('submitAnswer', () => {
    it('otorga 100 puntos en dificultad inicial para una respuesta correcta', async () => {
      const now = new Date('2026-11-25T12:00:05Z');
      const activeGame = {
        id: fakeGameSessionId,
        tableSessionId: fakeSessionId,
        groupId: fakeGroupId,
        categoryId: fakeCategoryId,
        status: 'active' as const,
        rankingEligible: true,
        startedAt: new Date('2026-11-25T12:00:00Z'),
        finishedAt: null,
        totalScore: 0,
        correctCount: 0,
        incorrectCount: 0,
        unansweredCount: 0,
        currentQuestionIndex: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(gameSessionsRepo, 'getGameSessionByTableSessionId').mockResolvedValue(activeGame);

      const mockTx = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              for: vi.fn().mockResolvedValue([activeGame]),
            })),
          })),
        })),
      };
      mockDb = { transaction: vi.fn(async (cb) => cb(mockTx)) } as unknown as Database;

      const q1 = {
        ...mock10Questions[0]!,
        difficulty: 'initial' as const,
        correctOptionSnapshot: 'B' as const,
        expiresAt: new Date('2026-11-25T12:00:20Z'),
      };

      vi.spyOn(gameQuestionsRepo, 'getGameQuestionByPosition').mockResolvedValue(q1);
      vi.spyOn(answersRepo, 'getAnswerByGameQuestionId').mockResolvedValue(null);
      vi.spyOn(answersRepo, 'createAnswer').mockResolvedValue({} as never);
      vi.spyOn(gameSessionsRepo, 'updateGameSessionScoreAndCounts').mockResolvedValue({
        ...activeGame,
        totalScore: 100,
        correctCount: 1,
      });

      const result = await submitAnswer(mockDb, 'raw-token', 'B', now);

      expect(result.ok).toBe(true);
      expect(result.answer.result).toBe('correct');
      expect(result.answer.pointsAwarded).toBe(100);
      expect(result.answer.totalScore).toBe(100);
    });

    it('otorga exactamente 20 puntos para una respuesta incorrecta sin importar velocidad ni dificultad', async () => {
      const now = new Date('2026-11-25T12:00:02Z'); // Respondió muy rápido (2 segundos)
      const activeGame = {
        id: fakeGameSessionId,
        tableSessionId: fakeSessionId,
        groupId: fakeGroupId,
        categoryId: fakeCategoryId,
        status: 'active' as const,
        rankingEligible: true,
        startedAt: new Date('2026-11-25T12:00:00Z'),
        finishedAt: null,
        totalScore: 0,
        correctCount: 0,
        incorrectCount: 0,
        unansweredCount: 0,
        currentQuestionIndex: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(gameSessionsRepo, 'getGameSessionByTableSessionId').mockResolvedValue(activeGame);

      const mockTx = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              for: vi.fn().mockResolvedValue([activeGame]),
            })),
          })),
        })),
      };
      mockDb = { transaction: vi.fn(async (cb) => cb(mockTx)) } as unknown as Database;

      const q1 = {
        ...mock10Questions[0]!,
        difficulty: 'initial' as const,
        correctOptionSnapshot: 'B' as const,
        expiresAt: new Date('2026-11-25T12:00:20Z'),
      };

      vi.spyOn(gameQuestionsRepo, 'getGameQuestionByPosition').mockResolvedValue(q1);
      vi.spyOn(answersRepo, 'getAnswerByGameQuestionId').mockResolvedValue(null);
      vi.spyOn(answersRepo, 'createAnswer').mockResolvedValue({} as never);
      vi.spyOn(gameSessionsRepo, 'updateGameSessionScoreAndCounts').mockResolvedValue({
        ...activeGame,
        totalScore: 20,
        incorrectCount: 1,
      });

      // El usuario elige 'A' cuando la correcta era 'B'
      const result = await submitAnswer(mockDb, 'raw-token', 'A', now);

      expect(result.ok).toBe(true);
      expect(result.answer.result).toBe('incorrect');
      expect(result.answer.pointsAwarded).toBe(20);
      expect(result.answer.totalScore).toBe(20);
    });

    it('registra 0 puntos si la respuesta llega después de expiresAt (autoridad del servidor)', async () => {
      const now = new Date('2026-11-25T12:00:22Z'); // 2 segundos tarde
      const activeGame = {
        id: fakeGameSessionId,
        tableSessionId: fakeSessionId,
        groupId: fakeGroupId,
        categoryId: fakeCategoryId,
        status: 'active' as const,
        rankingEligible: true,
        startedAt: new Date('2026-11-25T12:00:00Z'),
        finishedAt: null,
        totalScore: 0,
        correctCount: 0,
        incorrectCount: 0,
        unansweredCount: 0,
        currentQuestionIndex: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(gameSessionsRepo, 'getGameSessionByTableSessionId').mockResolvedValue(activeGame);

      const mockTx = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              for: vi.fn().mockResolvedValue([activeGame]),
            })),
          })),
        })),
      };
      mockDb = { transaction: vi.fn(async (cb) => cb(mockTx)) } as unknown as Database;

      const q1 = {
        ...mock10Questions[0]!,
        difficulty: 'initial' as const,
        correctOptionSnapshot: 'B' as const,
        expiresAt: new Date('2026-11-25T12:00:20Z'),
      };

      vi.spyOn(gameQuestionsRepo, 'getGameQuestionByPosition').mockResolvedValue(q1);
      vi.spyOn(answersRepo, 'getAnswerByGameQuestionId').mockResolvedValue(null);
      vi.spyOn(answersRepo, 'createAnswer').mockResolvedValue({} as never);
      vi.spyOn(gameSessionsRepo, 'updateGameSessionScoreAndCounts').mockResolvedValue(activeGame);

      // Aunque eligió 'B', llegó tarde: unanswered (0 pts)
      const result = await submitAnswer(mockDb, 'raw-token', 'B', now);

      expect(result.ok).toBe(true);
      expect(result.answer.result).toBe('unanswered');
      expect(result.answer.pointsAwarded).toBe(0);
      expect(result.answer.selectedOption).toBeNull();
    });
  });

  describe('advanceGame', () => {
    it('rechaza avanzar si la pregunta actual aún no fue resuelta y sigue en tiempo', async () => {
      const activeGame = {
        id: fakeGameSessionId,
        tableSessionId: fakeSessionId,
        groupId: fakeGroupId,
        categoryId: fakeCategoryId,
        status: 'active' as const,
        rankingEligible: true,
        startedAt: new Date(),
        finishedAt: null,
        totalScore: 0,
        correctCount: 0,
        incorrectCount: 0,
        unansweredCount: 0,
        currentQuestionIndex: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(gameSessionsRepo, 'getGameSessionByTableSessionId').mockResolvedValue(activeGame);

      const mockTx = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              for: vi.fn().mockResolvedValue([activeGame]),
            })),
          })),
        })),
      };
      mockDb = { transaction: vi.fn(async (cb) => cb(mockTx)) } as unknown as Database;

      const q1 = {
        ...mock10Questions[0]!,
        expiresAt: new Date(Date.now() + 10000), // En tiempo
      };

      vi.spyOn(gameQuestionsRepo, 'getGameQuestionByPosition').mockResolvedValue(q1);
      vi.spyOn(answersRepo, 'getAnswerByGameQuestionId').mockResolvedValue(null);

      await expect(advanceGame(mockDb, 'raw-token')).rejects.toThrow(QuestionNotResolvedError);
    });

    it('avanza a la pregunta 2 y activa el temporizador autoritativo si la pregunta 1 ya fue respondida', async () => {
      const now = new Date('2026-11-25T12:00:10Z');
      const activeGame = {
        id: fakeGameSessionId,
        tableSessionId: fakeSessionId,
        groupId: fakeGroupId,
        categoryId: fakeCategoryId,
        status: 'active' as const,
        rankingEligible: true,
        startedAt: new Date('2026-11-25T12:00:00Z'),
        finishedAt: null,
        totalScore: 100,
        correctCount: 1,
        incorrectCount: 0,
        unansweredCount: 0,
        currentQuestionIndex: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(gameSessionsRepo, 'getGameSessionByTableSessionId').mockResolvedValue(activeGame);

      const mockTx = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              for: vi.fn().mockResolvedValue([activeGame]),
            })),
          })),
        })),
      };
      mockDb = { transaction: vi.fn(async (cb) => cb(mockTx)) } as unknown as Database;

      vi.spyOn(answersRepo, 'getAnswerByGameQuestionId').mockResolvedValue({} as never);
      const advanceSpy = vi
        .spyOn(gameSessionsRepo, 'advanceGameSessionQuestion')
        .mockResolvedValue({} as never);
      const updateTimingSpy = vi
        .spyOn(gameQuestionsRepo, 'updateGameQuestionTiming')
        .mockResolvedValue({} as never);

      const result = await advanceGame(mockDb, 'raw-token', now);

      expect(result.ok).toBe(true);
      expect(result.advanced).toBe(true);
      expect(result.completed).toBe(false);
      expect(result.currentPosition).toBe(2);

      expect(advanceSpy).toHaveBeenCalledWith(expect.anything(), fakeGameSessionId, 1);
      expect(updateTimingSpy).toHaveBeenCalledWith(
        expect.anything(),
        mock10Questions[1]!.id,
        now,
        new Date(now.getTime() + 20000)
      );
    });

    it('finaliza la partida cuando se avanza desde la pregunta 10', async () => {
      const now = new Date('2026-11-25T12:03:00Z');
      const activeGameAt10 = {
        id: fakeGameSessionId,
        tableSessionId: fakeSessionId,
        groupId: fakeGroupId,
        categoryId: fakeCategoryId,
        status: 'active' as const,
        rankingEligible: true,
        startedAt: new Date('2026-11-25T12:00:00Z'),
        finishedAt: null,
        totalScore: 1100,
        correctCount: 8,
        incorrectCount: 2,
        unansweredCount: 0,
        currentQuestionIndex: 9, // Índice 9 = Pregunta 10
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(gameSessionsRepo, 'getGameSessionByTableSessionId').mockResolvedValue(
        activeGameAt10
      );

      const mockTx = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              for: vi.fn().mockResolvedValue([activeGameAt10]),
            })),
          })),
        })),
      };
      mockDb = { transaction: vi.fn(async (cb) => cb(mockTx)) } as unknown as Database;

      vi.spyOn(answersRepo, 'getAnswerByGameQuestionId').mockResolvedValue({} as never);
      const updateStatusSpy = vi
        .spyOn(gameSessionsRepo, 'updateGameSessionStatus')
        .mockResolvedValue({} as never);

      const result = await advanceGame(mockDb, 'raw-token', now);

      expect(result.ok).toBe(true);
      expect(result.completed).toBe(true);
      expect(result.next).toBe('/play/results');

      expect(updateStatusSpy).toHaveBeenCalledWith(
        expect.anything(),
        fakeGameSessionId,
        'completed',
        undefined,
        now
      );
    });
  });

  describe('getGameResults', () => {
    it('devuelve las métricas consolidadas y el desglose por dificultad', async () => {
      const completedGame = {
        id: fakeGameSessionId,
        tableSessionId: fakeSessionId,
        groupId: fakeGroupId,
        categoryId: fakeCategoryId,
        status: 'completed' as const,
        rankingEligible: true,
        startedAt: new Date(),
        finishedAt: new Date(),
        totalScore: 950,
        correctCount: 6,
        incorrectCount: 3,
        unansweredCount: 1,
        currentQuestionIndex: 9,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(gameSessionsRepo, 'getGameSessionByTableSessionId').mockResolvedValue(completedGame);

      const sampleAnswers = mock10Questions.map((q, idx) => ({
        id: `ans-${idx}`,
        gameSessionId: fakeGameSessionId,
        gameQuestionId: q.id,
        selectedOption: 'B' as const,
        result:
          idx < 6
            ? ('correct' as const)
            : idx < 9
              ? ('incorrect' as const)
              : ('unanswered' as const),
        pointsAwarded: idx < 3 ? 100 : idx < 6 ? 150 : idx < 9 ? 20 : 0,
        answeredAt: new Date(),
        createdAt: new Date(),
      }));
      // total = 3x100 + 3x150 + 3x20 + 0 = 300 + 450 + 60 = 810 (simulado)
      vi.spyOn(answersRepo, 'getAnswersByGameSessionId').mockResolvedValue(sampleAnswers);

      const result = await getGameResults(mockDb, 'raw-token');

      expect(result.ok).toBe(true);
      expect(result.game.status).toBe('completed');
      expect(result.game.breakdown.initial.total).toBe(3);
      expect(result.game.breakdown.medium.total).toBe(4);
      expect(result.game.breakdown.advanced.total).toBe(3);
    });

    it('rechaza consultar resultados si la partida aún no finalizó', async () => {
      const activeGame = {
        id: fakeGameSessionId,
        tableSessionId: fakeSessionId,
        groupId: fakeGroupId,
        categoryId: fakeCategoryId,
        status: 'active' as const,
        rankingEligible: true,
        startedAt: new Date(),
        finishedAt: null,
        totalScore: 100,
        correctCount: 1,
        incorrectCount: 0,
        unansweredCount: 0,
        currentQuestionIndex: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(gameSessionsRepo, 'getGameSessionByTableSessionId').mockResolvedValue(activeGame);

      await expect(getGameResults(mockDb, 'raw-token')).rejects.toThrow(GameNotActiveError);
    });

    it('PPA-HOTFIX-003: soporta categoryId = null en partida completada devolviendo Categorías mixtas', async () => {
      const completedCompGame = {
        id: fakeGameSessionId,
        tableSessionId: fakeSessionId,
        groupId: fakeGroupId,
        categoryId: null,
        status: 'completed' as const,
        rankingEligible: false,
        startedAt: new Date(Date.now() - 300000),
        finishedAt: new Date(),
        totalScore: 810,
        correctCount: 6,
        incorrectCount: 3,
        unansweredCount: 1,
        currentQuestionIndex: 9,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(gameSessionsRepo, 'getGameSessionByTableSessionId').mockResolvedValue(
        completedCompGame
      );
      vi.spyOn(gameQuestionsRepo, 'getGameQuestionsBySessionId').mockResolvedValue(mock10Questions);
      vi.spyOn(answersRepo, 'getAnswersByGameSessionId').mockResolvedValue([]);

      const result = await getGameResults(mockDb, 'raw-token');

      expect(result.ok).toBe(true);
      expect(result.game.category.slug).toBe('mixed');
      expect(result.game.category.name).toBe('Categorías mixtas');
    });
  });

  describe('closeTableSession', () => {
    it('cierra la sesión, revoca el dispositivo y pone la mesa en cooldown por 120s', async () => {
      const now = new Date('2026-11-25T12:10:00Z');
      const updateSessionSpy = vi
        .spyOn(tableSessionsRepo, 'updateSessionStatus')
        .mockResolvedValue({} as never);
      const revokeDeviceSpy = vi
        .spyOn(tableSessionsRepo, 'revokeDevice')
        .mockResolvedValue({} as never);
      const updateTableSpy = vi
        .spyOn(tablesRepo, 'updateTableStatus')
        .mockResolvedValue({} as never);

      const result = await closeTableSession(mockDb, 'raw-token', now);

      expect(result.ok).toBe(true);
      expect(result.next).toBe('/');

      expect(updateSessionSpy).toHaveBeenCalledWith(
        expect.anything(),
        fakeSessionId,
        'closed',
        now,
        new Date(now.getTime() + 120000)
      );
      expect(revokeDeviceSpy).toHaveBeenCalledWith(expect.anything(), fakeDeviceId, now);
      expect(updateTableSpy).toHaveBeenCalledWith(expect.anything(), fakeTableId, 'cooldown');
    });
  });
});
