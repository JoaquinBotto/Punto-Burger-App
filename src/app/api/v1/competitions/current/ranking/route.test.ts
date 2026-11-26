import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';
import * as compModule from '@/modules/competitions';

vi.mock('@/db/client', () => ({
  getDb: vi.fn(() => ({
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: 'v-01' }]),
        }),
      }),
    }),
  })),
}));

describe('GET /api/v1/competitions/current/ranking', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('retorna HTTP 200 con ranking vacío si no hay competencia hoy', async () => {
    vi.spyOn(compModule, 'getCurrentCompetition').mockResolvedValue(null);

    const req = new NextRequest(
      'https://app.puntoburger.com.ar/api/v1/competitions/current/ranking'
    );
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.competition).toBeNull();
    expect(data.ranking).toEqual([]);
  });

  it('retorna HTTP 200 con la tabla de clasificación sin PII cuando existe competencia', async () => {
    vi.spyOn(compModule, 'getCurrentCompetition').mockResolvedValue({
      id: 'comp-uuid',
      venueId: 'v-01',
      timingMode: 'scheduled',
      localDate: '2026-11-26',
      name: 'Competencia Oficial',
      status: 'active',
      startsAt: new Date('2026-11-26T23:00:00Z'),
      endsAt: new Date('2026-11-27T02:00:00Z'),
      registrationOpensAt: new Date('2026-11-26T22:30:00Z'),
      joinCutoffAt: new Date('2026-11-27T01:30:00Z'),
      finalizationGraceUntil: new Date('2026-11-27T02:30:00Z'),
      isTest: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.spyOn(compModule, 'getCompetitionRanking').mockResolvedValue([
      {
        position: 1,
        entryId: 'entry-01',
        table: 'Mesa 01',
        tableCode: 'mesa-01',
        groupName: 'Los Bacon',
        displayName: 'Mesa 01 · Los Bacon',
        roundsCompleted: 3,
        totalScore: 4100,
        correctCount: 27,
        totalResponseTimeMs: 80000,
        completedAt: '2026-11-27T01:10:00Z',
        joinedAt: '2026-11-26T23:05:00Z',
      },
    ]);

    const req = new NextRequest(
      'https://app.puntoburger.com.ar/api/v1/competitions/current/ranking'
    );
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.ranking).toHaveLength(1);
    expect(data.ranking[0].position).toBe(1);
    expect(data.ranking[0].table).toBe('Mesa 01');
    expect(data.ranking[0].displayName).toBe('Mesa 01 · Los Bacon');

    const str = JSON.stringify(data);
    expect(str).not.toContain('participants');
    expect(str).not.toContain('tableSessionId');
  });
});
