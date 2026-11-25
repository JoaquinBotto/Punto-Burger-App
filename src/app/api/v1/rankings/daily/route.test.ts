import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';
import * as rankingsModule from '@/modules/rankings';

vi.mock('@/db/client', () => ({
  getDb: vi.fn(() => ({})),
}));

describe('GET /api/v1/rankings/daily', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('retorna HTTP 200 con la estructura del ranking diario público sin PII ni IDs internos', async () => {
    vi.spyOn(rankingsModule, 'getDailyRanking').mockResolvedValue([
      {
        position: 1,
        table: { id: 'uuid-1', code: 'mesa-07', name: 'Mesa 07' },
        score: 1420,
        correctCount: 9,
        totalResponseTimeMs: 31200,
        finishedAt: new Date('2026-11-25T14:00:00Z'),
        gameSessionId: 'internal-gs-id',
      },
      {
        position: 2,
        table: { id: 'uuid-2', code: 'mesa-03', name: 'Mesa 03' },
        score: 1350,
        correctCount: 8,
        totalResponseTimeMs: 29500,
        finishedAt: new Date('2026-11-25T14:15:00Z'),
        gameSessionId: 'internal-gs-id-2',
      },
    ]);

    const req = new NextRequest('https://app.puntoburger.com.ar/api/v1/rankings/daily');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.timezone).toBe('America/Argentina/Cordoba');
    expect(data.ranking).toHaveLength(2);
    expect(data.ranking[0]).toEqual({
      position: 1,
      table: {
        code: 'mesa-07',
        name: 'Mesa 07',
      },
      score: 1420,
      correctCount: 9,
    });

    // Cero filtraciones: sin IDs internos, sin nombres de grupo, sin participantes, sin respuestas
    const stringified = JSON.stringify(data);
    expect(stringified).not.toContain('internal-gs-id');
    expect(stringified).not.toContain('uuid-1');
    expect(stringified).not.toContain('tableSessionId');
    expect(stringified).not.toContain('participant');
    expect(stringified).not.toContain('answer');
  });

  it('respeta el parámetro limit sin permitir números abusivos', async () => {
    const getDailyRankingSpy = vi.spyOn(rankingsModule, 'getDailyRanking').mockResolvedValue([]);

    const req = new NextRequest('https://app.puntoburger.com.ar/api/v1/rankings/daily?limit=5');
    await GET(req);

    expect(getDailyRankingSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ limit: 5 })
    );
  });
});
