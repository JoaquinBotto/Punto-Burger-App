import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDb } from '@/db/client';
import { TABLE_SESSION_COOKIE_NAME } from '@/modules/sessions';
import { getPlayPageData } from '@/modules/trivia';

export const dynamic = 'force-dynamic';

export default async function PlayPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(TABLE_SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    redirect('/');
    return null;
  }

  const db = getDb();
  let playData;

  try {
    playData = await getPlayPageData(db, sessionCookie);
  } catch {
    redirect('/play/setup');
    return null;
  }

  if (!playData.isPrepared) {
    redirect('/play/setup');
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
        {/* Encabezado e Identidad */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Punto Burger
          </div>
          <span className="text-xs font-semibold text-slate-400">{playData.table.displayName}</span>
        </div>

        <div className="mt-6 text-center">
          {/* Icono de Partida Preparada */}
          <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400">
            <svg
              className="h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white">¡Todo listo!</h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
            {playData.group.name}
          </p>
          <p className="mt-2 text-sm text-slate-300">Preparamos 10 preguntas para tu equipo.</p>

          {/* Ficha Resumen de Partida Preparada */}
          <div className="mt-6 space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-left text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Categoría:</span>
              <span className="font-semibold text-amber-400">{playData.category.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Equipo:</span>
              <span className="font-medium text-slate-200">{playData.group.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Jugadores registrados:</span>
              <span className="font-medium text-slate-200">{playData.group.participantCount}</span>
            </div>
            <div className="border-t border-slate-800/80 pt-2 text-[11px] text-slate-400">
              <span className="block font-medium text-slate-300">Estructura de la partida:</span>
              <div className="mt-1 flex justify-between text-slate-400">
                <span>{playData.structure.initial} iniciales (fáciles)</span>
                <span>{playData.structure.medium} intermedias</span>
                <span>{playData.structure.advanced} avanzadas</span>
              </div>
            </div>
          </div>

          {/* Reglas Operativas Clave */}
          <div className="mt-4 rounded-xl border border-slate-800/80 bg-slate-950/40 p-3 text-left">
            <div className="flex items-start gap-2 text-xs text-slate-300">
              <span className="text-amber-400">⏱️</span>
              <p className="text-[11px] leading-relaxed">
                Tenés <strong>20 segundos</strong> para responder cada pregunta. Las respuestas
                correctas suman puntos según la dificultad y el tiempo restante.
              </p>
            </div>
          </div>

          {/* Botón de Inicio (Preparado para PPA-013) */}
          <div className="mt-6">
            <button
              type="button"
              disabled
              className="w-full cursor-not-allowed rounded-xl bg-amber-500/40 py-3.5 text-sm font-bold text-slate-950 opacity-60"
            >
              Comenzar
            </button>
            <p className="mt-2 text-[11px] text-slate-500">
              La presentación interactiva y el temporizador se activarán en el siguiente paso
              (PPA-013).
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
