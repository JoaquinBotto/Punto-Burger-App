import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RankingClient } from './ranking-client';

describe('RankingClient (/ranking)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn();
  });

  it('muestra el estado vacío cuando no hay mesas con partidas hoy', () => {
    render(<RankingClient initialDate="2026-11-25" initialRanking={[]} initialContext={null} />);

    expect(screen.getByText('Ranking de Hoy')).toBeDefined();
    expect(screen.getByText('Todavía no hay mesas en el ranking de hoy.')).toBeDefined();
    expect(screen.getByText('¡Podés ser la primera mesa en inaugurar el podio!')).toBeDefined();
  });

  it('renderiza el podio Top 3 y la lista de posiciones subsiguientes', () => {
    const mockRanking = [
      {
        position: 1,
        table: { code: 'mesa-07', name: 'Mesa 07' },
        score: 1420,
        correctCount: 9,
      },
      {
        position: 2,
        table: { code: 'mesa-03', name: 'Mesa 03' },
        score: 1350,
        correctCount: 8,
      },
      {
        position: 3,
        table: { code: 'mesa-12', name: 'Mesa 12' },
        score: 1270,
        correctCount: 7,
      },
      {
        position: 4,
        table: { code: 'mesa-02', name: 'Mesa 02' },
        score: 1100,
        correctCount: 7,
      },
    ];

    render(
      <RankingClient initialDate="2026-11-25" initialRanking={mockRanking} initialContext={null} />
    );

    expect(screen.getByText('Mesa 07')).toBeDefined();
    expect(screen.getByText('1420')).toBeDefined();
    expect(screen.getByText('Mesa 03')).toBeDefined();
    expect(screen.getByText('1350')).toBeDefined();
    expect(screen.getByText('Mesa 12')).toBeDefined();
    expect(screen.getByText('1270')).toBeDefined();
    expect(screen.getByText('Mesa 02')).toBeDefined();
    expect(screen.getByText('1100')).toBeDefined();
  });

  it('destaca la mesa del usuario si tiene sesión activa y muestra la diferencia de puntos', () => {
    const mockRanking = [
      {
        position: 1,
        table: { code: 'mesa-07', name: 'Mesa 07' },
        score: 1420,
        correctCount: 9,
      },
      {
        position: 2,
        table: { code: 'mesa-01', name: 'Mesa 01' },
        score: 1330,
        correctCount: 8,
      },
    ];

    render(
      <RankingClient
        initialDate="2026-11-25"
        initialRanking={mockRanking}
        initialContext={{
          authenticated: true,
          ranked: true,
          position: 2,
          table: { code: 'mesa-01', name: 'Mesa 01' },
          bestScore: 1330,
          correctCount: 8,
          gapToPrevious: 90,
          previousPosition: 1,
        }}
      />
    );

    expect(screen.getByText('Tu Mesa: Mesa 01')).toBeDefined();
    expect(screen.getByText('Puesto #2')).toBeDefined();
    expect(screen.getByText('Hay 90 puntos de diferencia con el puesto #1.')).toBeDefined();
  });

  it('inicia polling cada 15 segundos y cancela el intervalo al desmontarse', () => {
    vi.useFakeTimers();
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    const { unmount } = render(
      <RankingClient initialDate="2026-11-25" initialRanking={[]} initialContext={null} />
    );

    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
