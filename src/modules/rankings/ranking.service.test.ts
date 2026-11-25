import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getDailyDateRange,
  getDailyRanking,
  getTableDailyRanking,
  getTableDailyRankingFromSessionCookie,
} from './ranking.service';
import type { Database, DbClient } from '@/db/client';
import * as sessionsModule from '@/modules/sessions';
import * as tablesRepo from '@/db/repositories/tables.repository';

describe('RankingService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getDailyDateRange (Zona Horaria America/Argentina/Cordoba)', () => {
    it('calcula la fecha local y los límites UTC exactos para hora argentina (UTC-3)', () => {
      // 15:00 UTC = 12:00 en Argentina el mismo día
      const date = new Date('2026-11-25T15:00:00.000Z');
      const { dateString, startOfDay, endOfDay } = getDailyDateRange(date);

      expect(dateString).toBe('2026-11-25');
      // 00:00:00-03:00 = 03:00:00Z
      expect(startOfDay.toISOString()).toBe('2026-11-25T03:00:00.000Z');
      // 23:59:59.999-03:00 = 02:59:59.999Z del día siguiente
      expect(endOfDay.toISOString()).toBe('2026-11-26T02:59:59.999Z');
    });

    it('asigna correctamente las 23:59:59 hora argentina al día en curso y no al siguiente', () => {
      // 23:59:59 Argentina = 02:59:59 UTC del 26 de noviembre
      const lateNight = new Date('2026-11-26T02:59:59.000Z');
      const { dateString } = getDailyDateRange(lateNight);

      expect(dateString).toBe('2026-11-25');
    });

    it('asigna las 00:00:01 hora argentina al nuevo día local y resetea el ranking', () => {
      // 00:00:01 Argentina del 26 de nov = 03:00:01 UTC del 26 de noviembre
      const justAfterMidnight = new Date('2026-11-26T03:00:01.000Z');
      const { dateString } = getDailyDateRange(justAfterMidnight);

      expect(dateString).toBe('2026-11-26');
    });

    it('garantiza que UTC solo no cambia erróneamente el día', () => {
      // 01:30 UTC del 25 de noviembre sigue siendo 22:30 del 24 de noviembre en Córdoba
      const earlyUtc = new Date('2026-11-25T01:30:00.000Z');
      const { dateString } = getDailyDateRange(earlyUtc);

      expect(dateString).toBe('2026-11-24');
    });
  });

  describe('getDailyRanking', () => {
    it('ejecuta la consulta con filtros completed, ranking_eligible=true y mapea campos públicos sin PII', async () => {
      const mockRows = [
        {
          position: 1,
          table_id: 't-01',
          table_code: 'mesa-01',
          table_display_name: 'Mesa 01',
          game_session_id: 'gs-01',
          total_score: 1400,
          correct_count: 9,
          total_response_time_ms: 32000,
          finished_at: '2026-11-25T14:30:00.000Z',
        },
        {
          position: 2,
          table_id: 't-02',
          table_code: 'mesa-02',
          table_display_name: 'Mesa 02',
          game_session_id: 'gs-02',
          total_score: 1200,
          correct_count: 8,
          total_response_time_ms: 28000,
          finished_at: '2026-11-25T15:00:00.000Z',
        },
      ];

      const mockDb = {
        execute: vi.fn().mockResolvedValue(mockRows),
      } as unknown as DbClient;

      const ranking = await getDailyRanking(mockDb, {
        date: new Date('2026-11-25T12:00:00Z'),
        limit: 10,
      });

      expect(ranking).toHaveLength(2);
      expect(ranking[0]).toEqual({
        position: 1,
        table: {
          id: 't-01',
          code: 'mesa-01',
          name: 'Mesa 01',
        },
        score: 1400,
        correctCount: 9,
        totalResponseTimeMs: 32000,
        finishedAt: new Date('2026-11-25T14:30:00.000Z'),
        gameSessionId: 'gs-01',
      });

      // Verificar que la consulta SQL fue llamada
      expect(mockDb.execute).toHaveBeenCalled();
    });

    it('retorna arreglo vacío si no hay partidas elegibles', async () => {
      const mockDb = {
        execute: vi.fn().mockResolvedValue([]),
      } as unknown as DbClient;

      const ranking = await getDailyRanking(mockDb);
      expect(ranking).toEqual([]);
    });
  });

  describe('getTableDailyRanking', () => {
    it('devuelve puesto #1 con gapToPrevious null para la mesa líder', async () => {
      const mockDb = {
        execute: vi.fn().mockResolvedValue([
          {
            position: 1,
            table_id: 't-01',
            table_code: 'mesa-01',
            table_display_name: 'Mesa 01',
            game_session_id: 'gs-01',
            total_score: 1400,
            correct_count: 9,
            total_response_time_ms: 30000,
            finished_at: '2026-11-25T14:00:00Z',
          },
        ]),
      } as unknown as DbClient;

      vi.spyOn(tablesRepo, 'getTableById').mockResolvedValue({
        id: 't-01',
        venueId: 'v-1',
        code: 'mesa-01',
        displayName: 'Mesa 01',
        status: 'in_use',
        qrToken: 'qr-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const context = await getTableDailyRanking(mockDb, 't-01', 'gs-01');

      expect(context.ranked).toBe(true);
      expect(context.position).toBe(1);
      expect(context.bestScore).toBe(1400);
      expect(context.gapToPrevious).toBeNull();
      expect(context.previousPosition).toBeNull();
      expect(context.isNewRecord).toBe(true);
    });

    it('calcula la diferencia de puntos exacta con el puesto superior si está en posición #2 o mayor', async () => {
      const mockDb = {
        execute: vi.fn().mockResolvedValue([
          {
            position: 1,
            table_id: 't-01',
            table_code: 'mesa-01',
            table_display_name: 'Mesa 01',
            game_session_id: 'gs-01',
            total_score: 1400,
            correct_count: 9,
            total_response_time_ms: 30000,
            finished_at: '2026-11-25T14:00:00Z',
          },
          {
            position: 2,
            table_id: 't-02',
            table_code: 'mesa-02',
            table_display_name: 'Mesa 02',
            game_session_id: 'gs-02',
            total_score: 1250,
            correct_count: 8,
            total_response_time_ms: 25000,
            finished_at: '2026-11-25T14:30:00Z',
          },
        ]),
      } as unknown as DbClient;

      vi.spyOn(tablesRepo, 'getTableById').mockResolvedValue({
        id: 't-02',
        venueId: 'v-1',
        code: 'mesa-02',
        displayName: 'Mesa 02',
        status: 'in_use',
        qrToken: 'qr-2',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const context = await getTableDailyRanking(mockDb, 't-02', 'gs-prev');

      expect(context.ranked).toBe(true);
      expect(context.position).toBe(2);
      expect(context.bestScore).toBe(1250);
      // 1400 - 1250 = 150 puntos de diferencia
      expect(context.gapToPrevious).toBe(150);
      expect(context.previousPosition).toBe(1);
      // gs-prev != gs-02
      expect(context.isNewRecord).toBe(false);
    });

    it('retorna ranked: false si la mesa todavía no completó partidas elegibles hoy', async () => {
      const mockDb = {
        execute: vi.fn().mockResolvedValue([]),
      } as unknown as DbClient;

      vi.spyOn(tablesRepo, 'getTableById').mockResolvedValue({
        id: 't-05',
        venueId: 'v-1',
        code: 'mesa-05',
        displayName: 'Mesa 05',
        status: 'available',
        qrToken: 'qr-5',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const context = await getTableDailyRanking(mockDb, 't-05');

      expect(context.ranked).toBe(false);
      expect(context.position).toBeNull();
      expect(context.bestScore).toBeNull();
      expect(context.gapToPrevious).toBeNull();
    });
  });

  describe('getTableDailyRankingFromSessionCookie', () => {
    it('retorna authenticated: false si no se provee cookie de sesión', async () => {
      const mockDb = {} as unknown as Database;
      const result = await getTableDailyRankingFromSessionCookie(mockDb, undefined);

      expect(result.authenticated).toBe(false);
      expect(result.ranked).toBe(false);
    });

    it('resuelve la mesa y obtiene su ranking si la cookie es válida', async () => {
      const mockDb = {
        execute: vi.fn().mockResolvedValue([
          {
            position: 1,
            table_id: 't-01',
            table_code: 'mesa-01',
            table_display_name: 'Mesa 01',
            game_session_id: 'gs-01',
            total_score: 1300,
            correct_count: 8,
            total_response_time_ms: 22000,
            finished_at: '2026-11-25T14:00:00Z',
          },
        ]),
      } as unknown as Database;

      vi.spyOn(sessionsModule, 'resolveSessionFromCookie').mockResolvedValue({
        session: {
          id: 's-1',
          tableId: 't-01',
          venueId: 'v-1',
          activeDeviceId: 'd-1',
          status: 'active',
          startedAt: new Date(),
          expiresAt: new Date(Date.now() + 10000),
          closedAt: null,
          cooldownUntil: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        device: {
          id: 'd-1',
          tableSessionId: 's-1',
          tokenHash: 'hash',
          claimedAt: new Date(),
          revokedAt: null,
          lastSeenAt: null,
          status: 'active',
          createdAt: new Date(),
        },
        table: {
          id: 't-01',
          venueId: 'v-1',
          code: 'mesa-01',
          displayName: 'Mesa 01',
          status: 'in_use',
          qrToken: 'qr-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        venue: {
          id: 'v-1',
          name: 'Punto Burger Esperanza',
          slug: 'esperanza-central',
          timezone: 'America/Argentina/Cordoba',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      vi.spyOn(tablesRepo, 'getTableById').mockResolvedValue({
        id: 't-01',
        venueId: 'v-1',
        code: 'mesa-01',
        displayName: 'Mesa 01',
        status: 'in_use',
        qrToken: 'qr-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await getTableDailyRankingFromSessionCookie(mockDb, 'valid-token');

      expect(result.authenticated).toBe(true);
      expect(result.ranked).toBe(true);
      expect(result.position).toBe(1);
      expect(result.table?.code).toBe('mesa-01');
    });
  });
});
