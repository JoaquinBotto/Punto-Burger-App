import Image from 'next/image';
import Link from 'next/link';
import { getDb } from '@/db/client';
import { getCurrentCompetition } from '@/modules/competitions';
import { venues } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const db = getDb();
  let competition = null;

  try {
    const [defaultVenue] = await db
      .select({ id: venues.id })
      .from(venues)
      .where(eq(venues.slug, 'esperanza-central'))
      .limit(1);

    const venueId = defaultVenue?.id ?? '00000000-0000-0000-0000-000000000001';
    competition = await getCurrentCompetition(db, venueId, { allowTest: false });
  } catch {
    // Fallback silencioso si DB no está disponible
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 text-center">
      <div className="w-full max-w-md rounded-3xl border border-pb-cream-border bg-white p-6 sm:p-8 shadow-xl shadow-stone-200/60">
        {/* Logo Oficial de Punto Burger */}
        <div className="mx-auto mb-6 flex justify-center">
          <Image
            src="/brand/punto-burger-logo.png"
            alt="Punto Burger"
            width={210}
            height={70}
            priority
            className="h-16 w-auto object-contain"
          />
        </div>

        {/* Badge de Estado */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-pb-yellow-border bg-pb-yellow-light px-3.5 py-1 text-xs font-bold text-pb-charcoal">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Local Esperanza, Santa Fe
        </div>

        {/* Banner de Competencia Diaria (si está activa o programada) */}
        {competition && (competition.status === 'scheduled' || competition.status === 'active') && (
          <div className="mb-5 rounded-2xl border border-pb-yellow-border bg-gradient-to-r from-amber-50 via-white to-amber-50/70 p-3.5 text-center shadow-2xs">
            <div className="flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wider text-pb-yellow-hover">
              <span>🏆</span>
              <span>
                {competition.status === 'active'
                  ? 'Competencia en vivo'
                  : 'Competencia programada para hoy'}
              </span>
            </div>
            <p className="mt-1 text-xs font-black text-pb-charcoal">{competition.name}</p>
            {competition.timingMode === 'open' ? (
              <p className="text-[11px] font-semibold text-pb-charcoal-muted">
                ¡Participá con tu mesa y sumá puntos en los 3 ciclos!
              </p>
            ) : competition.startsAt && competition.endsAt ? (
              <p className="text-[11px] font-semibold text-pb-charcoal-muted">
                Horario:{' '}
                {new Date(competition.startsAt).toLocaleTimeString('es-AR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                a{' '}
                {new Date(competition.endsAt).toLocaleTimeString('es-AR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                hs
              </p>
            ) : null}
          </div>
        )}

        <h1 className="text-2xl font-black tracking-tight text-pb-charcoal sm:text-3xl">
          Punto Burger
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-pb-charcoal-muted">
          ¡Bienvenidos a la experiencia digital interactiva de Punto Burger! Escaneá el código QR
          ubicado en tu mesa para comenzar a jugar la trivia en equipo.
        </p>

        {/* Card informativa con detalles de la experiencia gastronómica */}
        <div className="mt-6 rounded-2xl border border-pb-cream-border bg-pb-cream/60 p-4 text-left text-xs text-pb-charcoal-muted">
          <p className="font-bold text-pb-charcoal">En tu mesa:</p>
          <ul className="mt-2.5 space-y-1.5 list-disc list-inside">
            <li>Acceso instantáneo mediante código QR</li>
            <li>Trivias y desafíos en tiempo real con amigos y familia</li>
            <li>Sumá puntos por cada pregunta respondida en equipo</li>
            <li>Beneficios y premios gastronómicos exclusivos</li>
          </ul>
        </div>

        {/* Acceso discreto al Ranking Diario */}
        <div className="mt-5">
          <Link
            href="/ranking"
            className="inline-flex items-center gap-1.5 rounded-full border border-pb-yellow-border bg-pb-yellow-light/60 px-4 py-1.5 text-xs font-bold text-pb-charcoal hover:bg-pb-yellow-light transition-colors"
          >
            <span>🏆</span>
            <span>Ranking de hoy</span>
            <span className="text-pb-yellow-hover">→</span>
          </Link>
        </div>

        <p className="mt-5 text-[11px] font-medium text-pb-charcoal-light">
          Escanear el código QR colocado en tu mesa para comenzar.
        </p>
      </div>
    </main>
  );
}
