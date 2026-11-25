'use client';

import React, { useEffect, useState } from 'react';

interface GameTimerProps {
  expiresAt: string | null;
  serverNow?: string | null;
  totalDurationSeconds?: number;
  onTimeout?: () => void;
  isPaused?: boolean;
}

export function GameTimer({
  expiresAt,
  serverNow,
  totalDurationSeconds = 20,
  onTimeout,
  isPaused = false,
}: GameTimerProps) {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(totalDurationSeconds);

  useEffect(() => {
    if (!expiresAt || isPaused) {
      return;
    }

    const targetTime = new Date(expiresAt).getTime();
    // Calcular el desfase inicial del reloj local respecto al servidor si serverNow está disponible
    const clientNow = Date.now();
    const serverTime = serverNow ? new Date(serverNow).getTime() : clientNow;
    const clockOffset = serverTime - clientNow;

    const updateTimer = () => {
      const currentSynchronizedTime = Date.now() + clockOffset;
      const msRemaining = Math.max(0, targetTime - currentSynchronizedTime);
      const remaining = Math.ceil(msRemaining / 1000);

      setSecondsRemaining(remaining);

      if (msRemaining <= 0) {
        clearInterval(timerInterval);
        if (onTimeout) {
          onTimeout();
        }
      }
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 250);

    return () => clearInterval(timerInterval);
  }, [expiresAt, serverNow, isPaused, onTimeout]);

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
