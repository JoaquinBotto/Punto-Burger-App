import { cookies } from 'next/headers';
import Link from 'next/link';
import { getDb } from '@/db/client';
import { resolveTableState, TableNotFoundError } from '@/modules/tables';
import { TABLE_SESSION_COOKIE_NAME, resolveSessionFromCookie } from '@/modules/sessions';
import { BrandCard, BrandHeader } from '@/components/ui';

interface TablePageProps {
  params: Promise<{
    tableCode: string;
  }>;
}

export default async function TablePage({ params }: TablePageProps) {
  const { tableCode } = await params;
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(TABLE_SESSION_COOKIE_NAME)?.value;

  let dbAvailable = true;
  let resolvedTable = null;
  let activeSessionForDevice = null;
  let errorState: 'not_found' | 'disabled' | 'in_use' | 'cooldown' | 'other_table' | null = null;
  let cooldownRemainingSeconds = 0;
  let otherTableDisplayName = '';

  try {
    const db = getDb();

    // 1. Verificar si el dispositivo ya cuenta con una sesión válida
    if (sessionCookie) {
      activeSessionForDevice = await resolveSessionFromCookie(db, sessionCookie);
      if (activeSessionForDevice) {
        if (activeSessionForDevice.table.code !== tableCode.trim().toLowerCase()) {
          errorState = 'other_table';
          otherTableDisplayName = activeSessionForDevice.table.displayName;
        }
      }
    }

    // 2. Si no hay conflicto de otra mesa, resolver el estado de la mesa actual
    if (!errorState) {
      resolvedTable = await resolveTableState(db, tableCode);

      if (resolvedTable.effectiveStatus === 'disabled') {
        errorState = 'disabled';
      } else if (resolvedTable.effectiveStatus === 'cooldown') {
        errorState = 'cooldown';
        cooldownRemainingSeconds = resolvedTable.cooldownRemainingSeconds ?? 120;
      } else if (resolvedTable.effectiveStatus === 'in_use') {
        // Si la mesa está in_use pero este dispositivo es el dueño activo, permitimos continuar
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
      console.error('Error al resolver la mesa:', error);
      dbAvailable = false;
    }
  }

  const tableDisplayName = resolvedTable?.table.displayName ?? 'Punto Burger';

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 text-center">
      <BrandCard>
        {/* Cabecera de Marca Oficial */}
        <BrandHeader tableBadge={resolvedTable?.table.displayName} className="mb-6" />

        {/* 1. Caso: Mesa no encontrada */}
        {errorState === 'not_found' && (
          <div className="mt-2">
            <h1 className="text-2xl font-black text-pb-charcoal">Mesa no encontrada</h1>
            <p className="mt-3 text-sm text-pb-charcoal-muted">
              El código escaneado no corresponde a ninguna mesa activa en el local.
            </p>
            <p className="mt-2 text-xs text-pb-charcoal-light">
              Por favor, asegurate de escanear el código QR colocado en tu mesa.
            </p>
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
          </div>
        )}

        {/* 3. Caso: Mesa en Cooldown */}
        {errorState === 'cooldown' && resolvedTable && (
          <div className="mt-2">
            <h1 className="text-2xl font-black text-pb-charcoal">{tableDisplayName}</h1>
            <div className="mt-4 rounded-2xl border border-pb-yellow-border bg-pb-yellow-light p-4 text-sm font-semibold text-pb-charcoal">
              Mesa en preparación temporal.
            </div>
            <p className="mt-3 text-xs text-pb-charcoal-muted">
              La sesión anterior finalizó recientemente. Esta mesa se habilitará automáticamente en
              aproximadamente{' '}
              <span className="font-bold text-pb-red">
                {cooldownRemainingSeconds > 0
                  ? `${cooldownRemainingSeconds} segundos`
                  : 'instantes'}
              </span>
              .
            </p>
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
              Esta mesa ya tiene una sesión iniciada por otro dispositivo.
            </p>
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
              Podés continuar con la preparación de tu equipo.
            </p>
            <Link
              href="/play/setup"
              className="mt-6 inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-pb-red px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-red-950/10 hover:bg-pb-red-hover active:bg-pb-red-dark transition-all"
            >
              Continuar a la partida
            </Link>
          </div>
        )}

        {/* 7. Caso Informativo: Acceso por QR físico permanente */}
        {!errorState && !activeSessionForDevice && resolvedTable && (
          <div className="mt-2">
            <h1 className="text-3xl font-black tracking-tight text-pb-charcoal sm:text-4xl">
              {tableDisplayName}
            </h1>
            <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50 p-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-pb-cream text-pb-red mb-3">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-black text-pb-charcoal">Accedé desde el QR de tu mesa</h2>
              <p className="mt-2 text-sm text-pb-charcoal-muted">
                Para comenzar a jugar, escaneá directamente el código QR ubicado en tu mesa física.
                Ya no es necesario ingresar ningún código de pantalla.
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
