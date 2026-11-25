'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
        <label htmlFor="accessCode" className="block text-xs font-medium text-slate-300">
          Código de pantalla
        </label>
        <div className="mt-2">
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
            className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-center font-mono text-2xl font-bold tracking-widest text-amber-400 placeholder:text-slate-600 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50"
          />
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Ingresá los 5 caracteres que aparecen en la pantalla del bar.
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mt-4 w-full rounded-lg border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300"
        >
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || accessCode.trim().length !== 5}
        className="mt-6 w-full rounded-xl bg-amber-500 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Conectando...' : 'Comenzar'}
      </button>
    </form>
  );
}
