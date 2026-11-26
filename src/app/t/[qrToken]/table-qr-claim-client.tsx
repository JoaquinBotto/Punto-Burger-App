'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PrimaryButton } from '@/components/ui';

interface TableQrClaimClientProps {
  qrToken: string;
  initialCooldownSeconds?: number;
  competition?: {
    name?: string | null;
    status: 'scheduled' | 'active' | 'finalized' | 'cancelled';
    startsAt: string;
    endsAt: string;
  } | null;
}

export function TableQrClaimClient({
  qrToken,
  initialCooldownSeconds = 0,
  competition,
}: TableQrClaimClientProps) {
  const router = useRouter();
  const [cooldown, setCooldown] = useState(initialCooldownSeconds);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const handleClaim = async () => {
    if (cooldown > 0 || loading) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/v1/tables/claim-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrToken }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setErrorMessage(
          data?.error?.message ||
            'No se pudo conectar con la mesa. Por favor, reintentá en unos instantes.'
        );
        setLoading(false);
        return;
      }

      router.push(data.next || '/play/setup');
    } catch {
      setErrorMessage('Error de conexión con el servidor. Verificá tu conexión a internet.');
      setLoading(false);
    }
  };

  const isCompetitionActive =
    competition && (competition.status === 'scheduled' || competition.status === 'active');

  return (
    <div className="mt-6 flex flex-col items-center">
      {isCompetitionActive && (
        <div className="mb-4 w-full rounded-2xl border-2 border-pb-yellow bg-pb-yellow/10 p-4 text-left shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-pb-yellow-dark">
            <span>🏆</span>
            <span>Competencia de hoy</span>
          </div>
          <div className="mt-1 text-base font-black text-pb-charcoal">
            {competition.name || 'Torneo Oficial de Mesas'}
          </div>
          <p className="mt-1 text-xs text-pb-charcoal-muted">
            {competition.status === 'scheduled'
              ? `La competencia comienza a las ${new Date(competition.startsAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}. Registrá a tu equipo con tiempo.`
              : '¡La competencia oficial está en curso! 3 ciclos de dificultad progresiva.'}
          </p>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 w-full rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-800">
          {errorMessage}
        </div>
      )}

      {cooldown > 0 ? (
        <div className="w-full">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Mesa en preparación temporal
            </div>
            <div className="mt-1 text-2xl font-black text-amber-950 font-mono">
              {Math.floor(cooldown / 60)}:{(cooldown % 60).toString().padStart(2, '0')}
            </div>
            <p className="mt-1 text-xs text-amber-700">
              La mesa estará disponible para un nuevo grupo en instantes.
            </p>
          </div>
          <div className="mt-4 w-full">
            <PrimaryButton disabled={true}>Espere ({cooldown}s)</PrimaryButton>
          </div>
        </div>
      ) : (
        <PrimaryButton onClick={handleClaim} disabled={loading} className="w-full text-base py-4">
          {loading
            ? 'Conectando...'
            : isCompetitionActive
              ? 'Entrar a la competencia'
              : 'Jugar ahora'}
        </PrimaryButton>
      )}
    </div>
  );
}
