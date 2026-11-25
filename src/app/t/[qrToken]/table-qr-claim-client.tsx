'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PrimaryButton } from '@/components/ui';

interface TableQrClaimClientProps {
  qrToken: string;
  initialCooldownSeconds?: number;
}

export function TableQrClaimClient({
  qrToken,
  initialCooldownSeconds = 0,
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

  return (
    <div className="mt-6 flex flex-col items-center w-full">
      {cooldown > 0 ? (
        <div className="w-full">
          <div className="rounded-2xl border border-pb-yellow-border bg-pb-yellow-light p-4 text-center">
            <p className="text-sm font-bold text-pb-charcoal">Mesa en preparación temporal</p>
            <p className="mt-1 text-xs text-pb-charcoal-muted">
              Se habilitará automáticamente en{' '}
              <span className="font-bold text-pb-red">{cooldown}s</span>
            </p>
          </div>
          <div className="mt-4 w-full">
            <PrimaryButton disabled={true}>Espere ({cooldown}s)</PrimaryButton>
          </div>
        </div>
      ) : (
        <div className="w-full">
          <PrimaryButton onClick={handleClaim} loading={loading} disabled={loading}>
            Jugar ahora
          </PrimaryButton>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="mt-4 w-full rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-pb-red text-center"
        >
          {errorMessage}
        </div>
      )}
    </div>
  );
}
