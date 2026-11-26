'use client';

import React, { useEffect, useState, useCallback } from 'react';

interface PresenceStatus {
  mode: 'off' | 'observe' | 'enforce';
  verified: boolean;
  required: boolean;
}

export function PresenceRefresher() {
  const [status, setStatus] = useState<PresenceStatus | null>(null);
  const [retrying, setRetrying] = useState(false);

  const refreshPresence = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/presence/refresh', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatus((prev) => (prev ? { ...prev, verified: true } : null));
      } else if (res.status === 403) {
        setStatus((prev) => (prev ? { ...prev, verified: false } : null));
      }
    } catch {
      // Ignorar errores de red transitorios en background
    }
  }, []);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/presence/status');
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatus(data.status);
      }
    } catch {
      // Ignorar
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void checkStatus();

    // Refresco periódico silencioso cada 30 segundos
    const interval = setInterval(refreshPresence, 30_000);
    return () => {
      clearInterval(interval);
    };
  }, [checkStatus, refreshPresence]);

  const handleManualRetry = async () => {
    setRetrying(true);
    await refreshPresence();
    await checkStatus();
    setRetrying(false);
  };

  // Solo mostrar alerta interactiva si mode=enforce y no está verificado
  if (!status || status.mode !== 'enforce' || status.verified) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-3xl border-2 border-pb-red bg-white p-6 text-center shadow-2xl">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-3xl">
          📶
        </div>
        <h2 className="text-xl font-black text-pb-charcoal">Verificación de Presencia</h2>
        <p className="mt-2 text-sm text-neutral-600">
          Conectate al Wi-Fi de Punto Burger para continuar jugando en la competencia.
        </p>
        <button
          onClick={handleManualRetry}
          disabled={retrying}
          className="mt-5 w-full rounded-2xl bg-pb-red py-3 text-sm font-bold text-white shadow-md transition hover:bg-pb-red-hover disabled:opacity-50"
        >
          {retrying ? 'Verificando...' : 'Reintentar conexión'}
        </button>
      </div>
    </div>
  );
}
