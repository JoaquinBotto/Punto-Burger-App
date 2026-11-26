import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCompetitionRanking } from './competition-ranking.service';
import type { DbClient } from '@/db/client';

describe('CompetitionRankingService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCompetitionRanking', () => {
    it('ejecuta la agregación SQL y retorna las mesas ordenadas sin PII', async () => {
      const mockRows = [
        {
          position: '1',
          entry_id: 'entry-01',
          table_id: 't-01',
          table_code: 'mesa-01',
          table_display_name: 'Mesa 01',
          group_name: 'Los Bacon',
          rounds_completed: '3',
          total_score: '4250',
          correct_count: '28',
          total_response_time_ms: '85000',
          completed_at: '2026-11-26T22:15:00.000Z',
          joined_at: '2026-11-26T20:10:00.000Z',
        },
        {
          position: '2',
          entry_id: 'entry-02',
          table_id: 't-04',
          table_code: 'mesa-04',
          table_display_name: 'Mesa 04',
          group_name: 'Los Cracks',
          rounds_completed: '3',
          total_score: '3900',
          correct_count: '26',
          total_response_time_ms: '92000',
          completed_at: '2026-11-26T22:20:00.000Z',
          joined_at: '2026-11-26T20:05:00.000Z',
        },
      ];

      const mockDb = {
        execute: vi.fn().mockResolvedValue(mockRows),
      } as unknown as DbClient;

      const ranking = await getCompetitionRanking(mockDb, 'comp-uuid');

      expect(mockDb.execute).toHaveBeenCalledTimes(1);
      expect(ranking).toHaveLength(2);
      expect(ranking[0]).toEqual({
        position: 1,
        entryId: 'entry-01',
        table: 'Mesa 01',
        tableCode: 'mesa-01',
        groupName: 'Los Bacon',
        displayName: 'Mesa 01 · Los Bacon',
        roundsCompleted: 3,
        totalScore: 4250,
        correctCount: 28,
        totalResponseTimeMs: 85000,
        completedAt: '2026-11-26T22:15:00.000Z',
        joinedAt: '2026-11-26T20:10:00.000Z',
      });

      // Validar que no hay PII de participantes individuales
      const rankingStr = JSON.stringify(ranking);
      expect(rankingStr).not.toContain('participant');
      expect(rankingStr).not.toContain('ageRange');
      expect(rankingStr).not.toContain('educationLevel');
    });

    it('maneja valores numéricos y nulls adecuadamente', async () => {
      const mockRows = [
        {
          position: 1,
          table_id: 't-02',
          table_code: 'mesa-02',
          table_display_name: 'Mesa 02',
          rounds_completed: 1,
          total_score: 1100,
          correct_count: 8,
          total_response_time_ms: 30000,
          completed_at: null,
          joined_at: new Date('2026-11-26T20:15:00.000Z'),
        },
      ];

      const mockDb = {
        execute: vi.fn().mockResolvedValue(mockRows),
      } as unknown as DbClient;

      const ranking = await getCompetitionRanking(mockDb, 'comp-uuid');

      expect(ranking[0]!.completedAt).toBeNull();
      expect(ranking[0]!.joinedAt).toBe('2026-11-26T20:15:00.000Z');
      expect(ranking[0]!.roundsCompleted).toBe(1);
      expect(ranking[0]!.totalScore).toBe(1100);
    });

    it('soporta múltiples grupos en la misma mesa física (distintas entries)', async () => {
      const mockRows = [
        {
          position: 1,
          entry_id: 'entry-a',
          table_id: 't-01',
          table_code: 'mesa-01',
          table_display_name: 'Mesa 01',
          group_name: 'Los Bacon',
          rounds_completed: 3,
          total_score: 3950,
          correct_count: 27,
          total_response_time_ms: 80000,
          completed_at: '2026-11-26T21:00:00.000Z',
          joined_at: '2026-11-26T19:00:00.000Z',
        },
        {
          position: 2,
          entry_id: 'entry-b',
          table_id: 't-01',
          table_code: 'mesa-01',
          table_display_name: 'Mesa 01',
          group_name: 'Los Cracks',
          rounds_completed: 3,
          total_score: 3500,
          correct_count: 24,
          total_response_time_ms: 88000,
          completed_at: '2026-11-26T23:00:00.000Z',
          joined_at: '2026-11-26T21:30:00.000Z',
        },
      ];

      const mockDb = {
        execute: vi.fn().mockResolvedValue(mockRows),
      } as unknown as DbClient;

      const ranking = await getCompetitionRanking(mockDb, 'comp-uuid');

      expect(ranking).toHaveLength(2);
      expect(ranking[0]?.tableCode).toBe('mesa-01');
      expect(ranking[0]?.displayName).toBe('Mesa 01 · Los Bacon');
      expect(ranking[1]?.tableCode).toBe('mesa-01');
      expect(ranking[1]?.displayName).toBe('Mesa 01 · Los Cracks');
      expect(ranking[0]?.entryId).not.toBe(ranking[1]?.entryId);
    });
  });
});
