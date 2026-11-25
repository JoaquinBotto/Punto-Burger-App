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
    });

    await PlayPage();

    expect(redirect).toHaveBeenCalledWith('/play/results');
  });
});
