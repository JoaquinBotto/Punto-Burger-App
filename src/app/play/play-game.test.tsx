import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PlayGame } from './play-game';
import type { PlayPageData, GameStateResult } from '@/modules/trivia/types';

const mockPush = vi.fn();
const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

describe('PlayGame Component - Timer Pausing on Submit UX', () => {
  const baseTime = new Date('2026-11-27T10:00:00Z').getTime();

  const mockPlayData: PlayPageData = {
    mode: 'casual',
    table: { displayName: 'Mesa 01', code: 'mesa-01' },
    group: { name: 'Los Campeones', participantCount: 3 },
    category: { slug: 'cultura-general', name: 'Cultura General' },
    structure: { initial: 3, medium: 4, advanced: 3, total: 10 },
    gameStatus: 'active',
    isPrepared: true,
  };

  const createInitialState = (expiresInSeconds = 20): GameStateResult => ({
    ok: true,
    game: {
      id: 'game-1',
      status: 'active',
      currentQuestionIndex: 0,
      currentPosition: 1,
      totalQuestions: 10,
      totalScore: 0,
      correctCount: 0,
      incorrectCount: 0,
      unansweredCount: 0,
      category: { slug: 'cultura-general', name: 'Cultura General' },
      group: { name: 'Los Campeones' },
      table: { code: 'mesa-01', displayName: 'Mesa 01' },
    },
    question: {
      position: 1,
      difficulty: 'initial',
      isGroup: false,
      prompt: '¿Cuál es la capital de Francia?',
      optionA: 'Madrid',
      optionB: 'París',
      optionC: 'Roma',
      optionD: 'Berlín',
      targetAlias: 'Joaco',
      presentedAt: new Date(baseTime).toISOString(),
      expiresAt: new Date(baseTime + expiresInSeconds * 1000).toISOString(),
      serverNow: new Date(baseTime).toISOString(),
    },
    feedback: null,
    isResolved: false,
  });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(baseTime);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('flujo exitoso: timer activo -> clic confirmar -> submitting=true (timer congelado) -> respuesta recibida -> isResolved=true (timer permanece detenido)', async () => {
    let resolveAnswerFetch!: (val: Response) => void;
    const answerPromise = new Promise<Response>((resolve) => {
      resolveAnswerFetch = resolve;
    });

    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation((url) => {
      const urlStr = url.toString();
      if (urlStr.includes('/api/v1/games/answer')) {
        return answerPromise;
      }
      return Promise.resolve(new Response(JSON.stringify({ ok: true })));
    });

    render(<PlayGame playData={mockPlayData} initialState={createInitialState(20)} />);

    // 1. Timer activo: inicialmente muestra 20s
    expect(screen.getByText('20s')).toBeInTheDocument();

    // Avanzamos 6 segundos: timer desciende a 14s
    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(screen.getByText('14s')).toBeInTheDocument();

    // Seleccionamos opción B ('París')
    const optionB = screen.getByText('París');
    fireEvent.click(optionB);

    const confirmButton = screen.getByRole('button', { name: /confirmar respuesta/i });
    expect(confirmButton).not.toBeDisabled();

    // 2. Clic en Confirmar respuesta -> submitting=true
    act(() => {
      fireEvent.click(confirmButton);
    });

    // Botón deshabilitado mientras submitting === true
    expect(confirmButton).toBeDisabled();

    // 3. Timer congelado inmediatamente en 14s
    expect(screen.getByText('14s')).toBeInTheDocument();

    // Avanzamos 5 segundos mientras el request está en vuelo
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // El timer permanece congelado en 14s
    expect(screen.getByText('14s')).toBeInTheDocument();

    // 4. Servidor responde exitosamente
    await act(async () => {
      resolveAnswerFetch(
        new Response(
          JSON.stringify({
            ok: true,
            answer: {
              result: 'correct',
              correctOption: 'B',
              selectedOption: 'B',
              pointsAwarded: 100,
              totalScore: 100,
              explanation: 'París es la capital francesa.',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );
    });

    // 5. isResolved = true -> Feedback mostrado
    expect(screen.getByText(/¡respuesta correcta!/i)).toBeInTheDocument();

    // 6. El timer permanece detenido en 14s incluso tras avanzar el tiempo
    expect(screen.getByText('14s')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText('14s')).toBeInTheDocument();

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/v1/games/answer',
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('flujo de error: submitting=true congela -> request falla -> submitting=false -> timer se resincroniza con expiresAt real', async () => {
    let rejectAnswerFetch!: (reason: unknown) => void;
    const answerPromise = new Promise<Response>((_, reject) => {
      rejectAnswerFetch = reject;
    });

    vi.spyOn(global, 'fetch').mockImplementation((url) => {
      const urlStr = url.toString();
      if (urlStr.includes('/api/v1/games/answer')) {
        return answerPromise;
      }
      return Promise.resolve(new Response(JSON.stringify({ ok: true })));
    });

    render(<PlayGame playData={mockPlayData} initialState={createInitialState(20)} />);

    // Timer activo: transcurren 4 segundos -> quedan 16s
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.getByText('16s')).toBeInTheDocument();

    // Seleccionamos opción
    fireEvent.click(screen.getByText('París'));
    const confirmButton = screen.getByRole('button', { name: /confirmar respuesta/i });

    // Clic en Confirmar respuesta -> submitting=true congela el timer en 16s
    act(() => {
      fireEvent.click(confirmButton);
    });
    expect(confirmButton).toBeDisabled();
    expect(screen.getByText('16s')).toBeInTheDocument();

    // Pasan 3 segundos de latencia de red mientras intenta enviar
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText('16s')).toBeInTheDocument();

    // El request falla por desconexión / error de red
    await act(async () => {
      rejectAnswerFetch(new Error('Network error'));
    });

    // Error mostrado al usuario
    expect(screen.getByText(/ocurrió un error al enviar tu respuesta/i)).toBeInTheDocument();

    // submitting volvió a false -> el timer se reactiva y debe resincronizarse con expiresAt:
    // Han pasado 4s iniciales + 3s de intento = 7s totales de 20s -> quedan 13s (no 16s)
    expect(screen.getByText('13s')).toBeInTheDocument();

    // El timer continúa decrementando normalmente desde el tiempo real
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText('11s')).toBeInTheDocument();
  });
});
