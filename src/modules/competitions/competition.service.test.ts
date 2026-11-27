import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createCompetition,
  getCurrentCompetition,
  joinCompetition,
  startNextCompetitionRound,
} from './competition.service';
import {
  CompetitionNotFoundError,
  CompetitionRegistrationClosedError,
  PresenceRequiredError,
} from './errors';
import * as compRepo from './competition.repository';
import * as presenceModule from '@/lib/security/presence';
import * as sessionsModule from '@/modules/sessions';
import type { Database } from '@/db/client';
import type { Competition, TableSession, Table, Device, Venue } from '@/db/schema';

function createMockDb(compList: unknown[] = []) {
  const queryResult = {
    orderBy: vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue(compList),
    }),
    limit: vi.fn().mockResolvedValue(compList),
  };
  return {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue(queryResult),
      }),
    }),
  } as unknown as Database;
}

describe('CompetitionService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(compRepo, 'getCompetitionEntryByTableSessionId').mockResolvedValue(null);
  });

  describe('createCompetition', () => {
    it('falla si startsAt es mayor o igual a endsAt', async () => {
      const mockDb = createMockDb();
      await expect(
        createCompetition(mockDb, 'v-1', {
          localDate: '2026-11-26',
          startTime: '23:00',
          endTime: '20:00',
        })
      ).rejects.toThrow('La hora de inicio de la competencia debe ser anterior a la hora de fin.');
    });

    it('falla si no hay exactamente 6 categorías activas', async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue([{ id: 'c1' }, { id: 'c2' }]),
            }),
          }),
        }),
      } as unknown as Database;

      vi.spyOn(compRepo, 'getCompetitionByVenueAndDate').mockResolvedValue(null);

      await expect(
        createCompetition(mockDb, 'v-1', {
          localDate: '2026-11-26',
          startTime: '20:00',
          endTime: '23:00',
        })
      ).rejects.toThrow('Se requieren exactamente 6 categorías activas');
    });

    it('falla al crear open competition si ya existe una abierta activa para el venue', async () => {
      const mockDb = createMockDb();
      vi.spyOn(compRepo, 'getActiveOpenCompetitionByVenue').mockResolvedValue({
        id: 'comp-open-1',
        status: 'active',
        timingMode: 'open',
      } as unknown as Competition);

      await expect(
        createCompetition(mockDb, 'v-1', {
          timingMode: 'open',
          name: 'Prueba',
        })
      ).rejects.toThrow('Ya existe una competencia abierta activa en este local.');
    });
  });

  describe('getCurrentCompetition', () => {
    it('retorna null si no existe competencia para la fecha de hoy', async () => {
      const mockDb = createMockDb([]);

      const comp = await getCurrentCompetition(mockDb, 'v-1');
      expect(comp).toBeNull();
    });

    it('actualiza perezosamente a active si ya pasó startsAt y estaba scheduled', async () => {
      const pastStart = new Date(Date.now() - 10_000);
      const futureEnd = new Date(Date.now() + 60_000);

      const mockComp = {
        id: 'comp-1',
        status: 'scheduled',
        localDate: '2026-11-26',
        startsAt: pastStart,
        endsAt: futureEnd,
        registrationOpensAt: new Date(Date.now() - 20_000),
        joinCutoffAt: new Date(Date.now() + 30_000),
        finalizationGraceUntil: new Date(Date.now() + 120_000),
      } as unknown as Competition;

      const mockDb = createMockDb([mockComp]);
      vi.spyOn(compRepo, 'getActiveOpenCompetitionByVenue').mockResolvedValue(null);
      const updateSpy = vi.spyOn(compRepo, 'updateCompetitionStatus').mockResolvedValue({
        ...mockComp,
        status: 'active',
      });

      const comp = await getCurrentCompetition(mockDb, 'v-1');
      expect(updateSpy).toHaveBeenCalledWith(mockDb, 'comp-1', 'active');
      expect(comp?.status).toBe('active');
    });

    it('prioriza competencia open activa por sobre scheduled sin evaluar fecha u horarios', async () => {
      const mockDb = createMockDb([]);
      const mockOpenComp = {
        id: 'open-comp-1',
        timingMode: 'open',
        status: 'active',
        startsAt: null,
        endsAt: null,
      } as unknown as Competition;

      vi.spyOn(compRepo, 'getActiveOpenCompetitionByVenue').mockResolvedValue(mockOpenComp);

      const comp = await getCurrentCompetition(mockDb, 'v-1');
      expect(comp?.id).toBe('open-comp-1');
      expect(comp?.timingMode).toBe('open');
      expect(comp?.status).toBe('active');
    });
  });

  describe('joinCompetition', () => {
    it('falla si VENUE_PRESENCE_MODE = enforce y presencia no verificada', async () => {
      const mockDb = createMockDb([]);
      vi.spyOn(sessionsModule, 'resolveSessionFromCookie').mockResolvedValue({
        session: { id: 'ts-1', venueId: 'v-1', expiresAt: new Date() } as unknown as TableSession,
        table: { id: 't-1', code: 'mesa-01', displayName: 'Mesa 01' } as unknown as Table,
        device: { id: 'd-1' } as unknown as Device,
        venue: { id: 'v-1' } as unknown as Venue,
      });

      vi.spyOn(presenceModule, 'checkPresence').mockReturnValue({
        mode: 'enforce',
        verified: false,
        required: true,
      });

      await expect(
        joinCompetition(mockDb, 'token-1', {
          headers: new Headers(),
          cookies: { get: () => undefined },
        })
      ).rejects.toThrow(PresenceRequiredError);
    });

    it('falla con CompetitionNotFoundError si no hay competencia hoy', async () => {
      const mockDb = createMockDb([]);
      vi.spyOn(sessionsModule, 'resolveSessionFromCookie').mockResolvedValue({
        session: { id: 'ts-1', venueId: 'v-1' } as unknown as TableSession,
        table: { id: 't-1' } as unknown as Table,
        device: { id: 'd-1' } as unknown as Device,
        venue: { id: 'v-1' } as unknown as Venue,
      });

      vi.spyOn(presenceModule, 'checkPresence').mockReturnValue({
        mode: 'off',
        verified: true,
        required: false,
      });

      await expect(
        joinCompetition(mockDb, 'token-1', {
          headers: new Headers(),
          cookies: { get: () => undefined },
        })
      ).rejects.toThrow(CompetitionNotFoundError);
    });

    it('falla con CompetitionRegistrationClosedError si todavía no abrió la inscripción', async () => {
      vi.spyOn(sessionsModule, 'resolveSessionFromCookie').mockResolvedValue({
        session: { id: 'ts-1', venueId: 'v-1' } as unknown as TableSession,
        table: { id: 't-1' } as unknown as Table,
        device: { id: 'd-1' } as unknown as Device,
        venue: { id: 'v-1' } as unknown as Venue,
      });

      vi.spyOn(presenceModule, 'checkPresence').mockReturnValue({
        mode: 'off',
        verified: true,
        required: false,
      });

      const todayStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Argentina/Cordoba',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());

      const futureOpen = new Date(Date.now() + 300_000);
      const mockDb = createMockDb([
        {
          id: 'comp-1',
          status: 'scheduled',
          localDate: todayStr,
          registrationOpensAt: futureOpen,
          startsAt: new Date(Date.now() + 600_000),
          endsAt: new Date(Date.now() + 1000_000),
          joinCutoffAt: new Date(Date.now() + 900_000),
          finalizationGraceUntil: new Date(Date.now() + 1200_000),
        },
      ]);

      await expect(
        joinCompetition(mockDb, 'token-1', {
          headers: new Headers(),
          cookies: { get: () => undefined },
        })
      ).rejects.toThrow(CompetitionRegistrationClosedError);
    });

    it('falla con CompetitionRegistrationClosedError si ya pasó el cutoff de registro', async () => {
      vi.spyOn(sessionsModule, 'resolveSessionFromCookie').mockResolvedValue({
        session: { id: 'ts-1', venueId: 'v-1' } as unknown as TableSession,
        table: { id: 't-1' } as unknown as Table,
        device: { id: 'd-1' } as unknown as Device,
        venue: { id: 'v-1' } as unknown as Venue,
      });

      vi.spyOn(presenceModule, 'checkPresence').mockReturnValue({
        mode: 'off',
        verified: true,
        required: false,
      });

      const todayStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Argentina/Cordoba',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());

      const pastCutoff = new Date(Date.now() - 60_000);
      const mockDb = createMockDb([
        {
          id: 'comp-1',
          status: 'active',
          localDate: todayStr,
          registrationOpensAt: new Date(Date.now() - 500_000),
          startsAt: new Date(Date.now() - 300_000),
          endsAt: new Date(Date.now() + 100_000),
          joinCutoffAt: pastCutoff,
          finalizationGraceUntil: new Date(Date.now() + 200_000),
        },
      ]);

      await expect(
        joinCompetition(mockDb, 'token-1', {
          headers: new Headers(),
          cookies: { get: () => undefined },
        })
      ).rejects.toThrow(CompetitionRegistrationClosedError);
    });

    it('devuelve entrada existente de forma idempotente en reintento (200 OK)', async () => {
      vi.spyOn(sessionsModule, 'resolveSessionFromCookie').mockResolvedValue({
        session: { id: 'ts-1', venueId: 'v-1' } as unknown as TableSession,
        table: { id: 't-1' } as unknown as Table,
        device: { id: 'd-1' } as unknown as Device,
        venue: { id: 'v-1' } as unknown as Venue,
      });

      vi.spyOn(presenceModule, 'checkPresence').mockReturnValue({
        mode: 'off',
        verified: true,
        required: false,
      });

      const mockDb = createMockDb([
        {
          id: 'comp-1',
          status: 'active',
          timingMode: 'open',
        },
      ]);

      vi.spyOn(compRepo, 'getActiveOpenCompetitionByVenue').mockResolvedValue({
        id: 'comp-1',
        status: 'active',
        timingMode: 'open',
      } as unknown as Competition);

      vi.spyOn(compRepo, 'getCompetitionEntryByTableSessionId').mockResolvedValue({
        id: 'ce-existing-1',
        competitionId: 'comp-1',
        tableSessionId: 'ts-1',
        status: 'registered',
      } as never);

      const result = await joinCompetition(mockDb, 'token-1', {
        headers: new Headers(),
        cookies: { get: () => undefined },
      });

      expect(result.ok).toBe(true);
      expect(result.entryId).toBe('ce-existing-1');
      expect(result.competitionId).toBe('comp-1');
      expect(result.next).toBe('/play');
    });
  });

  describe('startNextCompetitionRound (Idempotencia)', () => {
    it('devuelve ciclo existente si ya está en status created o active sin crear duplicados', async () => {
      vi.spyOn(sessionsModule, 'resolveSessionFromCookie').mockResolvedValue({
        session: { id: 'ts-1', venueId: 'v-1' } as unknown as TableSession,
        table: { id: 't-1' } as unknown as Table,
        device: { id: 'd-1' } as unknown as Device,
        venue: { id: 'v-1' } as unknown as Venue,
      });

      vi.spyOn(presenceModule, 'checkPresence').mockReturnValue({
        mode: 'off',
        verified: true,
        required: false,
      });

      vi.spyOn(compRepo, 'getCompetitionEntryByTableSessionId').mockResolvedValue({
        id: 'ce-1',
        competitionId: 'comp-1',
        tableSessionId: 'ts-1',
        status: 'active',
      } as never);

      // Ronda 1 ya creada con gameSession en status created
      vi.spyOn(compRepo, 'getCompetitionRounds').mockResolvedValue([
        {
          id: 'cr-1',
          roundNumber: 1,
          competitionEntryId: 'ce-1',
          gameSessionId: 'gs-round-1',
          gameSession: {
            id: 'gs-round-1',
            status: 'created',
            totalScore: 0,
          },
        },
      ] as never);

      const mockDb = {} as Database;

      const result = await startNextCompetitionRound(mockDb, 'token-1', {
        headers: new Headers(),
        cookies: { get: () => undefined },
      });

      expect(result.ok).toBe(true);
      expect(result.existing).toBe(true);
      expect(result.roundNumber).toBe(1);
      expect(result.gameSessionId).toBe('gs-round-1');
      expect(result.next).toBe('/play');
    });
  });
});
