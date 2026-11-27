import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Database } from '../../db/client';
import { getPlayPageData } from '../trivia/game-preparation.service';
import {
  startGame,
  getGameState,
  submitAnswer,
  advanceGame,
  getGameResults,
} from '../trivia/gameplay.service';
import * as sessionsService from '../sessions/sessions.service';
import * as groupsRepo from '../../db/repositories/groups.repository';
import * as participantsRepo from '../../db/repositories/participants.repository';
import * as gameSessionsRepo from '../../db/repositories/game-sessions.repository';
import * as gameQuestionsRepo from '../../db/repositories/game-questions.repository';
import * as answersRepo from '../../db/repositories/answers.repository';
import * as auditRepo from '../../db/repositories/audit-events.repository';
import * as compRepo from './competition.repository';
import type { GameSession } from '../../db/schema/game-sessions';
import type { GameQuestion } from '../../db/schema/game-questions';
import type { Answer } from '../../db/schema/answers';

describe('Competition Play Flow (PPA-HOTFIX-003)', () => {
  const fakeSessionId = '11111111-1111-1111-1111-111111111111';
  const fakeDeviceId = '22222222-2222-2222-2222-222222222222';
  const fakeTableId = '33333333-3333-3333-3333-333333333333';
  const fakeVenueId = '44444444-4444-4444-4444-444444444444';
  const fakeGroupId = '55555555-5555-5555-5555-555555555555';
  const fakeGameSessionId = '77777777-7777-7777-7777-777777777777';
  const fakeCompId = '99999999-9999-9999-9999-999999999999';

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
    name: 'Los Campeones',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockParticipants = [
    {
      id: 'p-1',
      groupId: fakeGroupId,
      alias: 'Joaco',
      ageRange: 'adult' as const,
      educationLevel: null,
      position: 1,
      createdAt: new Date(),
    },
  ];

  let gameSessionState: GameSession;
  let gameQuestionsList: GameQuestion[];
  let answersList: Answer[];

  let mockDb: Database;

  beforeEach(() => {
    vi.restoreAllMocks();

    gameSessionState = {
      id: fakeGameSessionId,
      tableSessionId: fakeSessionId,
      groupId: fakeGroupId,
      categoryId: null, // COMPETENCIA TIENE categoryId NULL
      status: 'created',
      rankingEligible: false,
      startedAt: null,
      finishedAt: null,
      totalScore: 0,
      correctCount: 0,
      incorrectCount: 0,
      unansweredCount: 0,
      currentQuestionIndex: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 10 preguntas con distribución 5 initial, 4 medium, 1 advanced (Ciclo 1)
    const difficulties: Array<'initial' | 'medium' | 'advanced'> = [
      'initial',
      'initial',
      'initial',
      'initial',
      'initial',
      'medium',
      'medium',
      'medium',
      'medium',
      'advanced',
    ];

    gameQuestionsList = difficulties.map((diff, idx) => ({
      id: `gq-${idx + 1}`,
      gameSessionId: fakeGameSessionId,
      questionId: `q-${idx + 1}`,
      position: idx + 1,
      targetParticipantId: 'p-1',
      promptSnapshot: `Pregunta de competencia ${idx + 1}`,
      optionASnapshot: 'Opción A',
      optionBSnapshot: 'Opción B',
      optionCSnapshot: 'Opción C',
      optionDSnapshot: 'Opción D',
      correctOptionSnapshot: 'A',
      difficulty: diff,
      explanationSnapshot: `Explicación ${idx + 1}`,
      ageRangeSnapshot: 'general',
      educationLevelSnapshot: null,
      presentedAt: null,
      expiresAt: null,
      createdAt: new Date(),
    }));

    answersList = [];

    const mockTx = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            for: vi.fn().mockImplementation(async () => [gameSessionState]),
          })),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn().mockImplementation(async () => []),
        })),
      })),
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn().mockImplementation(async () => []),
        })),
      })),
    };

    mockDb = {
      transaction: vi.fn(async (cb) => cb(mockTx)),
      select: vi.fn() as unknown as Database['select'],
    } as unknown as Database;

    vi.spyOn(auditRepo, 'createAuditEvent').mockResolvedValue({} as never);
    vi.spyOn(sessionsService, 'resolveSessionFromCookie').mockResolvedValue(mockResolvedSession);
    vi.spyOn(groupsRepo, 'getGroupByTableSessionId').mockResolvedValue(mockGroup);
    vi.spyOn(participantsRepo, 'getParticipantsByGroupId').mockResolvedValue(mockParticipants);
    vi.spyOn(participantsRepo, 'getParticipantById').mockResolvedValue(mockParticipants[0]!);
    vi.spyOn(gameSessionsRepo, 'getGameSessionByTableSessionId').mockImplementation(
      async () => gameSessionState
    );
    vi.spyOn(gameSessionsRepo, 'updateGameSessionStatus').mockImplementation(
      async (_db, _id, status, startedAt, finishedAt) => {
        gameSessionState.status = status;
        if (startedAt) gameSessionState.startedAt = startedAt;
        if (finishedAt) gameSessionState.finishedAt = finishedAt;
        return gameSessionState;
      }
    );
    vi.spyOn(gameSessionsRepo, 'updateGameSessionScoreAndCounts').mockImplementation(
      async (_db, _id, pts, result) => {
        gameSessionState.totalScore += pts;
        if (result === 'correct') gameSessionState.correctCount++;
        else if (result === 'incorrect') gameSessionState.incorrectCount++;
        else gameSessionState.unansweredCount++;
        return gameSessionState;
      }
    );
    vi.spyOn(gameSessionsRepo, 'advanceGameSessionQuestion').mockImplementation(
      async (_db, _id, newIdx) => {
        gameSessionState.currentQuestionIndex = newIdx;
        return gameSessionState;
      }
    );

    vi.spyOn(gameQuestionsRepo, 'getGameQuestionsBySessionId').mockImplementation(
      async () => gameQuestionsList
    );
    vi.spyOn(gameQuestionsRepo, 'getGameQuestionByPosition').mockImplementation(
      async (_db, _sid, pos) => {
        return gameQuestionsList.find((q) => q.position === pos) ?? null;
      }
    );
    vi.spyOn(gameQuestionsRepo, 'updateGameQuestionTiming').mockImplementation(
      async (_db, id, pres, exp) => {
        const q = gameQuestionsList.find((gq) => gq.id === id);
        if (!q) throw new Error(`GameQuestion ${id} not found`);
        q.presentedAt = pres;
        q.expiresAt = exp;
        return q;
      }
    );

    vi.spyOn(answersRepo, 'getAnswerByGameQuestionId').mockImplementation(async (_db, qid) => {
      return answersList.find((a) => a.gameQuestionId === qid) ?? null;
    });
    vi.spyOn(answersRepo, 'getAnswersByGameSessionId').mockImplementation(async () => answersList);
    vi.spyOn(answersRepo, 'createAnswer').mockImplementation(async (_db, data) => {
      const ans: Answer = {
        id: `ans-${answersList.length + 1}`,
        gameSessionId: data.gameSessionId,
        gameQuestionId: data.gameQuestionId,
        selectedOption: data.selectedOption ?? null,
        result: data.result,
        pointsAwarded: data.pointsAwarded ?? 0,
        answeredAt: data.answeredAt ?? new Date(),
        createdAt: new Date(),
      };
      answersList.push(ans);
      return ans;
    });

    vi.spyOn(compRepo, 'getCompetitionRoundByGameSessionId').mockResolvedValue({
      id: 'round-1',
      competitionEntryId: 'entry-1',
      roundNumber: 1,
      gameSessionId: fakeGameSessionId,
      createdAt: new Date(),
      competitionId: fakeCompId,
      competitionName: 'Competencia Apertura Punto Burger',
    });
  });

  it('1. getPlayPageData retorna mode="competition", round=1 y estructura real 5/4/1 sin categoryId', async () => {
    const playData = await getPlayPageData(mockDb, 'raw-token');

    expect(playData.mode).toBe('competition');
    expect(playData.roundNumber).toBe(1);
    expect(playData.competition?.name).toBe('Competencia Apertura Punto Burger');
    expect(playData.category.name).toBe('Categorías mixtas');
    expect(playData.category.slug).toBe('mixed');
    expect(playData.structure.initial).toBe(5);
    expect(playData.structure.medium).toBe(4);
    expect(playData.structure.advanced).toBe(1);
    expect(playData.structure.total).toBe(10);
    expect(playData.isPrepared).toBe(true);
  });

  it('2. startGame inicia la partida competitiva sin requerir categoryId y entrega Q1 difficulty=initial', async () => {
    const startResult = await startGame(mockDb, 'raw-token');

    expect(startResult.ok).toBe(true);
    expect(startResult.game.status).toBe('active');
    expect(startResult.game.currentPosition).toBe(1);
    expect(startResult.question.position).toBe(1);
    expect(startResult.question.difficulty).toBe('initial');
    expect(startResult.question.prompt).toBe('Pregunta de competencia 1');
    expect(gameSessionState.status).toBe('active');
  });

  it('3. getGameState durante gameplay competitivo devuelve Categorías mixtas', async () => {
    gameSessionState.status = 'active';
    const stateResult = await getGameState(mockDb, 'raw-token');

    expect(stateResult.ok).toBe(true);
    expect(stateResult.game.status).toBe('active');
    expect(stateResult.game.category.slug).toBe('mixed');
    expect(stateResult.game.category.name).toBe('Categorías mixtas');
  });

  it('4. Simulación de 10 respuestas y avances hasta completed sin errores de categoryId', async () => {
    // Iniciar
    await startGame(mockDb, 'raw-token');

    // Responder 10 preguntas
    for (let pos = 1; pos <= 10; pos++) {
      // Responder opción correcta 'A'
      const ansRes = await submitAnswer(mockDb, 'raw-token', 'A');
      expect(ansRes.ok).toBe(true);
      expect(ansRes.answer.result).toBe('correct');

      // Avanzar
      const advRes = await advanceGame(mockDb, 'raw-token');
      expect(advRes.ok).toBe(true);

      if (pos === 10) {
        expect(advRes.completed).toBe(true);
        expect(advRes.next).toBe('/play/results');
        expect(gameSessionState.status).toBe('completed');
      } else {
        expect(advRes.advanced).toBe(true);
        expect(advRes.currentPosition).toBe(pos + 1);
      }
    }

    // 5. getGameResults en partida competitiva completada
    const results = await getGameResults(mockDb, 'raw-token');
    expect(results.ok).toBe(true);
    expect(results.game.status).toBe('completed');
    expect(results.game.category.slug).toBe('mixed');
    expect(results.game.category.name).toBe('Categorías mixtas');
    expect(results.game.correctCount).toBe(10);
    expect(results.game.breakdown.initial.total).toBe(5);
    expect(results.game.breakdown.medium.total).toBe(4);
    expect(results.game.breakdown.advanced.total).toBe(1);
  });
});
