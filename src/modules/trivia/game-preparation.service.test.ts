import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Database } from '../../db/client';
import { prepareGame, getPlayPageData } from './game-preparation.service';
import * as sessionsService from '../sessions/sessions.service';
import * as groupsRepo from '../../db/repositories/groups.repository';
import * as participantsRepo from '../../db/repositories/participants.repository';
import * as gameSessionsRepo from '../../db/repositories/game-sessions.repository';
import * as categoriesRepo from '../../db/repositories/categories.repository';
import * as questionsRepo from '../../db/repositories/questions.repository';
import * as gameQuestionsRepo from '../../db/repositories/game-questions.repository';
import * as auditRepo from '../../db/repositories/audit-events.repository';
import {
  DeviceNotActiveError,
  GameAlreadyStartedError,
  GameNotConfiguredError,
  GameSequenceIntegrityError,
  QuestionPoolInsufficientError,
  SessionExpiredError,
  SessionNotFoundError,
} from './errors';
import type { Question } from '../../db/schema/questions';
import type { GameQuestion, NewGameQuestion } from '../../db/schema/game-questions';
import type { AuditEvent } from '../../db/schema/audit-events';

describe('Game Preparation Service (PPA-012)', () => {
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

  const mockGameSession = {
    id: fakeGameSessionId,
    tableSessionId: fakeSessionId,
    groupId: fakeGroupId,
    categoryId: fakeCategoryId,
    status: 'created' as const,
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
  };

  const mockCategory = {
    id: fakeCategoryId,
    slug: 'deportes',
    name: 'Deportes',
    description: 'Fútbol y más.',
    status: 'active' as const,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockParticipants = [
    {
      id: 'part-1',
      groupId: fakeGroupId,
      alias: 'Joaco',
      ageRange: 'adult',
      educationLevel: 'higher',
      position: 1,
      createdAt: new Date(),
    },
    {
      id: 'part-2',
      groupId: fakeGroupId,
      alias: 'Santi',
      ageRange: 'teen',
      educationLevel: 'secondary',
      position: 2,
      createdAt: new Date(),
    },
  ];

  function makeQuestionsPool(): Question[] {
    const list: Question[] = [];
    for (let i = 1; i <= 4; i++) {
      list.push({
        id: `q-init-${i}`,
        categoryId: fakeCategoryId,
        prompt: `Initial ${i}`,
        optionA: 'A',
        optionB: 'B',
        optionC: 'C',
        optionD: 'D',
        correctOption: 'A',
        difficulty: 'initial',
        ageRange: 'general',
        educationLevel: null,
        explanation: `Expl init ${i}`,
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    for (let i = 1; i <= 4; i++) {
      list.push({
        id: `q-med-${i}`,
        categoryId: fakeCategoryId,
        prompt: `Medium ${i}`,
        optionA: 'A',
        optionB: 'B',
        optionC: 'C',
        optionD: 'D',
        correctOption: 'B',
        difficulty: 'medium',
        ageRange: 'general',
        educationLevel: null,
        explanation: `Expl med ${i}`,
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    for (let i = 1; i <= 4; i++) {
      list.push({
        id: `q-adv-${i}`,
        categoryId: fakeCategoryId,
        prompt: `Advanced ${i}`,
        optionA: 'A',
        optionB: 'B',
        optionC: 'C',
        optionD: 'D',
        correctOption: 'C',
        difficulty: 'advanced',
        ageRange: 'general',
        educationLevel: null,
        explanation: `Expl adv ${i}`,
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    return list;
  }

  let mockDb: Database;

  beforeEach(() => {
    vi.restoreAllMocks();

    const mockTx = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            for: vi.fn().mockResolvedValue([mockGameSession]),
          })),
        })),
      })),
    };

    mockDb = {
      transaction: vi.fn(async (cb) => cb(mockTx)),
    } as unknown as Database;

    vi.spyOn(sessionsService, 'resolveSessionFromCookie').mockResolvedValue(mockResolvedSession);
    vi.spyOn(groupsRepo, 'getGroupByTableSessionId').mockResolvedValue(mockGroup);
    vi.spyOn(gameSessionsRepo, 'getGameSessionByTableSessionId').mockResolvedValue(mockGameSession);
    vi.spyOn(participantsRepo, 'getParticipantsByGroupId').mockResolvedValue(mockParticipants);
    vi.spyOn(categoriesRepo, 'getCategoryById').mockResolvedValue(mockCategory);
    vi.spyOn(questionsRepo, 'getApprovedQuestionsForCategory').mockResolvedValue(
      makeQuestionsPool()
    );
    vi.spyOn(gameQuestionsRepo, 'getGameQuestionsBySessionId').mockResolvedValue([]);
    vi.spyOn(gameQuestionsRepo, 'createGameQuestions').mockResolvedValue([]);
    vi.spyOn(auditRepo, 'createAuditEvent').mockResolvedValue({
      id: 'audit-1',
    } as unknown as AuditEvent);
  });

  it('prepara exitosamente 10 preguntas con distribución 3/4/3, snapshots y targets sin iniciar el juego', async () => {
    let insertedRows: NewGameQuestion[] = [];
    vi.spyOn(gameQuestionsRepo, 'createGameQuestions').mockImplementation(async (_, rows) => {
      insertedRows = rows;
      return rows as unknown as GameQuestion[];
    });

    const result = await prepareGame(mockDb, 'valid-token');

    expect(result.ok).toBe(true);
    expect(result.game.prepared).toBe(true);
    expect(result.game.questionCount).toBe(10);
    expect(result.game.category.slug).toBe('deportes');
    expect(result.next).toBe('/play');

    expect(insertedRows).toHaveLength(10);

    // Validar distribución 3/4/3
    expect(insertedRows.slice(0, 3).every((r) => r.difficulty === 'initial')).toBe(true);
    expect(insertedRows.slice(3, 7).every((r) => r.difficulty === 'medium')).toBe(true);
    expect(insertedRows.slice(7, 10).every((r) => r.difficulty === 'advanced')).toBe(true);

    // Validar snapshots completos
    for (const row of insertedRows) {
      expect(row.promptSnapshot).toBeDefined();
      expect(row.optionASnapshot).toBeDefined();
      expect(row.optionBSnapshot).toBeDefined();
      expect(row.optionCSnapshot).toBeDefined();
      expect(row.optionDSnapshot).toBeDefined();
      expect(row.correctOptionSnapshot).toBeDefined();
      expect(row.ageRangeSnapshot).toBeDefined();
      expect(row.presentedAt).toBeNull();
      expect(row.expiresAt).toBeNull();
    }

    // Validar que se registró el evento de auditoría
    expect(auditRepo.createAuditEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        eventType: 'game_questions_prepared',
        entityId: fakeGameSessionId,
        metadata: expect.objectContaining({
          questionCount: 10,
          initialCount: 3,
          mediumCount: 4,
          advancedCount: 3,
        }),
      })
    );
  });

  it('actúa de forma idempotente ante reintentos cuando ya existen 10 preguntas', async () => {
    const existing10: GameQuestion[] = Array.from({ length: 10 }, (_, i) => ({
      id: `gq-${i + 1}`,
      gameSessionId: fakeGameSessionId,
      questionId: `q-${i + 1}`,
      position: i + 1,
      difficulty: 'initial',
      targetParticipantId: null,
      promptSnapshot: 'Prompt',
      optionASnapshot: 'A',
      optionBSnapshot: 'B',
      optionCSnapshot: 'C',
      optionDSnapshot: 'D',
      correctOptionSnapshot: 'A',
      explanationSnapshot: null,
      ageRangeSnapshot: 'general',
      educationLevelSnapshot: null,
      presentedAt: null,
      expiresAt: null,
      createdAt: new Date(),
    }));

    vi.spyOn(gameQuestionsRepo, 'getGameQuestionsBySessionId').mockResolvedValue(existing10);

    const result = await prepareGame(mockDb, 'valid-token');

    expect(result.ok).toBe(true);
    expect(result.game.questionCount).toBe(10);
    expect(gameQuestionsRepo.createGameQuestions).not.toHaveBeenCalled();
    expect(auditRepo.createAuditEvent).not.toHaveBeenCalled();
  });

  it('detecta un estado histórico inconsistente (1..9 preguntas) y lanza GameSequenceIntegrityError', async () => {
    const partial: GameQuestion[] = Array.from({ length: 5 }, (_, i) => ({
      id: `gq-${i + 1}`,
      gameSessionId: fakeGameSessionId,
      questionId: `q-${i + 1}`,
      position: i + 1,
      difficulty: 'initial',
      targetParticipantId: null,
      promptSnapshot: 'Prompt',
      optionASnapshot: 'A',
      optionBSnapshot: 'B',
      optionCSnapshot: 'C',
      optionDSnapshot: 'D',
      correctOptionSnapshot: 'A',
      explanationSnapshot: null,
      ageRangeSnapshot: 'general',
      educationLevelSnapshot: null,
      presentedAt: null,
      expiresAt: null,
      createdAt: new Date(),
    }));

    vi.spyOn(gameQuestionsRepo, 'getGameQuestionsBySessionId').mockResolvedValue(partial);

    await expect(prepareGame(mockDb, 'valid-token')).rejects.toThrow(GameSequenceIntegrityError);
  });

  it('rechaza la preparación con GameAlreadyStartedError si la partida ya está active o completed', async () => {
    vi.spyOn(gameSessionsRepo, 'getGameSessionByTableSessionId').mockResolvedValue({
      ...mockGameSession,
      status: 'active',
    });

    await expect(prepareGame(mockDb, 'valid-token')).rejects.toThrow(GameAlreadyStartedError);
  });

  it('rechaza con SessionNotFoundError si no se provee token de sesión', async () => {
    await expect(prepareGame(mockDb, undefined)).rejects.toThrow(SessionNotFoundError);
    await expect(prepareGame(mockDb, '')).rejects.toThrow(SessionNotFoundError);
  });

  it('rechaza con SessionExpiredError si la sesión de mesa expiró', async () => {
    vi.spyOn(sessionsService, 'resolveSessionFromCookie').mockResolvedValue(null);

    await expect(prepareGame(mockDb, 'expired-token')).rejects.toThrow(SessionExpiredError);
  });

  it('rechaza con DeviceNotActiveError si el dispositivo no tiene el control activo de la mesa', async () => {
    vi.spyOn(sessionsService, 'resolveSessionFromCookie').mockResolvedValue({
      ...mockResolvedSession,
      device: {
        ...mockResolvedSession.device,
        status: 'revoked',
      },
    });

    await expect(prepareGame(mockDb, 'valid-token')).rejects.toThrow(DeviceNotActiveError);
  });

  it('rechaza con QuestionPoolInsufficientError si el banco no alcanza para 3/4/3', async () => {
    // Solo 2 preguntas de dificultad inicial
    const fewQuestions = makeQuestionsPool().filter(
      (q, idx) => !(q.difficulty === 'initial' && idx >= 2)
    );
    vi.spyOn(questionsRepo, 'getApprovedQuestionsForCategory').mockResolvedValue(fewQuestions);

    await expect(prepareGame(mockDb, 'valid-token')).rejects.toThrow(QuestionPoolInsufficientError);
  });

  it('getPlayPageData devuelve la información segura para la pantalla /play sin filtrar respuestas', async () => {
    vi.spyOn(gameQuestionsRepo, 'getGameQuestionsBySessionId').mockResolvedValue(
      Array.from({ length: 10 }, (_, i) => ({ id: `gq-${i}` }) as unknown as GameQuestion)
    );

    const playData = await getPlayPageData(mockDb, 'valid-token');

    expect(playData.table.code).toBe('mesa-01');
    expect(playData.group.name).toBe('Los Bacon');
    expect(playData.group.participantCount).toBe(2);
    expect(playData.category.name).toBe('Deportes');
    expect(playData.mode).toBe('casual');
    expect(playData.structure.total).toBe(10);
    expect(playData.structure.initial).toBe(3);
    expect(playData.structure.medium).toBe(4);
    expect(playData.structure.advanced).toBe(3);
    expect(playData.isPrepared).toBe(true);

    // Verificar que no existen respuestas correctas en los datos retornados
    const untyped = playData as unknown as Record<string, unknown>;
    expect(untyped.correctOption).toBeUndefined();
    expect(untyped.correctOptionSnapshot).toBeUndefined();
    expect(untyped.questions).toBeUndefined();
  });

  it('PPA-HOTFIX-003: getPlayPageData soporta competition round con categoryId = null y deriva 5/4/1 para Ciclo 1', async () => {
    const compGameSession = {
      ...mockGameSession,
      categoryId: null,
    };
    vi.spyOn(gameSessionsRepo, 'getGameSessionByTableSessionId').mockResolvedValue(compGameSession);

    const compRepo = await import('../competitions');
    vi.spyOn(compRepo, 'getCompetitionRoundByGameSessionId').mockResolvedValue({
      id: 'round-1',
      competitionEntryId: 'entry-1',
      roundNumber: 1,
      gameSessionId: compGameSession.id,
      createdAt: new Date(),
      competitionId: 'comp-1',
      competitionName: 'Torneo Apertura Punto Burger',
    });

    const compQuestions: GameQuestion[] = [
      ...Array.from(
        { length: 5 },
        (_, i) => ({ id: `gq-init-${i}`, difficulty: 'initial' }) as unknown as GameQuestion
      ),
      ...Array.from(
        { length: 4 },
        (_, i) => ({ id: `gq-med-${i}`, difficulty: 'medium' }) as unknown as GameQuestion
      ),
      ...Array.from(
        { length: 1 },
        (_, i) => ({ id: `gq-adv-${i}`, difficulty: 'advanced' }) as unknown as GameQuestion
      ),
    ];
    vi.spyOn(gameQuestionsRepo, 'getGameQuestionsBySessionId').mockResolvedValue(compQuestions);

    const playData = await getPlayPageData(mockDb, 'valid-token');

    expect(playData.mode).toBe('competition');
    expect(playData.roundNumber).toBe(1);
    expect(playData.competition?.name).toBe('Torneo Apertura Punto Burger');
    expect(playData.category.name).toBe('Categorías mixtas');
    expect(playData.category.slug).toBe('mixed');
    expect(playData.structure.initial).toBe(5);
    expect(playData.structure.medium).toBe(4);
    expect(playData.structure.advanced).toBe(1);
    expect(playData.structure.total).toBe(10);
    expect(playData.isPrepared).toBe(true);
  });

  it('PPA-HOTFIX-003: getPlayPageData deriva 1/4/5 para Ciclo 3', async () => {
    const compGameSession = {
      ...mockGameSession,
      categoryId: null,
    };
    vi.spyOn(gameSessionsRepo, 'getGameSessionByTableSessionId').mockResolvedValue(compGameSession);

    const compRepo = await import('../competitions');
    vi.spyOn(compRepo, 'getCompetitionRoundByGameSessionId').mockResolvedValue({
      id: 'round-3',
      competitionEntryId: 'entry-1',
      roundNumber: 3,
      gameSessionId: compGameSession.id,
      createdAt: new Date(),
      competitionId: 'comp-1',
      competitionName: 'Torneo Apertura Punto Burger',
    });

    const compQuestions: GameQuestion[] = [
      ...Array.from(
        { length: 1 },
        (_, i) => ({ id: `gq-init-${i}`, difficulty: 'initial' }) as unknown as GameQuestion
      ),
      ...Array.from(
        { length: 4 },
        (_, i) => ({ id: `gq-med-${i}`, difficulty: 'medium' }) as unknown as GameQuestion
      ),
      ...Array.from(
        { length: 5 },
        (_, i) => ({ id: `gq-adv-${i}`, difficulty: 'advanced' }) as unknown as GameQuestion
      ),
    ];
    vi.spyOn(gameQuestionsRepo, 'getGameQuestionsBySessionId').mockResolvedValue(compQuestions);

    const playData = await getPlayPageData(mockDb, 'valid-token');

    expect(playData.mode).toBe('competition');
    expect(playData.roundNumber).toBe(3);
    expect(playData.structure.initial).toBe(1);
    expect(playData.structure.medium).toBe(4);
    expect(playData.structure.advanced).toBe(5);
  });

  it('PPA-HOTFIX-003: getPlayPageData lanza GameNotConfiguredError si categoryId es null y NO hay competition round', async () => {
    const compGameSession = {
      ...mockGameSession,
      categoryId: null,
    };
    vi.spyOn(gameSessionsRepo, 'getGameSessionByTableSessionId').mockResolvedValue(compGameSession);

    const compRepo = await import('../competitions');
    vi.spyOn(compRepo, 'getCompetitionRoundByGameSessionId').mockResolvedValue(null);

    await expect(getPlayPageData(mockDb, 'valid-token')).rejects.toThrow(GameNotConfiguredError);
  });
});
