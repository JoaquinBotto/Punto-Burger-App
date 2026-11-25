import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { Database } from '../../db/client';
import { tableSessions } from '../../db/schema/table-sessions';
import { devices } from '../../db/schema/devices';
import { tables } from '../../db/schema/tables';
import { auditEvents } from '../../db/schema/audit-events';
import { getSessionWithDetailsByTokenHash } from '../../db/repositories/table-sessions.repository';
import { createAuditEvent } from '../../db/repositories/audit-events.repository';
import { hashToken } from '../../lib/security/tokens';
import { validateVenueAccessCode } from '../../lib/security/access-codes';
import { resolveTableState } from '../tables/tables.service';
import {
  TableAlreadyInUseError,
  TableCooldownError,
  TableDisabledError,
  InvalidAccessCodeError,
} from '../tables/errors';
import {
  DeviceHasActiveSessionError,
  SessionCreationFailedError,
  TooManyAttemptsError,
} from './errors';
import { checkRateLimit, recordRateLimitFailure, recordRateLimitSuccess } from './rate-limiter';
import type { ClaimTableInput, ClaimTableResult, ResolvedSession } from './types';

export const SESSION_DURATION_MS = 90 * 60 * 1000; // 90 minutos

/**
 * Reclama atómicamente una mesa física verificando el código temporal del local,
 * creando la sesión, el dispositivo principal y registrando los eventos de auditoría.
 */
