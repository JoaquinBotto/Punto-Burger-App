'use client';

import React, { useEffect, useRef, useState } from 'react';

interface GameTimerProps {
  expiresAt: string | null;
  serverNow?: string | null;
  estimatedLatencyMs?: number;
  totalDurationSeconds?: number;
  onTimeout?: () => void;
  isPaused?: boolean;
}

export function GameTimer({
  expiresAt,
  serverNow,
  estimatedLatencyMs = 0,
  totalDurationSeconds = 20,
  onTimeout,
  isPaused = false,
}: GameTimerProps) {
  // Anclaje de sincronización que vincula el reloj monotónico local (performance.now) con el tiempo del servidor
  const syncAnchorRef = useRef<{
    serverMs: number;
    perfMs: number;
  } | null>(null);

  // Offset de respaldo ante ausencia o reinicio del reloj monotónico
  const clockOffsetRef = useRef<number>(0);

  // Calibrar la hora sincronizada cada vez que serverNow o estimatedLatencyMs cambian
  useEffect(() => {
    if (serverNow) {
      const serverMs = new Date(serverNow).getTime();
      const latency = Math.max(0, estimatedLatencyMs || 0);
      const estimatedServerMsNow = serverMs + latency;

      if (
        typeof window !== 'undefined' &&
        window.performance &&
        typeof window.performance.now === 'function'
      ) {
        syncAnchorRef.current = {
          serverMs: estimatedServerMsNow,
          perfMs: window.performance.now(),
        };
      }
      clockOffsetRef.current = estimatedServerMsNow - Date.now();
    } else {
      syncAnchorRef.current = null;
      clockOffsetRef.current = 0;
    }
  }, [serverNow, estimatedLatencyMs]);

  // Inicialización de estado calculada de props sin leer refs durante render
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    if (!expiresAt) return totalDurationSeconds;
    const targetTime = new Date(expiresAt).getTime();
    const initialServerTime = serverNow
      ? new Date(serverNow).getTime() + (estimatedLatencyMs || 0)
      : Date.now();
    return Math.max(0, Math.ceil((targetTime - initialServerTime) / 1000));
  });

  // Mantener referencia estable al callback onTimeout
  const onTimeoutRef = useRef(onTimeout);
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  // Evitar disparos repetidos de timeout para el mismo deadline
  const timeoutFiredForRef = useRef<string | null>(null);

  useEffect(() => {
    if (!expiresAt || isPaused) {
      return;
    }

    const targetTime = new Date(expiresAt).getTime();

    // Declarar timerInterval antes de que updateTimer pueda ser ejecutada para evitar ReferenceError
    let timerInterval: ReturnType<typeof setInterval> | null = null;

    const getSynchronizedServerTime = () => {
      if (
        syncAnchorRef.current &&
        typeof window !== 'undefined' &&
        window.performance &&
        typeof window.performance.now === 'function'
      ) {
        const elapsed = window.performance.now() - syncAnchorRef.current.perfMs;
        return syncAnchorRef.current.serverMs + elapsed;
      }
      return Date.now() + clockOffsetRef.current;
    };

    const updateTimer = () => {
      const currentServerTime = getSynchronizedServerTime();
      const msRemaining = Math.max(0, targetTime - currentServerTime);
      const remaining = Math.ceil(msRemaining / 1000);

      setSecondsRemaining(remaining);

      if (msRemaining <= 0) {
        if (timerInterval !== null) {
          clearInterval(timerInterval);
          timerInterval = null;
        }

        // Ejecutar callback de timeout exactamente una sola vez por deadline
        if (timeoutFiredForRef.current !== expiresAt) {
          timeoutFiredForRef.current = expiresAt;
          if (onTimeoutRef.current) {
            onTimeoutRef.current();
          }
        }
      }
    };

    // Ejecutar inmediatamente para reflejar el estado actual
    updateTimer();

    // Solo iniciar el intervalo si aún queda tiempo restante
    const initialServerTime = getSynchronizedServerTime();
    if (targetTime > initialServerTime) {
      timerInterval = setInterval(updateTimer, 200);
    }

    return () => {
      if (timerInterval !== null) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    };
  }, [expiresAt, isPaused, totalDurationSeconds, serverNow, estimatedLatencyMs]);

  const fraction = Math.max(0, Math.min(1, secondsRemaining / totalDurationSeconds));
  const isUrgent = secondsRemaining <= 5;

  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex items-center justify-between w-full mb-1 text-xs font-bold text-pb-charcoal">
        <span className="flex items-center gap-1.5">
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${
              isUrgent ? 'bg-pb-red animate-ping' : 'bg-pb-yellow'
            }`}
          />
          Tiempo para responder:
        </span>
        <span
          className={`font-black text-sm tracking-tight ${
            isUrgent ? 'text-pb-red animate-pulse' : 'text-pb-charcoal'
          }`}
        >
          {secondsRemaining}s
        </span>
      </div>

      {/* Barra de progreso visual con transición fluida */}
      <div className="h-2 w-full rounded-full bg-pb-cream-border overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-linear ${
            isUrgent ? 'bg-pb-red' : 'bg-pb-yellow'
          }`}
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
    </div>
  );
}
