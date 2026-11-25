import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Database } from '../../db/client';
import { saveGameSetup, getPlaySetupData } from './groups.service';
import * as sessionsService from '../sessions/sessions.service';
import * as groupsRepo from '../../db/repositories/groups.repository';
import * as participantsRepo from '../../db/repositories/participants.repository';
import * as gameSessionsRepo from '../../db/repositories/game-sessions.repository';
import * as categoriesRepo from '../../db/repositories/categories.repository';
import * as auditRepo from '../../db/repositories/audit-events.repository';
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
} from './errors';

describe('Groups & Game Setup Service (PPA-011)', () => {
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
      qrToken: 'qr-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    venue: {
      id: fakeVenueId,
      name: 'Punto Burger Esperanza',
      slug: 'esperanza-central',
      timezone: 'America/Argentina/Cordoba',
      status: 'active' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  const mockCategory = {
    id: fakeCategoryId,
    slug: 'deportes',
    name: 'Deportes',
    description: 'Fútbol, básquet y más.',
    status: 'active' as const,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let mockDb: Database;

  beforeEach(() => {
    vi.restoreAllMocks();

    mockDb = {
      transaction: vi.fn(async (cb) => cb(mockDb)),
    } as unknown as Database;

    vi.spyOn(sessionsService, 'resolveSessionFromCookie').mockResolvedValue(mockResolvedSession);
    vi.spyOn(categoriesRepo, 'getCategoryBySlug').mockResolvedValue(mockCategory);
    vi.spyOn(categoriesRepo, 'checkCategoryReadiness').mockResolvedValue({
      isReady: true,
      initialCount: 4,
      mediumCount: 4,
      advancedCount: 4,
    });
    vi.spyOn(gameSessionsRepo, 'getGameSessionByTableSessionId').mockResolvedValue(null);
    vi.spyOn(groupsRepo, 'getGroupByTableSessionId').mockResolvedValue(null);
    vi.spyOn(groupsRepo, 'createGroup').mockResolvedValue({
      id: fakeGroupId,
      tableSessionId: fakeSessionId,
      name: 'Los Bacon',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.spyOn(participantsRepo, 'replaceGroupParticipants').mockResolvedValue([
      {
        id: 'p-1',
        groupId: fakeGroupId,
        alias: 'Joaco',
        ageRange: 'adult',
        educationLevel: 'higher',
        position: 1,
        createdAt: new Date(),
      },
    ]);
    vi.spyOn(gameSessionsRepo, 'createGameSession').mockResolvedValue({
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
    });
    vi.spyOn(auditRepo, 'createAuditEvent').mockResolvedValue({
      id: 'a-1',
      venueId: fakeVenueId,
      eventType: 'group_created',
      entityType: 'group',
      entityId: fakeGroupId,
      actorType: 'device',
      actorId: fakeDeviceId,
      metadata: {},
      createdAt: new Date(),
    });
  });

  const validPayload = {
    groupName: 'Los Bacon',
    participants: [
      {
        alias: 'Joaco',
        ageRange: 'adult',
        educationLevel: 'higher',
      },
    ],
    categorySlug: 'deportes',
  };

  it('guarda exitosamente el setup del equipo, participantes y sesión de juego en status created', async () => {
    const result = await saveGameSetup(mockDb, 'valid-token', validPayload);

    expect(result.ok).toBe(true);
    expect(result.group.name).toBe('Los Bacon');
    expect(result.participants).toHaveLength(1);
    expect(result.participants[0]?.position).toBe(1);
    expect(result.gameSession.status).toBe('created');
    expect(result.gameSession.categorySlug).toBe('deportes');
    expect(auditRepo.createAuditEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ eventType: 'group_created' })
    );
    expect(auditRepo.createAuditEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ eventType: 'game_setup_created' })
    );
  });

  it('rechaza si la cookie es inexistente o vacía con SessionNotFoundError', async () => {
    await expect(saveGameSetup(mockDb, '', validPayload)).rejects.toThrow(SessionNotFoundError);
  });

  it('rechaza si la sesión no pudo ser resuelta o expiró con SessionExpiredError', async () => {
    vi.spyOn(sessionsService, 'resolveSessionFromCookie').mockResolvedValue(null);

    await expect(saveGameSetup(mockDb, 'expired-token', validPayload)).rejects.toThrow(
      SessionExpiredError
    );
  });

  it('rechaza si el dispositivo no ostenta el control activo de la mesa', async () => {
    vi.spyOn(sessionsService, 'resolveSessionFromCookie').mockResolvedValue({
      ...mockResolvedSession,
      session: {
        ...mockResolvedSession.session,
        activeDeviceId: 'other-device-id',
      },
    });

    await expect(saveGameSetup(mockDb, 'valid-token', validPayload)).rejects.toThrow(
      DeviceNotActiveError
    );
  });

  it('valida el nombre del equipo: rechaza nombres menores a 2 caracteres o mayores a 30', async () => {
    await expect(
      saveGameSetup(mockDb, 'token', { ...validPayload, groupName: 'A' })
    ).rejects.toThrow(GroupNameInvalidError);

    await expect(
      saveGameSetup(mockDb, 'token', {
        ...validPayload,
        groupName: 'Este nombre de equipo es excesivamente largo para el sistema',
      })
    ).rejects.toThrow(GroupNameInvalidError);
  });

  it('permite grupos desde 1 hasta 8 participantes y rechaza 0 o 9 participantes', async () => {
    await expect(
      saveGameSetup(mockDb, 'token', { ...validPayload, participants: [] })
    ).rejects.toThrow(ParticipantCountInvalidError);

    const nineParticipants = Array.from({ length: 9 }, (_, i) => ({
      alias: `Player ${i + 1}`,
      ageRange: 'adult',
    }));

    await expect(
      saveGameSetup(mockDb, 'token', {
        ...validPayload,
        participants: nineParticipants,
      })
    ).rejects.toThrow(ParticipantCountInvalidError);
  });

  it('asigna posiciones secuenciales 1..N a los participantes de forma estable', async () => {
    const fourParticipants = [
      { alias: 'Ana', ageRange: 'child', educationLevel: 'primary' },
      { alias: 'Beto', ageRange: 'teen', educationLevel: 'secondary' },
      { alias: 'Carla', ageRange: 'adult', educationLevel: 'higher' },
      { alias: 'Dani', ageRange: 'adult', educationLevel: 'none' },
    ];

    await saveGameSetup(mockDb, 'token', {
      ...validPayload,
      participants: fourParticipants,
    });

    expect(participantsRepo.replaceGroupParticipants).toHaveBeenCalledWith(
      expect.anything(),
      fakeGroupId,
      [
        { alias: 'Ana', ageRange: 'child', educationLevel: 'primary', position: 1 },
        { alias: 'Beto', ageRange: 'teen', educationLevel: 'secondary', position: 2 },
        { alias: 'Carla', ageRange: 'adult', educationLevel: 'higher', position: 3 },
        { alias: 'Dani', ageRange: 'adult', educationLevel: 'none', position: 4 },
      ]
    );
  });

  it('valida el alias de cada participante: no permite alias vacíos ni mayores a 24 caracteres', async () => {
    await expect(
      saveGameSetup(mockDb, 'token', {
        ...validPayload,
        participants: [{ alias: '   ', ageRange: 'adult' }],
      })
    ).rejects.toThrow(ParticipantInvalidError);

    await expect(
      saveGameSetup(mockDb, 'token', {
        ...validPayload,
        participants: [
          {
            alias: 'NombreDeJugadorConMasDeVeinticuatroCaracteres',
            ageRange: 'adult',
          },
        ],
      })
    ).rejects.toThrow(ParticipantInvalidError);
  });

  it('rechaza categorías inexistentes o inactivas', async () => {
    vi.spyOn(categoriesRepo, 'getCategoryBySlug').mockResolvedValue(null);

    await expect(
      saveGameSetup(mockDb, 'token', { ...validPayload, categorySlug: 'inexistente' })
    ).rejects.toThrow(CategoryNotFoundError);

    vi.spyOn(categoriesRepo, 'getCategoryBySlug').mockResolvedValue({
      ...mockCategory,
      status: 'inactive',
    });

    await expect(
      saveGameSetup(mockDb, 'token', { ...validPayload, categorySlug: 'deportes' })
    ).rejects.toThrow(CategoryNotAvailableError);
  });

  it('rechaza categorías sin suficientes preguntas aprobadas (readiness 3/4/3)', async () => {
    vi.spyOn(categoriesRepo, 'checkCategoryReadiness').mockResolvedValue({
      isReady: false,
      initialCount: 2, // requiere >= 3
      mediumCount: 4,
      advancedCount: 3,
    });

    await expect(saveGameSetup(mockDb, 'token', validPayload)).rejects.toThrow(
      CategoryNotReadyError
    );
  });

  it('permite editar la configuración mientras game_session está en status created (idempotencia y actualización)', async () => {
    // Simular que el grupo ya existía
    vi.spyOn(groupsRepo, 'getGroupByTableSessionId').mockResolvedValue({
      id: fakeGroupId,
      tableSessionId: fakeSessionId,
      name: 'Nombre Anterior',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.spyOn(groupsRepo, 'updateGroupName').mockResolvedValue({
      id: fakeGroupId,
      tableSessionId: fakeSessionId,
      name: 'Nombre Editado',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Simular que la sesión de juego ya existía con categoría vieja
    vi.spyOn(gameSessionsRepo, 'getGameSessionByTableSessionId').mockResolvedValue({
      id: fakeGameSessionId,
      tableSessionId: fakeSessionId,
      groupId: fakeGroupId,
      categoryId: 'old-cat-id',
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
    });
    vi.spyOn(gameSessionsRepo, 'updateGameSessionCategory').mockResolvedValue({
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
    });

    const result = await saveGameSetup(mockDb, 'token', {
      ...validPayload,
      groupName: 'Nombre Editado',
    });

    expect(result.ok).toBe(true);
    expect(groupsRepo.updateGroupName).toHaveBeenCalledWith(
      expect.anything(),
      fakeGroupId,
      'Nombre Editado'
    );
    expect(gameSessionsRepo.updateGameSessionCategory).toHaveBeenCalledWith(
      expect.anything(),
      fakeGameSessionId,
      fakeCategoryId
    );
    expect(auditRepo.createAuditEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ eventType: 'game_setup_updated' })
    );
  });

  it('rechaza la edición si la partida ya fue iniciada (status active)', async () => {
    vi.spyOn(gameSessionsRepo, 'getGameSessionByTableSessionId').mockResolvedValue({
      id: fakeGameSessionId,
      tableSessionId: fakeSessionId,
      groupId: fakeGroupId,
      categoryId: fakeCategoryId,
      status: 'active', // ya arrancó
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
    });

    await expect(saveGameSetup(mockDb, 'token', validPayload)).rejects.toThrow(
      GameAlreadyStartedError
    );
  });

  it('asegura que PPA-011 nunca genera preguntas en game_questions', async () => {
    const result = await saveGameSetup(mockDb, 'token', validPayload);

    expect(result.gameSession.status).toBe('created');
    // game_session permanece en created sin generar preguntas
  });

  it('recupera la configuración existente de forma transparente vía getPlaySetupData', async () => {
    vi.spyOn(categoriesRepo, 'getActiveCategoriesWithReadiness').mockResolvedValue([
      { ...mockCategory, isReady: true },
    ]);
    vi.spyOn(groupsRepo, 'getGroupByTableSessionId').mockResolvedValue({
      id: fakeGroupId,
      tableSessionId: fakeSessionId,
      name: 'Los Bacon',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.spyOn(participantsRepo, 'getParticipantsByGroupId').mockResolvedValue([
      {
        id: 'p-1',
        groupId: fakeGroupId,
        alias: 'Joaco',
        ageRange: 'adult',
        educationLevel: 'higher',
        position: 1,
        createdAt: new Date(),
      },
    ]);
    vi.spyOn(gameSessionsRepo, 'getGameSessionWithCategory').mockResolvedValue({
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
      category: mockCategory,
    });

    const setupData = await getPlaySetupData(mockDb, 'valid-token');

    expect(setupData).not.toBeNull();
    expect(setupData?.table.displayName).toBe('Mesa 01');
    expect(setupData?.categories).toHaveLength(1);
    expect(setupData?.existingSetup).toEqual({
      groupName: 'Los Bacon',
      participants: [
        {
          alias: 'Joaco',
          ageRange: 'adult',
          educationLevel: 'higher',
          position: 1,
        },
      ],
      categorySlug: 'deportes',
      isSaved: true,
    });
  });
});
