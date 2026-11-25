'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PrimaryButton } from '@/components/ui';

interface TableClaimFormProps {
  tableCode: string;
}

export function TableClaimForm({ tableCode }: TableClaimFormProps) {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Normalizar a mayúsculas, sin espacios y máximo 5 caracteres
    const val = e.target.value.replace(/\s+/g, '').toUpperCase().slice(0, 5);
    setAccessCode(val);
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedCode = accessCode.trim().toUpperCase();
    if (normalizedCode.length !== 5) {
      setErrorMessage('El código debe tener exactamente 5 caracteres.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/v1/tables/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tableCode,
          accessCode: normalizedCode,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setErrorMessage(
          data?.error?.message ||
            'No se pudo conectar la mesa. Verificá el código e intentá nuevamente.'
        );
        setLoading(false);
        return;
      }

      // Redirección exitosa a la siguiente etapa (/play/setup)
      router.push(data.next || '/play/setup');
    } catch {
      setErrorMessage('Error de conexión con el servidor. Verificá tu conexión a internet.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col items-center">
      <div className="w-full">
        <label
          htmlFor="accessCode"
          className="block text-xs font-bold uppercase tracking-wider text-pb-charcoal-muted"
        >
          Código de pantalla
        </label>
        <div className="mt-2.5">
          <input
            id="accessCode"
            name="accessCode"
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck="false"
            maxLength={5}
            value={accessCode}
            onChange={handleInputChange}
            placeholder="EJ: 7HK9P"
            disabled={loading}
            aria-label="Código de acceso temporal"
            className="w-full rounded-2xl border-2 border-pb-cream-border bg-pb-cream/40 px-4 py-4 text-center font-mono text-3xl font-black tracking-[0.25em] text-pb-red placeholder:text-stone-300 focus:border-pb-red focus:bg-white focus:outline-none focus:ring-4 focus:ring-pb-red/20 disabled:opacity-50 transition-all"
          />
        </div>
        <p className="mt-2 text-xs text-pb-charcoal-light">
          Ingresá los 5 caracteres que aparecen en la pantalla del bar.
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mt-4 w-full rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-pb-red text-center"
        >
          {errorMessage}
        </div>
      )}

      <div className="mt-6 w-full">
        <PrimaryButton
          type="submit"
          loading={loading}
          disabled={loading || accessCode.trim().length !== 5}
        >
          Comenzar
        </PrimaryButton>
      </div>
    </form>
  );
}
