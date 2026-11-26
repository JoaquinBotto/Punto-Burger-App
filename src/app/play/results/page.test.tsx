import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PlayResultsPage from './page';
import * as triviaModule from '@/modules/trivia';
import * as rankingsModule from '@/modules/rankings';
import * as competitionsModule from '@/modules/competitions';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  useRouter: vi.fn(() => ({ replace: vi.fn() })),
}));

vi.mock('@/db/client', () => ({
  getDb: vi.fn(() => ({})),
}));

describe('PlayResultsPage (/play/results)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('redirige a / si no existe la cookie de sesión', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    } as unknown as Awaited<ReturnType<typeof cookies>>);

    await PlayResultsPage();

    expect(redirect).toHaveBeenCalledWith('/');
  });

  it('renderiza la pantalla de resultados con puntaje, métricas y bloque de ranking cuando la partida está completada', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'session-token' }),
    } as unknown as Awaited<ReturnType<typeof cookies>>);

    vi.spyOn(triviaModule, 'getGameResults').mockResolvedValue({
      ok: true,
      game: {
        id: 'game-123',
        status: 'completed',
        startedAt: '2026-11-25T12:00:00Z',
        finishedAt: '2026-11-25T12:04:00Z',
        totalScore: 1150,
        maxScore: 1500,
        correctCount: 8,
        incorrectCount: 2,
        unansweredCount: 0,
        category: { slug: 'deportes', name: 'Deportes' },
        group: { name: 'Los Bacon' },
        table: { code: 'mesa-01', displayName: 'Mesa 01' },
        breakdown: {
          initial: { total: 3, correct: 3, score: 300, maxScore: 300 },
          medium: { total: 4, correct: 3, score: 450, maxScore: 600 },
          advanced: { total: 3, correct: 2, score: 400, maxScore: 600 },
        },
      },
    });

    vi.spyOn(rankingsModule, 'getTableDailyRankingFromSessionCookie').mockResolvedValue({
      authenticated: true,
      ranked: true,
      position: 3,
      table: { code: 'mesa-01', name: 'Mesa 01' },
      bestScore: 1150,
      correctCount: 8,
      gapToPrevious: 50,
      previousPosition: 2,
      isNewRecord: true,
    });

    vi.spyOn(competitionsModule, 'getCompetitionState').mockResolvedValue({
      competition: null,
      entry: null,
      presence: { mode: 'off', verified: true, required: false },
    });

    const jsx = await PlayResultsPage();
    render(jsx);

    expect(screen.getByText('¡Partida terminada!')).toBeDefined();
    expect(screen.getByText('Los Bacon')).toBeDefined();
    expect(screen.getByText('1150')).toBeDefined();
    expect(screen.getByText('/ 1500 pts')).toBeDefined();
    expect(screen.getByText('8')).toBeDefined();
    expect(screen.getByText('2')).toBeDefined();
    expect(screen.getByText('Finalizar experiencia')).toBeDefined();

    // Verificación del bloque de Ranking Diario (PPA-RANK-001)
    expect(screen.getByText('Ranking de Hoy')).toBeDefined();
    expect(screen.getByText('Puesto #3')).toBeDefined();
    expect(screen.getByText('🔥 ¡Nuevo récord de Mesa 01!')).toBeDefined();
    expect(screen.getByText('Ver ranking completo')).toBeDefined();
  });
});
