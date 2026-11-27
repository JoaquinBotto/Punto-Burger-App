import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PlayPage from './page';
import * as triviaModule from '@/modules/trivia';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
  })),
}));

vi.mock('@/db/client', () => ({
  getDb: vi.fn(() => ({})),
}));

describe('PlayPage (/play)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('redirige a / si no existe la cookie de sesión', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    } as unknown as Awaited<ReturnType<typeof cookies>>);

    await PlayPage();

    expect(redirect).toHaveBeenCalledWith('/');
  });

  it('redirige a /play/setup si la partida no está preparada con 10 preguntas', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'session-token' }),
    } as unknown as Awaited<ReturnType<typeof cookies>>);

    vi.spyOn(triviaModule, 'getPlayPageData').mockResolvedValue({
      table: { code: 'mesa-01', displayName: 'Mesa 01' },
      group: { name: 'Los Bacon', participantCount: 2 },
      category: { slug: 'deportes', name: 'Deportes' },
      structure: { initial: 3, medium: 4, advanced: 3, total: 10 },
      gameStatus: 'created',
      isPrepared: false,
      mode: 'casual',
    });

    await PlayPage();

    expect(redirect).toHaveBeenCalledWith('/play/setup');
  });

  it('renderiza la pantalla de partida preparada sin filtrar respuestas correctas', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'session-token' }),
    } as unknown as Awaited<ReturnType<typeof cookies>>);

    vi.spyOn(triviaModule, 'getPlayPageData').mockResolvedValue({
      table: { code: 'mesa-01', displayName: 'Mesa 01' },
      group: { name: 'Los Bacon', participantCount: 2 },
      category: { slug: 'deportes', name: 'Deportes' },
      structure: { initial: 3, medium: 4, advanced: 3, total: 10 },
      gameStatus: 'created',
      isPrepared: true,
      mode: 'casual',
    });

    const jsx = await PlayPage();
    render(jsx);

    expect(screen.getByText('¡Todo listo!')).toBeDefined();
    expect(screen.getByText('Preparamos 10 preguntas para tu equipo.')).toBeDefined();
    expect(screen.getAllByText('Los Bacon')).toHaveLength(2);
    expect(screen.getByText('Deportes')).toBeDefined();
    expect(screen.getByText(/3 iniciales/i)).toBeDefined();
    expect(screen.getByText(/4 intermedias/i)).toBeDefined();
    expect(screen.getByText(/3 avanzadas/i)).toBeDefined();

    // Botón de comenzar ahora habilitado para iniciar el juego en PPA-013
    const startButton = screen.getByRole('button', { name: /Comenzar/i });
    expect(startButton.hasAttribute('disabled')).toBe(false);

    // Asegurarse de que no hay respuestas en el documento
    expect(screen.queryByText(/Opción A/i)).toBeNull();
    expect(screen.queryByText(/Opción Correcta/i)).toBeNull();
  });

  it('redirige a /play/results si la partida ya fue completada', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'session-token' }),
    } as unknown as Awaited<ReturnType<typeof cookies>>);

    vi.spyOn(triviaModule, 'getPlayPageData').mockResolvedValue({
      table: { code: 'mesa-01', displayName: 'Mesa 01' },
      group: { name: 'Los Bacon', participantCount: 2 },
      category: { slug: 'deportes', name: 'Deportes' },
      structure: { initial: 3, medium: 4, advanced: 3, total: 10 },
      gameStatus: 'completed',
      isPrepared: true,
      mode: 'casual',
    });

    await PlayPage();

    expect(redirect).toHaveBeenCalledWith('/play/results');
  });

  it('PPA-HOTFIX-003: renderiza la pantalla de competition round con modalidad mixta y botón de ciclo específico', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'session-token' }),
    } as unknown as Awaited<ReturnType<typeof cookies>>);

    vi.spyOn(triviaModule, 'getPlayPageData').mockResolvedValue({
      table: { code: 'mesa-01', displayName: 'Mesa 01' },
      group: { name: 'Los Bacon', participantCount: 2 },
      category: { slug: 'mixed', name: 'Categorías mixtas' },
      structure: { initial: 5, medium: 4, advanced: 1, total: 10 },
      gameStatus: 'created',
      isPrepared: true,
      mode: 'competition',
      competition: {
        id: 'comp-1',
        name: 'Competencia Punto Burger',
      },
      roundNumber: 1,
    });

    const jsx = await PlayPage();
    render(jsx);

    // Debe renderizar sin redirect
    expect(screen.getByText('Competencia Punto Burger')).toBeDefined();
    expect(screen.getAllByText(/Ciclo 1 de 3/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Categorías mixtas')).toBeDefined();
    expect(screen.getByText(/5 iniciales/i)).toBeDefined();
    expect(screen.getByText(/4 intermedias/i)).toBeDefined();
    expect(screen.getByText(/1 avanzadas/i)).toBeDefined();

    // Botón específico de ciclo
    const startButton = screen.getByRole('button', { name: /Comenzar Ciclo 1/i });
    expect(startButton).toBeDefined();
  });
});
