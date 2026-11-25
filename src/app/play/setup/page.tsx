import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDb } from '@/db/client';
import { TABLE_SESSION_COOKIE_NAME, resolveSessionFromCookie } from '@/modules/sessions';

export default async function PlaySetupPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(TABLE_SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    redirect('/');
  }

  let sessionDetails = null;
  try {
    const db = getDb();
    sessionDetails = await resolveSessionFromCookie(db, sessionCookie);
  } catch (error) {
    console.error('Error al resolver la sesión en /play/setup:', error);
    redirect('/');
  }

  if (!sessionDetails) {
    redirect('/');
  }

  const { table } = sessionDetails;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-sm">
        {/* Identidad */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Conectado
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-white">¡Listo!</h1>

        <p className="mt-3 text-lg font-medium text-amber-400">
          {table.displayName} está conectada.
        </p>

        <p className="mt-2 text-sm text-slate-300">Ahora vamos a preparar tu equipo.</p>

        <div className="mt-8 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-400">
          <p className="font-semibold text-slate-300">Próximo paso (PPA-011):</p>
          <p className="mt-1">
            Configuración de nombre de grupo, avatares y registro de participantes de la mesa.
          </p>
        </div>

        <button
          type="button"
          className="mt-6 w-full rounded-xl bg-amber-500 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          Continuar
        </button>
      </div>
    </main>
  );
}
