import { cookies } from 'next/headers';
import Link from 'next/link';
import { getDb } from '@/db/client';
import { resolveTableStateByQrToken, TableNotFoundError } from '@/modules/tables';
import { TABLE_SESSION_COOKIE_NAME, resolveSessionFromCookie } from '@/modules/sessions';
import { getGameSessionByTableSessionId } from '@/db/repositories/game-sessions.repository';
import { TableQrClaimClient } from './table-qr-claim-client';
import { BrandCard, BrandHeader } from '@/components/ui';

interface TableQrPageProps {
  params: Promise<{
    qrToken: string;
  }>;
}

export default async function TableQrPage({ params }: TableQrPageProps) {
  const { qrToken } = await params;
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(TABLE_SESSION_COOKIE_NAME)?.value;

  let dbAvailable = true;
  let resolvedTable = null;
  let activeSessionForDevice = null;
  let resumeNextUrl = '/play/setup';
  let errorState: 'not_found' | 'disabled' | 'in_use' | 'cooldown' | 'other_table' | null = null;
  let cooldownRemainingSeconds = 0;
  let otherTableDisplayName = '';

  try {
    const db = getDb();

    // 1. Resolver el estado de la mesa a partir del qrToken
    resolvedTable = await resolveTableStateByQrToken(db, qrToken);

    // 2. Verificar si el dispositivo ya cuenta con una sesión válida
    if (sessionCookie) {
      activeSessionForDevice = await resolveSessionFromCookie(db, sessionCookie);
      if (activeSessionForDevice) {
        if (activeSessionForDevice.table.id !== resolvedTable.table.id) {
          errorState = 'other_table';
          otherTableDisplayName = activeSessionForDevice.table.displayName;
        } else {
          // Determinar pantalla de reanudación
          const gameSession = await getGameSessionByTableSessionId(
            db,
            activeSessionForDevice.session.id
          );
          if (gameSession?.status === 'active') {
            resumeNextUrl = '/play';
          } else if (gameSession?.status === 'completed') {
            resumeNextUrl = '/play/results';
          }
        }
      }
    }

    // 3. Evaluar el estado de la mesa actual si no hay conflicto de otra mesa
    if (!errorState) {
      if (resolvedTable.effectiveStatus === 'disabled') {
        errorState = 'disabled';
      } else if (resolvedTable.effectiveStatus === 'cooldown') {
        errorState = 'cooldown';
        cooldownRemainingSeconds = resolvedTable.cooldownRemainingSeconds ?? 120;
      } else if (resolvedTable.effectiveStatus === 'in_use') {
        // Si la mesa está in_use y el dispositivo no es el dueño, se bloquea
        if (
          !activeSessionForDevice ||
          activeSessionForDevice.session.tableId !== resolvedTable.table.id
        ) {
          errorState = 'in_use';
        }
      }
    }
  } catch (error) {
    if (error instanceof TableNotFoundError) {
      errorState = 'not_found';
    } else {
      console.error('Error al resolver la mesa por QR:', error);
      dbAvailable = false;
    }
  }

  const tableDisplayName = resolvedTable?.table.displayName ?? 'Punto Burger';

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 text-center">
      <BrandCard>
        {/* Cabecera de Marca Oficial */}
        <BrandHeader tableBadge={resolvedTable?.table.displayName} className="mb-6" />

        {/* 1. Caso: Token QR no encontrado o inválido */}
        {errorState === 'not_found' && (
          <div className="mt-2">
            <h1 className="text-2xl font-black text-pb-charcoal">Código QR no válido</h1>
            <p className="mt-3 text-sm text-pb-charcoal-muted">
              El código escaneado no corresponde a ninguna mesa registrada en el local.
            </p>
            <p className="mt-2 text-xs text-pb-charcoal-light">
              Por favor, asegurate de escanear el código QR colocado físicamente en tu mesa.
            </p>
            <div className="mt-6">
              <Link
                href="/ranking"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-pb-cream px-5 py-2.5 text-xs font-bold text-pb-charcoal hover:bg-pb-cream-border transition-all"
              >
                Ver ranking del día
              </Link>
            </div>
          </div>
        )}

        {/* 2. Caso: Mesa deshabilitada */}
        {errorState === 'disabled' && resolvedTable && (
          <div className="mt-2">
            <h1 className="text-2xl font-black text-pb-charcoal">{tableDisplayName}</h1>
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
              Esta mesa no se encuentra disponible en este momento.
            </div>
            <p className="mt-4 text-xs text-pb-charcoal-muted">
              Consultá con el personal del local para que te asignen una mesa habilitada.
            </p>
            <div className="mt-6">
              <Link
                href="/ranking"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-pb-cream px-5 py-2.5 text-xs font-bold text-pb-charcoal hover:bg-pb-cream-border transition-all"
              >
                Ver ranking del día
              </Link>
            </div>
          </div>
        )}

        {/* 3. Caso: Mesa en Cooldown */}
        {errorState === 'cooldown' && resolvedTable && (
          <div className="mt-2">
            <h1 className="text-2xl font-black text-pb-charcoal">{tableDisplayName}</h1>
            <div className="mt-4">
              <TableQrClaimClient
                qrToken={qrToken}
                initialCooldownSeconds={cooldownRemainingSeconds}
              />
            </div>
            <p className="mt-3 text-xs text-pb-charcoal-muted">
              La partida anterior finalizó hace unos instantes.
            </p>
            <div className="mt-6">
              <Link
                href="/ranking"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-pb-cream px-5 py-2.5 text-xs font-bold text-pb-charcoal hover:bg-pb-cream-border transition-all"
              >
                Ver ranking del día
              </Link>
            </div>
          </div>
        )}

        {/* 4. Caso: Mesa ocupada por otro dispositivo */}
        {errorState === 'in_use' && resolvedTable && (
          <div className="mt-2">
            <h1 className="text-2xl font-black text-pb-charcoal">{tableDisplayName}</h1>
            <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm font-medium text-pb-charcoal">
              Mesa actualmente en uso.
            </div>
            <p className="mt-3 text-xs text-pb-charcoal-muted">
              Esta mesa ya tiene una partida en curso iniciada por otro dispositivo.
            </p>
            <div className="mt-6">
              <Link
                href="/ranking"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-pb-cream px-5 py-2.5 text-xs font-bold text-pb-charcoal hover:bg-pb-cream-border transition-all"
              >
                Ver ranking del día
              </Link>
            </div>
          </div>
        )}

        {/* 5. Caso: Dispositivo con sesión activa en otra mesa */}
        {errorState === 'other_table' && (
          <div className="mt-2">
            <h1 className="text-2xl font-black text-pb-charcoal">Sesión activa detectada</h1>
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
              Ya tenés una sesión activa en{' '}
              <span className="font-bold">{otherTableDisplayName}</span>.
            </div>
            <p className="mt-3 text-xs text-pb-charcoal-muted">
              Para cambiar de mesa deberás esperar a que expire tu sesión anterior o finalizarla.
            </p>
            <Link
              href="/play/setup"
              className="mt-6 inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-pb-red px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-red-950/10 hover:bg-pb-red-hover active:bg-pb-red-dark transition-all"
            >
              Ir a mi mesa actual
            </Link>
          </div>
        )}

        {/* 6. Caso: El mismo dispositivo ya tiene la sesión activa de esta mesa (Idempotencia) */}
        {!errorState && activeSessionForDevice && resolvedTable && (
          <div className="mt-2">
            <h1 className="text-2xl font-black text-pb-charcoal">{tableDisplayName}</h1>
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">
              ✓ Tu mesa ya está conectada.
            </div>
            <p className="mt-3 text-xs text-pb-charcoal-muted">
              Podés continuar con la preparación o el desarrollo de tu partida.
            </p>
            <Link
              href={resumeNextUrl}
              className="mt-6 inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-pb-red px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-red-950/10 hover:bg-pb-red-hover active:bg-pb-red-dark transition-all"
            >
              Continuar partida
            </Link>
          </div>
        )}

        {/* 7. Caso Normal: Mesa disponible para jugar directamente */}
        {!errorState && !activeSessionForDevice && resolvedTable && (
          <div className="mt-2">
            <h1 className="text-3xl font-black tracking-tight text-pb-charcoal sm:text-4xl">
              {tableDisplayName}
            </h1>
            <h2 className="mt-3 text-lg font-bold text-pb-red">¿Listos para jugar?</h2>
            <p className="mt-2 text-sm text-pb-charcoal-muted">
              Armá tu equipo y competí contra las otras mesas del local.
            </p>

            <TableQrClaimClient qrToken={qrToken} />

            <div className="mt-6 border-t border-pb-cream-border pt-4">
              <Link
                href="/ranking"
                className="text-xs font-semibold text-pb-charcoal-light hover:text-pb-red transition-colors"
              >
                Ver ranking del día →
              </Link>
            </div>
          </div>
        )}

        {/* 8. Caso de Falla de Base de Datos */}
        {!dbAvailable && (
          <div className="mt-2">
            <h1 className="text-2xl font-black text-pb-charcoal">Servicio no disponible</h1>
            <p className="mt-3 text-sm text-pb-charcoal-muted">
              No pudimos conectar con el servidor en este momento. Por favor, reintentá en unos
              segundos.
            </p>
          </div>
        )}
      </BrandCard>
    </main>
  );
}