export async function claimTableSession(
  db: Database,
  input: ClaimTableInput,
  existingCookieToken?: string,
  clientIp = 'unknown',
  now = new Date()
): Promise<ClaimTableResult> {
  const tableCode = input.tableCode.trim().toLowerCase();
  const rateLimitKey = `${clientIp}:${tableCode}`;

  // 1. Verificación de Rate Limit
  const rateLimitStatus = checkRateLimit(rateLimitKey, now.getTime());
  if (!rateLimitStatus.allowed) {
    throw new TooManyAttemptsError();
  }

  // 2. Idempotencia y validación de dispositivo con sesión previa
  if (existingCookieToken) {
    const existingSession = await resolveSessionFromCookie(db, existingCookieToken, now);
    if (existingSession) {
      if (existingSession.table.code === tableCode) {
        // Mismo navegador volviendo a reclamar la misma mesa: IDEMPOTENTE
        return {
          ok: true,
          session: {
            table: existingSession.table.displayName,
            status: 'active',
            expiresAt: existingSession.session.expiresAt.toISOString(),
          },
          next: '/play/setup',
          rawDeviceToken: existingCookieToken,
        };
      } else {
        // Dispositivo con sesión activa en OTRA mesa: RECHAZAR
        throw new DeviceHasActiveSessionError(
          `Este dispositivo ya tiene una sesión activa en "${existingSession.table.displayName}". No es posible conectar otra mesa simultáneamente.`
        );
      }
    }
  }

  // 3. Resolución y normalización perezosa de la mesa y su local
  const resolved = await resolveTableState(db, tableCode, now);
  const { table, venue, effectiveStatus } = resolved;

  if (effectiveStatus === 'disabled') {
    throw new TableDisabledError();
  }

  if (effectiveStatus === 'cooldown') {
    throw new TableCooldownError();
  }

  if (effectiveStatus === 'in_use') {
    throw new TableAlreadyInUseError();
  }

  // 4. Validación del código temporal de local (HMAC-SHA256 con 45s de gracia)
  const accessCodeSecret = process.env.ACCESS_CODE_SECRET;
  if (!accessCodeSecret || accessCodeSecret.trim() === '') {
    throw new Error('ACCESS_CODE_SECRET no está configurada en el servidor.');
  }

  const codeValidation = validateVenueAccessCode(
    venue.id,
    input.accessCode,
    accessCodeSecret,
    now.getTime()
  );

  if (!codeValidation.isValid) {
    recordRateLimitFailure(rateLimitKey, now.getTime());

    // Auditoría de intento fallido (NUNCA registrar el código en texto plano)
    await createAuditEvent(db, {
      venueId: venue.id,
      eventType: 'invalid_access_code',
      entityType: 'table',
      entityId: table.id,
      actorType: 'client',
      actorId: clientIp,
      metadata: {
        tableCode: table.code,
        reason: codeValidation.reason,
      },
    });

    throw new InvalidAccessCodeError();
  }

  // 5. Generación de credenciales criptográficas server-side
  const rawDeviceToken = randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawDeviceToken);
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);

  // 6. Transacción Atómica en PostgreSQL
  try {
    const result = await db.transaction(async (tx) => {
      // Re-verificar que la mesa siga disponible dentro de la transacción
      const [currentTable] = await tx.select().from(tables).where(eq(tables.id, table.id)).limit(1);

      if (!currentTable || currentTable.status !== 'available') {
        throw new TableAlreadyInUseError();
      }

      // 6.1 Crear table_session
      const [session] = await tx
        .insert(tableSessions)
        .values({
          venueId: venue.id,
          tableId: table.id,
          status: 'active',
          startedAt: now,
          expiresAt,
        })
        .returning();

      if (!session) {
        throw new SessionCreationFailedError();
      }

      // 6.2 Crear device con hash del token
      const [device] = await tx
        .insert(devices)
        .values({
          tableSessionId: session.id,
          tokenHash,
          status: 'active',
          claimedAt: now,
          lastSeenAt: now,
        })
        .returning();

      if (!device) {
        throw new SessionCreationFailedError();
      }

      // 6.3 Asignar activeDeviceId en la sesión
      await tx
        .update(tableSessions)
        .set({
          activeDeviceId: device.id,
          updatedAt: now,
        })
        .where(eq(tableSessions.id, session.id));

      // 6.4 Marcar mesa in_use
      await tx
        .update(tables)
        .set({
          status: 'in_use',
          updatedAt: now,
        })
        .where(eq(tables.id, table.id));

      // 6.5 Auditoría de sesión creada
      await tx.insert(auditEvents).values({
        venueId: venue.id,
        eventType: 'session_created',
        entityType: 'table_session',
        entityId: session.id,
        actorType: 'device',
        actorId: device.id,
        metadata: {
          tableId: table.id,
          tableCode: table.code,
          expiresAt: expiresAt.toISOString(),
          claimWindow: codeValidation.reason,
        },
      });

      return {
        session,
        device,
      };
    });

    // 7. Éxito: limpiar limitador y retornar respuesta opaca
    recordRateLimitSuccess(rateLimitKey);

    return {
      ok: true,
      session: {
        table: table.displayName,
        status: 'active',
        expiresAt: result.session.expiresAt.toISOString(),
      },
      next: '/play/setup',
      rawDeviceToken,
    };
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    // Manejo de conflicto por concurrencia (índice único parcial table_sessions_active_table_idx)
    if (
      err?.code === '23505' ||
      err?.message?.includes('table_sessions_active_table_idx') ||
      error instanceof TableAlreadyInUseError
    ) {
      throw new TableAlreadyInUseError();
    }

    if (
      error instanceof TableDisabledError ||
      error instanceof TableCooldownError ||
      error instanceof InvalidAccessCodeError ||
      error instanceof DeviceHasActiveSessionError
    ) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);
    console.error('Error al reclamar mesa en transacción:', message);
    throw new SessionCreationFailedError();
  }
}

/**
 * Resuelve y valida la sesión de un cliente a partir del token crudo recibido en la cookie.
 * Realiza normalización perezosa si la sesión ya superó su tiempo límite de expiración.
 */
export async function resolveSessionFromCookie(
  db: Database,
  cookieToken?: string,
  now = new Date()
): Promise<ResolvedSession | null> {
  if (!cookieToken || cookieToken.trim() === '') {
    return null;
  }

  const tokenHash = hashToken(cookieToken);
  const resolved = await getSessionWithDetailsByTokenHash(db, tokenHash);

  if (!resolved) {
    return null;
  }

  const { device, session, table, venue } = resolved;

  // Verificar estado del dispositivo y de la sesión
  if (device.status !== 'active' || session.status !== 'active') {
    return null;
  }

  // Verificar que este dispositivo sea efectivamente el dispositivo activo asignado
  if (session.activeDeviceId !== device.id) {
    return null;
  }

  // Comprobar expiración temporal
  if (session.expiresAt <= now) {
    // Normalizar sesión perezosamente
    await resolveTableState(db, table.code, now);
    return null;
  }

  return {
    device,
    session,
    table,
    venue,
  };
}
