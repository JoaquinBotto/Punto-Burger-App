import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Database } from '@/db/client';
import { saveGameSetup } from '@/modules/groups/groups.service';
import { joinCompetition, startNextCompetitionRound } from './competition.service';
import { SetupAlreadyLockedError } from '@/modules/groups/errors';
import * as sessionsService from '@/modules/sessions/sessions.service';
import * as sessionsModule from '@/modules/sessions';
import * as groupsRepo from '@/db/repositories/groups.repository';
import * as participantsRepo from '@/db/repositories/participants.repository';
import * as gameSessionsRepo from '@/db/repositories/game-sessions.repository';
import * as gameQuestionsRepo from '@/db/repositories/game-questions.repository';
import * as categoriesRepo from '@/db/repositories/categories.repository';
import * as auditRepo from '@/db/repositories/audit-events.repository';
import * as compRepo from './competition.repository';
import * as presenceModule from '@/lib/security/presence';
import type {
  Competition,
  CompetitionEntry,
  CompetitionRound,
  GameSession,
  Group,
  Participant,
  TableSession,
  Table,
  Device,
  Venue,
} from '@/db/schema';

describe('PPA-HOTFIX-002: Competition Setup Idempotency & Recovery Tests', () => {
  const fakeSessionId = '11111111-1111-1111-1111-111111111111';
  const fakeDeviceId = '22222222-2222-2222-2222-222222222222';
  const fakeTableId = '33333333-3333-3333-3333-333333333333';
  const fakeVenueId = '44444444-4444-4444-4444-444444444444';
  const fakeGroupId = '55555555-5555-5555-5555-555555555555';
  const fakeCategoryId = '66666666-6666-6666-6666-666666666666';
  const fakeCompId = 'comp-testmode-open';
  const fakeEntryId = 'entry-testmode-open';
  const fakeGameSessionId = 'gs-round-1-id';

  const mockResolvedSession = {
    device: { id: fakeDeviceId, status: 'active' as const } as Device,
    session: {
      id: fakeSessionId,
      venueId: fakeVenueId,
      tableId: fakeTableId,
      status: 'active' as const,
      activeDeviceId: fakeDeviceId,
      expiresAt: new Date(Date.now() + 7200000),
    } as TableSession,
    table: {
      id: fakeTableId,
      code: 'mesa-01',
      displayName: 'Mesa 01',
      venueId: fakeVenueId,
      status: 'in_use' as const,
    } as Table,
    venue: {
      id: fakeVenueId,
      name: 'Punto Burger Esperanza',
      slug: 'esperanza-central',
      status: 'active' as const,
    } as Venue,
  };

  const initialPayload = {
    groupName: 'Los Bacon',
    participants: [
      { alias: 'Joaco', ageRange: 'adult', educationLevel: 'higher' },
      { alias: 'Mati', ageRange: 'adult', educationLevel: 'secondary' },
    ],
    categorySlug: 'cultura-general',
  };

  let mockDb: Database;

  beforeEach(() => {
    vi.restoreAllMocks();

    const queryMock = {
      orderBy: vi.fn().mockImplementation(() => ({
        limit: vi.fn().mockResolvedValue([]),
      })),
      limit: vi.fn().mockResolvedValue([]),
    };

    const updateMock = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });

    mockDb = {
      transaction: vi.fn(async (cb) => cb(mockDb)),
      update: updateMock,
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue(queryMock),
          orderBy: vi.fn().mockReturnValue(queryMock),
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    } as unknown as Database;

    vi.spyOn(sessionsModule, 'resolveSessionFromCookie').mockResolvedValue(mockResolvedSession);
    vi.spyOn(sessionsService, 'resolveSessionFromCookie').mockResolvedValue(mockResolvedSession);
    vi.spyOn(auditRepo, 'createAuditEvent').mockResolvedValue({} as never);
    vi.spyOn(categoriesRepo, 'getCategoryBySlug').mockResolvedValue({
      id: fakeCategoryId,
      slug: 'cultura-general',
      name: 'Cultura General',
      status: 'active',
    } as never);
    vi.spyOn(categoriesRepo, 'checkCategoryReadiness').mockResolvedValue({
      isReady: true,
      initialCount: 4,
      mediumCount: 4,
      advancedCount: 4,
    });
  });

  it('Sección 17: simulación de fallo de red tras Round 1, retry de setup, join y round es 100% idempotente', async () => {
    // Estado de base de datos simulado
    let currentGroup: Group | null = null;
    let currentParticipants: Participant[] = [];
    const currentGames: GameSession[] = [];
    let currentEntry: CompetitionEntry | null = null;
    const currentRounds: CompetitionRound[] = [];
    let frozenQuestionsCount = 0;

    // Repositorio de grupos
    vi.spyOn(groupsRepo, 'getGroupByTableSessionId').mockImplementation(async () => currentGroup);
    vi.spyOn(groupsRepo, 'createGroup').mockImplementation(async (_db, data) => {
      currentGroup = {
        id: fakeGroupId,
        tableSessionId: data.tableSessionId,
        name: data.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return currentGroup;
    });

    // Repositorio de participantes
    vi.spyOn(participantsRepo, 'getParticipantsByGroupId').mockImplementation(
      async () => currentParticipants
    );
    vi.spyOn(participantsRepo, 'replaceGroupParticipants').mockImplementation(
      async (_db, _gId, items) => {
        // En creación inicial:
        currentParticipants = items.map((it, idx) => ({
          id: `p-${idx + 1}`,
          groupId: fakeGroupId,
          alias: it.alias,
          ageRange: it.ageRange,
          educationLevel: it.educationLevel ?? null,
          position: it.position,
          createdAt: new Date(),
        }));
        return currentParticipants;
      }
    );

    // Repositorio de game sessions
    vi.spyOn(gameSessionsRepo, 'getGameSessionByTableSessionId').mockImplementation(
      async () => currentGames[0] ?? null
    );
    vi.spyOn(gameSessionsRepo, 'getGameSessionsByTableSessionId').mockImplementation(
      async () => currentGames
    );
    vi.spyOn(gameSessionsRepo, 'createGameSession').mockImplementation(async (_db, data) => {
      const gs: GameSession = {
        id: fakeGameSessionId,
        tableSessionId: data.tableSessionId,
        groupId: data.groupId,
        categoryId: data.categoryId ?? null,
        status: data.status ?? 'created',
        rankingEligible: data.rankingEligible ?? true,
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
      currentGames.push(gs);
      return gs;
    });

    // Repositorio de preguntas congeladas
    vi.spyOn(gameQuestionsRepo, 'countGameQuestionsBySessionId').mockImplementation(
      async () => frozenQuestionsCount
    );

    // Repositorio de competencia
    const fakeComp: Competition = {
      id: fakeCompId,
      venueId: fakeVenueId,
      name: 'Prueba Punto Burger',
      status: 'active',
      timingMode: 'open',
      localDate: null,
      startsAt: null,
      endsAt: null,
      registrationOpensAt: null,
      joinCutoffAt: null,
      finalizationGraceUntil: null,
      isTest: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.spyOn(compRepo, 'getActiveOpenCompetitionByVenue').mockResolvedValue(fakeComp);
    vi.spyOn(compRepo, 'getCompetitionEntryByTableSessionId').mockImplementation(
      async () => currentEntry
    );
    vi.spyOn(compRepo, 'getCompetitionEntry').mockImplementation(async () => currentEntry);
    vi.spyOn(compRepo, 'createCompetitionEntry').mockImplementation(async (_db, data) => {
      const entry: CompetitionEntry = {
        id: fakeEntryId,
        competitionId: data.competitionId,
        tableId: data.tableId,
        tableSessionId: data.tableSessionId,
        groupId: data.groupId,
        status: data.status ?? 'registered',
        joinedAt: new Date(),
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      currentEntry = entry;
      return entry;
    });

    vi.spyOn(compRepo, 'getCompetitionRounds').mockImplementation(async () => {
      return currentRounds.map((r) => ({
        ...r,
        gameSession: currentGames.find((g) => g.id === r.gameSessionId)!,
      }));
    });

    vi.spyOn(presenceModule, 'checkPresence').mockReturnValue({
      mode: 'enforce',
      verified: true,
      required: true,
    });

    // 1. Primer intento: POST setup -> éxito
    const setup1 = await saveGameSetup(mockDb, 'valid-token', initialPayload);
    expect(setup1.ok).toBe(true);
    expect(currentGroup).not.toBeNull();
    expect(currentParticipants).toHaveLength(2);
    const originalP1Id = currentParticipants[0]!.id;
    const originalP2Id = currentParticipants[1]!.id;

    // 2. POST join -> éxito
    const join1 = await joinCompetition(mockDb, 'valid-token', {
      headers: new Headers(),
      cookies: { get: () => undefined },
    });
    expect(join1.ok).toBe(true);
    expect(join1.entryId).toBe(fakeEntryId);

    // 3. POST next round -> Round 1 creado con 10 game_questions
    currentRounds.push({
      id: 'cr-round-1',
      competitionEntryId: fakeEntryId,
      roundNumber: 1,
      gameSessionId: fakeGameSessionId,
      createdAt: new Date(),
    });
    frozenQuestionsCount = 10;

    // -------------------------------------------------------------------
    // SIMULAR PÉRDIDA DE RED ANTES DE REDIRIGIR A /play Y REINTENTO
    // -------------------------------------------------------------------

    // 4. Reintento de POST setup con el MISMO payload:
    // Debe devolver 200 ok:true, mismos participant IDs y NO llamar a replace/delete
    const replaceSpy = vi.spyOn(participantsRepo, 'replaceGroupParticipants');
    const setup2 = await saveGameSetup(mockDb, 'valid-token', initialPayload);
    expect(setup2.ok).toBe(true);
    expect(setup2.participants[0]?.id).toBe(originalP1Id);
    expect(setup2.participants[1]?.id).toBe(originalP2Id);
    expect(replaceSpy).not.toHaveBeenCalled();

    // 5. Reintento de POST join:
    // Debe devolver 200 ok:true y la MISMA entryId sin crear duplicados
    const createEntrySpy = vi.spyOn(compRepo, 'createCompetitionEntry');
    const join2 = await joinCompetition(mockDb, 'valid-token', {
      headers: new Headers(),
      cookies: { get: () => undefined },
    });
    expect(join2.ok).toBe(true);
    expect(join2.entryId).toBe(fakeEntryId);
    expect(createEntrySpy).not.toHaveBeenCalled();

    // 6. Reintento de POST next round:
    // Debe devolver 200 ok:true, existing:true, mismo gameSessionId y next: '/play'
    const roundRetry = await startNextCompetitionRound(mockDb, 'valid-token', {
      headers: new Headers(),
      cookies: { get: () => undefined },
    });
    expect(roundRetry.ok).toBe(true);
    expect(roundRetry.existing).toBe(true);
    expect(roundRetry.roundNumber).toBe(1);
    expect(roundRetry.gameSessionId).toBe(fakeGameSessionId);
    expect(roundRetry.next).toBe('/play');

    // Comprobación de integridad de estado (cero duplicados)
    expect(currentParticipants).toHaveLength(2);
    expect(currentRounds).toHaveLength(1);
  });

  it('Sección 18: intento de modificar setup con payload diferente tras congelar preguntas lanza 409 SETUP_ALREADY_LOCKED', async () => {
    const existingGroup: Group = {
      id: fakeGroupId,
      tableSessionId: fakeSessionId,
      name: 'Los Bacon',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const existingParticipants: Participant[] = [
      {
        id: 'p-1',
        groupId: fakeGroupId,
        alias: 'Joaco',
        ageRange: 'adult',
        educationLevel: 'higher',
        position: 1,
        createdAt: new Date(),
      },
    ];
    const gameSessionWithQuestions: GameSession = {
      id: fakeGameSessionId,
      tableSessionId: fakeSessionId,
      groupId: fakeGroupId,
      categoryId: null,
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

    vi.spyOn(groupsRepo, 'getGroupByTableSessionId').mockResolvedValue(existingGroup);
    vi.spyOn(participantsRepo, 'getParticipantsByGroupId').mockResolvedValue(existingParticipants);
    vi.spyOn(gameSessionsRepo, 'getGameSessionsByTableSessionId').mockResolvedValue([
      gameSessionWithQuestions,
    ]);
    vi.spyOn(gameQuestionsRepo, 'countGameQuestionsBySessionId').mockResolvedValue(10);

    // Intentar modificar nombre de equipo
    await expect(
      saveGameSetup(mockDb, 'valid-token', {
        ...initialPayload,
        groupName: 'Los Super Campeones',
      })
    ).rejects.toThrow(SetupAlreadyLockedError);

    // Intentar modificar participantes
    await expect(
      saveGameSetup(mockDb, 'valid-token', {
        ...initialPayload,
        participants: [{ alias: 'Nuevo Jugador', ageRange: 'teen' }],
      })
    ).rejects.toThrow(SetupAlreadyLockedError);
  });

  it('Sección 19: fallo de red y reconexión de presence recupera partida existente sin alterar preguntas', async () => {
    const fakeComp: Competition = {
      id: fakeCompId,
      venueId: fakeVenueId,
      name: 'Prueba Punto Burger',
      status: 'active',
      timingMode: 'open',
      localDate: null,
      startsAt: null,
      endsAt: null,
      registrationOpensAt: null,
      joinCutoffAt: null,
      finalizationGraceUntil: null,
      isTest: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.spyOn(compRepo, 'getActiveOpenCompetitionByVenue').mockResolvedValue(fakeComp);
    vi.spyOn(compRepo, 'getCompetitionEntryByTableSessionId').mockResolvedValue({
      id: fakeEntryId,
      competitionId: fakeCompId,
      tableId: fakeTableId,
      tableSessionId: fakeSessionId,
      groupId: fakeGroupId,
      status: 'active',
      joinedAt: new Date(),
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.spyOn(compRepo, 'getCompetitionRounds').mockResolvedValue([
      {
        id: 'cr-1',
        roundNumber: 1,
        competitionEntryId: fakeEntryId,
        gameSessionId: fakeGameSessionId,
        createdAt: new Date(),
        gameSession: {
          id: fakeGameSessionId,
          tableSessionId: fakeSessionId,
          groupId: fakeGroupId,
          categoryId: null,
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
        },
      },
    ]);

    // Simular reconexión exitosa de presencia
    vi.spyOn(presenceModule, 'checkPresence').mockReturnValue({
      mode: 'enforce',
      verified: true,
      required: true,
    });

    const result = await startNextCompetitionRound(mockDb, 'valid-token', {
      headers: new Headers(),
      cookies: { get: () => undefined },
    });

    expect(result.ok).toBe(true);
    expect(result.existing).toBe(true);
    expect(result.gameSessionId).toBe(fakeGameSessionId);
    expect(result.roundNumber).toBe(1);
    expect(result.next).toBe('/play');
  });
});
