import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';
import * as rankingsModule from '@/modules/rankings';

vi.mock('@/db/client', () => ({
  getDb: vi.fn(() => ({})),
}));

describe('GET /api/v1/rankings/daily/me', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('retorna authenticated: false si el cliente no posee cookie de sesión', async () => {
    vi.spyOn(rankingsModule, 'getTableDailyRankingFromSessionCookie').mockResolvedValue({
      authenticated: false,
      ranked: false,
      position: null,
      table: null,
      bestScore: null,
      correctCount: null,
      gapToPrevious: null,
      previousPosition: null,
    });

    const req = new NextRequest('https://app.puntoburger.com.ar/api/v1/rankings/daily/me');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.authenticated).toBe(false);
    expect(data.ranked).toBe(false);
  });

  it('retorna la posición contextual de la mesa actual protegida por cookie', async () => {
    vi.spyOn(rankingsModule, 'getTableDailyRankingFromSessionCookie').mockResolvedValue({
      authenticated: true,
      ranked: true,
      position: 6,
      table: { code: 'mesa-01', name: 'Mesa 01' },
      bestScore: 980,
      correctCount: 7,
      gapToPrevious: 90,
      previousPosition: 5,
    });

    const req = new NextRequest('https://app.puntoburger.com.ar/api/v1/rankings/daily/me', {
      headers: {
        cookie: 'pb_table_session=test-token',
      },
    });

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.authenticated).toBe(true);
    expect(data.ranked).toBe(true);
    expect(data.position).toBe(6);
    expect(data.table.code).toBe('mesa-01');
    expect(data.bestScore).toBe(980);
    expect(data.gapToPrevious).toBe(90);
    expect(data.previousPosition).toBe(5);
  });
});
