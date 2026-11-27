import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { GameTimer } from './game-timer';

describe('GameTimer Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('cuenta hacia atrás cuando está activo', () => {
    const baseTime = new Date('2026-11-27T10:00:00Z').getTime();
    vi.setSystemTime(baseTime);

    const expiresAt = new Date(baseTime + 20000).toISOString(); // 20s

    render(
      <GameTimer
        expiresAt={expiresAt}
        serverNow={new Date(baseTime).toISOString()}
        totalDurationSeconds={20}
        isPaused={false}
      />
    );

    expect(screen.getByText('20s')).toBeInTheDocument();

    // Avanzar 5 segundos
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText('15s')).toBeInTheDocument();
  });

  it('congela inmediatamente el contador cuando isPaused=true y no avanza aunque pase el tiempo', () => {
    const baseTime = new Date('2026-11-27T10:00:00Z').getTime();
    vi.setSystemTime(baseTime);

    const expiresAt = new Date(baseTime + 20000).toISOString();
    const onTimeout = vi.fn();

    const { rerender } = render(
      <GameTimer
        expiresAt={expiresAt}
        serverNow={new Date(baseTime).toISOString()}
        totalDurationSeconds={20}
        isPaused={false}
        onTimeout={onTimeout}
      />
    );

    // Pasan 8 segundos: quedan 12s
    act(() => {
      vi.advanceTimersByTime(8000);
    });
    expect(screen.getByText('12s')).toBeInTheDocument();

    // Se pausa el timer (submitting=true al pulsar Confirmar respuesta)
    rerender(
      <GameTimer
        expiresAt={expiresAt}
        serverNow={new Date(baseTime).toISOString()}
        totalDurationSeconds={20}
        isPaused={true}
        onTimeout={onTimeout}
      />
    );

    // El valor visual se preserva congelado en 12s
    expect(screen.getByText('12s')).toBeInTheDocument();

    // Pasan 10 segundos más mientras el servidor procesa o hay latencia
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    // Sigue congelado visualmente en 12s y onTimeout no fue llamado
    expect(screen.getByText('12s')).toBeInTheDocument();
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('al volver isPaused a false después de un error, recalcula contra expiresAt sin regalar tiempo', () => {
    const baseTime = new Date('2026-11-27T10:00:00Z').getTime();
    vi.setSystemTime(baseTime);

    const expiresAt = new Date(baseTime + 20000).toISOString();
    const onTimeout = vi.fn();

    const { rerender } = render(
      <GameTimer
        expiresAt={expiresAt}
        serverNow={new Date(baseTime).toISOString()}
        totalDurationSeconds={20}
        isPaused={false}
        onTimeout={onTimeout}
      />
    );

    // Pasan 5 segundos: quedan 15s
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText('15s')).toBeInTheDocument();

    // Usuario pulsa Confirmar: se congela (isPaused = true)
    rerender(
      <GameTimer
        expiresAt={expiresAt}
        serverNow={new Date(baseTime).toISOString()}
        totalDurationSeconds={20}
        isPaused={true}
        onTimeout={onTimeout}
      />
    );
    expect(screen.getByText('15s')).toBeInTheDocument();

    // La petición de red tarda 4 segundos y luego falla
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    // Mientras fallaba, estuvo congelado en 15s
    expect(screen.getByText('15s')).toBeInTheDocument();

    // El request falla: submitting vuelve a false -> isPaused vuelve a false
    rerender(
      <GameTimer
        expiresAt={expiresAt}
        serverNow={new Date(baseTime).toISOString()}
        totalDurationSeconds={20}
        isPaused={false}
        onTimeout={onTimeout}
      />
    );

    // Debe recalcular contra expiresAt real: han pasado 5s + 4s = 9s en total desde el inicio de 20s
    // 20s - 9s = 11s restantes (NO continúa desde 15s)
    expect(screen.getByText('11s')).toBeInTheDocument();

    // Y el timer sigue corriendo normalmente
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText('9s')).toBeInTheDocument();
  });

  it('respeta el desfase con serverNow incluso tras pausar y reanudar', () => {
    // Cliente va 5 segundos adelantado respecto al servidor
    const serverTime = new Date('2026-11-27T10:00:00Z').getTime();
    const clientTime = serverTime + 5000;
    vi.setSystemTime(clientTime);

    const expiresAt = new Date(serverTime + 20000).toISOString();

    const { rerender } = render(
      <GameTimer
        expiresAt={expiresAt}
        serverNow={new Date(serverTime).toISOString()}
        totalDurationSeconds={20}
        isPaused={false}
      />
    );

    // Inicialmente debe mostrar 20s sincronizado con el servidor
    expect(screen.getByText('20s')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText('17s')).toBeInTheDocument();

    // Pausar
    rerender(
      <GameTimer
        expiresAt={expiresAt}
        serverNow={new Date(serverTime).toISOString()}
        totalDurationSeconds={20}
        isPaused={true}
      />
    );
    expect(screen.getByText('17s')).toBeInTheDocument();

    // 2 segundos pausado
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText('17s')).toBeInTheDocument();

    // Reanudar
    rerender(
      <GameTimer
        expiresAt={expiresAt}
        serverNow={new Date(serverTime).toISOString()}
        totalDurationSeconds={20}
        isPaused={false}
      />
    );

    // Total transcurrido: 3s + 2s = 5s. Quedan 15s.
    expect(screen.getByText('15s')).toBeInTheDocument();
  });

  it('Escenario 10: pregunta ya vencida al montar GameTimer no lanza excepciones y muestra 0s', () => {
    const baseTime = new Date('2026-11-27T10:00:00Z').getTime();
    vi.setSystemTime(baseTime);

    // Vencida hace 3 segundos
    const expiresAt = new Date(baseTime - 3000).toISOString();
    const onTimeout = vi.fn();

    expect(() => {
      render(
        <GameTimer
          expiresAt={expiresAt}
          serverNow={new Date(baseTime).toISOString()}
          totalDurationSeconds={20}
          isPaused={false}
          onTimeout={onTimeout}
        />
      );
    }).not.toThrow();

    expect(screen.getByText('0s')).toBeInTheDocument();
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it('Escenario 9: latencia elevada al cargar una pregunta compensa el tiempo restante con estimatedLatencyMs', () => {
    const serverTime = new Date('2026-11-27T10:00:00Z').getTime();
    // La respuesta tardó 2000 ms en viajar por la red (one-way latency = 1000ms)
    const clientTime = serverTime + 2000;
    vi.setSystemTime(clientTime);

    // El servidor fijó expiresAt = serverTime + 20000 (quedaban 20s en el servidor al enviar)
    const expiresAt = new Date(serverTime + 20000).toISOString();

    render(
      <GameTimer
        expiresAt={expiresAt}
        serverNow={new Date(serverTime).toISOString()}
        estimatedLatencyMs={1000}
        totalDurationSeconds={20}
        isPaused={false}
      />
    );

    // En el cliente, con 1000ms de latencia estimada, deben quedar 19s (20000 - 1000 = 19000ms)
    expect(screen.getByText('19s')).toBeInTheDocument();
  });

  it('Escenario 11: cambio de pregunta resincroniza correctamente el nuevo temporizador', () => {
    const baseTime = new Date('2026-11-27T10:00:00Z').getTime();
    vi.setSystemTime(baseTime);

    const question1ExpiresAt = new Date(baseTime + 20000).toISOString();
    const onTimeoutQ1 = vi.fn();

    const { rerender } = render(
      <GameTimer
        expiresAt={question1ExpiresAt}
        serverNow={new Date(baseTime).toISOString()}
        totalDurationSeconds={20}
        isPaused={false}
        onTimeout={onTimeoutQ1}
      />
    );

    expect(screen.getByText('20s')).toBeInTheDocument();

    // Pasan 12 segundos en la pregunta 1
    act(() => {
      vi.advanceTimersByTime(12000);
    });
    expect(screen.getByText('8s')).toBeInTheDocument();

    // Se avanza a la pregunta 2 en T + 12s
    const question2Time = baseTime + 12000;
    const question2ExpiresAt = new Date(question2Time + 20000).toISOString();
    const onTimeoutQ2 = vi.fn();

    rerender(
      <GameTimer
        expiresAt={question2ExpiresAt}
        serverNow={new Date(question2Time).toISOString()}
        totalDurationSeconds={20}
        isPaused={false}
        onTimeout={onTimeoutQ2}
      />
    );

    // El temporizador de la nueva pregunta debe reiniciarse en 20s
    expect(screen.getByText('20s')).toBeInTheDocument();

    // Avanzamos 4 segundos en la pregunta 2
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.getByText('16s')).toBeInTheDocument();
  });
});
