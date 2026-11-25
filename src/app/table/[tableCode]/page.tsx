import { cookies } from 'next/headers';
import Link from 'next/link';
import { getDb } from '@/db/client';
import { resolveTableState, TableNotFoundError } from '@/modules/tables';
import { TABLE_SESSION_COOKIE_NAME, resolveSessionFromCookie } from '@/modules/sessions';
import { TableClaimForm } from './table-claim-form';

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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-sm">
        {/* Marca Oficial */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          Punto Burger
        </div>

        {/* 1. Caso: Mesa no encontrada */}
        {errorState === 'not_found' && (
          <div className="mt-2">
            <h1 className="text-2xl font-bold text-white">Mesa no encontrada</h1>
            <p className="mt-3 text-sm text-slate-300">
              El código escaneado no corresponde a ninguna mesa activa en el local.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Por favor, asegurate de escanear el código QR colocado en tu mesa.
            </p>
          </div>
        )}

        {/* 2. Caso: Mesa deshabilitada */}
        {errorState === 'disabled' && resolvedTable && (
          <div className="mt-2">
            <h1 className="text-2xl font-bold text-white">{resolvedTable.table.displayName}</h1>
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-950/30 p-4 text-sm text-amber-200">
              Esta mesa no se encuentra disponible en este momento.
            </div>
            <p className="mt-4 text-xs text-slate-400">
              Consultá con el personal del local para que te asignen una mesa habilitada.
            </p>
          </div>
        )}

        {/* 3. Caso: Mesa en Cooldown */}
        {errorState === 'cooldown' && resolvedTable && (
          <div className="mt-2">
            <h1 className="text-2xl font-bold text-white">{resolvedTable.table.displayName}</h1>
            <div className="mt-4 rounded-xl border border-blue-500/30 bg-blue-950/30 p-4 text-sm text-blue-200">
              Mesa en preparación temporal.
            </div>
            <p className="mt-3 text-xs text-slate-300">
              La sesión anterior finalizó recientemente. Esta mesa se habilitará automáticamente en
              aproximadamente{' '}
              <span className="font-semibold text-amber-400">
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
            <h1 className="text-2xl font-bold text-white">{resolvedTable.table.displayName}</h1>
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-200">
              Mesa actualmente en uso.
            </div>
            <p className="mt-3 text-xs text-slate-300">
              Esta mesa ya tiene una sesión iniciada por otro dispositivo.
            </p>
          </div>
        )}

        {/* 5. Caso: Dispositivo con sesión activa en otra mesa */}
        {errorState === 'other_table' && (
          <div className="mt-2">
            <h1 className="text-2xl font-bold text-white">Sesión activa detectada</h1>
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-950/30 p-4 text-sm text-amber-200">
              Ya tenés una sesión activa en{' '}
              <span className="font-bold">{otherTableDisplayName}</span>.
            </div>
            <p className="mt-3 text-xs text-slate-300">
              Para cambiar de mesa deberás esperar a que expire tu sesión anterior o finalizarla.
            </p>
            <Link
              href="/play/setup"
              className="mt-6 inline-block w-full rounded-xl bg-amber-500 py-3 text-sm font-bold text-slate-950 hover:bg-amber-400"
            >
              Ir a mi mesa actual
            </Link>
          </div>
        )}

        {/* 6. Caso: El mismo dispositivo ya tiene la sesión activa de esta mesa (Idempotencia) */}
        {!errorState && activeSessionForDevice && resolvedTable && (
          <div className="mt-2">
            <h1 className="text-2xl font-bold text-white">{resolvedTable.table.displayName}</h1>
            <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-4 text-sm text-emerald-200">
              ✓ Tu mesa ya está conectada.
            </div>
            <p className="mt-3 text-xs text-slate-300">
              Podés continuar con la preparación de tu equipo.
            </p>
            <Link
              href="/play/setup"
              className="mt-6 inline-block w-full rounded-xl bg-amber-500 py-3 text-sm font-bold text-slate-950 hover:bg-amber-400"
            >
              Continuar a la partida
            </Link>
          </div>
        )}

        {/* 7. Caso Normal: Mesa disponible para ingresar código temporal */}
        {!errorState && !activeSessionForDevice && resolvedTable && (
          <div className="mt-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              {resolvedTable.table.displayName}
            </h1>
            <p className="mt-3 text-sm text-slate-300">
              Ingresá el código que ves en las pantallas del local.
            </p>
            <TableClaimForm tableCode={resolvedTable.table.code} />
          </div>
        )}

        {/* 8. Caso de Falla de Base de Datos */}
        {!dbAvailable && (
          <div className="mt-2">
            <h1 className="text-2xl font-bold text-white">Servicio no disponible</h1>
            <p className="mt-3 text-sm text-slate-300">
              No pudimos conectar con el servidor en este momento. Por favor, reintentá en unos
              segundos.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
