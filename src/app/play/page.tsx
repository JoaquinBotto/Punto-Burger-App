import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDb } from '@/db/client';
import { TABLE_SESSION_COOKIE_NAME } from '@/modules/sessions';
import { getPlayPageData } from '@/modules/trivia';
import { BrandCard, BrandHeader, DifficultyBlocks } from '@/components/ui';

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
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 text-center">
      <BrandCard>
        {/* Encabezado e Identidad Oficial */}
        <BrandHeader tableBadge={playData.table.displayName} className="mb-6" />

        <div className="text-center">
          {/* Icono de Partida Preparada */}
          <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full border border-pb-yellow-border bg-pb-yellow-light text-pb-yellow-hover shadow-xs">
            <svg
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-pb-charcoal sm:text-4xl">
            ¡Todo listo!
          </h1>
          <p className="mt-1 text-xs font-bold uppercase tracking-wider text-pb-red">
            {playData.group.name}
          </p>
          <p className="mt-2 text-sm text-pb-charcoal-muted">
            Preparamos 10 preguntas para tu equipo.
          </p>

          {/* Ficha Resumen de Partida Preparada */}
          <div className="mt-6 space-y-3 rounded-2xl border border-pb-cream-border bg-pb-cream/40 p-4 text-left text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-pb-charcoal-muted">Categoría:</span>
              <span className="inline-flex items-center gap-1.5 font-bold text-pb-red">
                <span className="h-2 w-2 rounded-full bg-pb-yellow" />
                {playData.category.name}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-pb-charcoal-muted">Equipo:</span>
              <span className="font-bold text-pb-charcoal">{playData.group.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-pb-charcoal-muted">Jugadores registrados:</span>
              <span className="font-bold text-pb-charcoal">{playData.group.participantCount}</span>
            </div>

            {/* Estructura de Dificultad (3/4/3) */}
            <div className="border-t border-pb-cream-border/80 pt-3">
              <span className="block font-bold text-pb-charcoal mb-2">
                Estructura de la partida (10 preguntas):
              </span>
              <DifficultyBlocks
                initial={playData.structure.initial}
                medium={playData.structure.medium}
                advanced={playData.structure.advanced}
              />
              <div className="mt-2 flex justify-between text-[11px] text-pb-charcoal-light">
                <span>{playData.structure.initial} iniciales</span>
                <span>{playData.structure.medium} intermedias</span>
                <span>{playData.structure.advanced} avanzadas</span>
              </div>
            </div>
          </div>

          {/* Reglas Operativas Clave */}
          <div className="mt-4 rounded-2xl border border-pb-yellow-border/60 bg-pb-yellow-light/60 p-3.5 text-left">
            <div className="flex items-start gap-2.5 text-xs text-pb-charcoal">
              <span className="text-base leading-none">⏱️</span>
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
              className="w-full cursor-not-allowed rounded-2xl bg-stone-200 py-4 text-sm font-bold text-stone-500 opacity-70"
            >
              Comenzar
            </button>
            <p className="mt-2.5 text-[11px] font-medium text-pb-charcoal-light">
              La presentación interactiva y el temporizador se activarán en el siguiente paso
              (PPA-013).
            </p>
          </div>
        </div>
      </BrandCard>
    </main>
  );
}
