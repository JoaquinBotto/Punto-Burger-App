import type { Database } from '../../db/client';
import {
  getTableByCode,
  getTableByQrToken,
  updateTableStatus,
} from '../../db/repositories/tables.repository';
import { getVenueById } from '../../db/repositories/venues.repository';
import {
  getActiveSessionByTableId,
  getLatestSessionByTableId,
  updateSessionStatus,
} from '../../db/repositories/table-sessions.repository';
import { createAuditEvent } from '../../db/repositories/audit-events.repository';
import { TableNotFoundError } from './errors';
import type { ResolvedTableState, TableStatus } from './types';
import type { Table } from '../../db/schema/tables';

export const COOLDOWN_DURATION_MS = 2 * 60 * 1000; // 2 minutos

/**
 * Normaliza de forma perezosa el estado de una mesa y su sesión/cooldown.
 */
async function normalizeAndResolveTableState(
  db: Database,
  table: Table,
  now: Date
): Promise<ResolvedTableState> {
  const venue = await getVenueById(db, table.venueId);
  if (!venue) {
    throw new TableNotFoundError('El local asociado a la mesa no se encuentra disponible.');
  }

  let effectiveStatus: TableStatus = table.status;
  let activeSession = await getActiveSessionByTableId(db, table.id);
  let cooldownRemainingSeconds: number | undefined;

  // 1. Normalización perezosa de sesión activa expirada
  if (effectiveStatus === 'in_use' && activeSession) {
    if (activeSession.expiresAt <= now) {
      const cooldownUntil = new Date(now.getTime() + COOLDOWN_DURATION_MS);

      // Transición sesión: active -> expired (limpia active_device_id automáticamente)
      await updateSessionStatus(db, activeSession.id, 'expired', now, cooldownUntil);

      // Transición mesa: in_use -> cooldown
      await updateTableStatus(db, table.id, 'cooldown');

      // Auditoría server-side
      await createAuditEvent(db, {
        venueId: venue.id,
        eventType: 'session_expired',
        entityType: 'table_session',
        entityId: activeSession.id,
        actorType: 'system',
        actorId: 'server-lazy-evaluator',
        metadata: {
          tableId: table.id,
          tableCode: table.code,
          reason: 'session_time_limit_reached',
        },
      });

      await createAuditEvent(db, {
        venueId: venue.id,
        eventType: 'table_cooldown_started',
        entityType: 'table',
        entityId: table.id,
        actorType: 'system',
        actorId: 'server-lazy-evaluator',
        metadata: {
          cooldownUntil: cooldownUntil.toISOString(),
          durationMs: COOLDOWN_DURATION_MS,
        },
      });

      effectiveStatus = 'cooldown';
      activeSession = null;
      table.status = 'cooldown';
      cooldownRemainingSeconds = Math.ceil((cooldownUntil.getTime() - now.getTime()) / 1000);
    }
  } else if (effectiveStatus === 'in_use' && !activeSession) {
    // Inconsistencia corregida: marcada como in_use pero sin sesión activa
    await updateTableStatus(db, table.id, 'available');
    effectiveStatus = 'available';
    table.status = 'available';
  }

  // 2. Normalización perezosa de mesa en cooldown finalizado (cuando la mesa ya ingresó en cooldown previamente)
  else if (effectiveStatus === 'cooldown') {
    const latestSession = await getLatestSessionByTableId(db, table.id);

    if (latestSession?.cooldownUntil && latestSession.cooldownUntil <= now) {
      // Cooldown cumplido: la mesa se libera automáticamente sin intervención del personal
      await updateTableStatus(db, table.id, 'available');
      effectiveStatus = 'available';
      table.status = 'available';
      cooldownRemainingSeconds = 0;
    } else if (latestSession?.cooldownUntil) {
      cooldownRemainingSeconds = Math.max(
        0,
        Math.ceil((latestSession.cooldownUntil.getTime() - now.getTime()) / 1000)
      );
    }
  }

  return {
    table,
    venue,
    activeSession,
    effectiveStatus,
    cooldownRemainingSeconds,
  };
}

/**
 * Resuelve la mesa a partir de su código público (ej. "mesa-01"), normalizando de forma perezosa
 * (lazy normalization) su estado en caso de expiración de sesión o finalización de cooldown.
 */
export async function resolveTableState(
  db: Database,
  tableCode: string,
  now = new Date()
): Promise<ResolvedTableState> {
  const normalizedCode = tableCode.trim().toLowerCase();
  const table = await getTableByCode(db, normalizedCode);

  if (!table) {
    throw new TableNotFoundError();
  }

  return normalizeAndResolveTableState(db, table, now);
}

/**
 * Resuelve la mesa a partir de su token QR físico permanente, normalizando de forma perezosa
 * (lazy normalization) su estado en caso de expiración de sesión o finalización de cooldown.
 */
export async function resolveTableStateByQrToken(
  db: Database,
  qrToken: string,
  now = new Date()
): Promise<ResolvedTableState> {
  const normalizedToken = qrToken.trim();
  const table = await getTableByQrToken(db, normalizedToken);

  if (!table) {
    throw new TableNotFoundError('Mesa no encontrada con el código QR provisto.');
  }

  return normalizeAndResolveTableState(db, table, now);
}
