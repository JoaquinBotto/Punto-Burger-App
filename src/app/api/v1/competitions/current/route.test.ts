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

describe('GET /api/v1/competitions/current', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('retorna HTTP 200 con competition: null si no hay competencia hoy', async () => {
    vi.spyOn(compModule, 'getCurrentCompetition').mockResolvedValue(null);

    const req = new NextRequest('https://app.puntoburger.com.ar/api/v1/competitions/current');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.competition).toBeNull();
  });

  it('retorna HTTP 200 con los datos públicos de la competencia si existe', async () => {
    vi.spyOn(compModule, 'getCurrentCompetition').mockResolvedValue({
      id: 'comp-uuid',
      venueId: 'v-01',
      localDate: '2026-11-26',
      name: 'Competencia Nocturna',
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

    const req = new NextRequest('https://app.puntoburger.com.ar/api/v1/competitions/current');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.competition.id).toBe('comp-uuid');
    expect(data.competition.name).toBe('Competencia Nocturna');
    expect(data.competition.status).toBe('active');
  });
});
