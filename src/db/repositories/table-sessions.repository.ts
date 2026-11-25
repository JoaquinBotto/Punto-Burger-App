import { and, desc, eq } from 'drizzle-orm';
import type { Database, DbClient } from '../client';
import { tableSessions, type NewTableSession, type TableSession } from '../schema/table-sessions';
import { devices, type Device, type NewDevice } from '../schema/devices';
import { tables, type Table } from '../schema/tables';
import { venues, type Venue } from '../schema/venues';

/**
 * Obtiene la sesión activa actual para una mesa dada (si existe).
 */
export async function getActiveSessionByTableId(
  db: DbClient,
  tableId: string
): Promise<TableSession | null> {
  const result = await db
    .select()
    .from(tableSessions)
    .where(and(eq(tableSessions.tableId, tableId), eq(tableSessions.status, 'active')))
    .limit(1);

  return result[0] ?? null;
}

/**
 * Obtiene la sesión más reciente para una mesa (activa, expirada o cerrada).
 */
export async function getLatestSessionByTableId(
  db: DbClient,
  tableId: string
): Promise<TableSession | null> {
  const result = await db
    .select()
    .from(tableSessions)
    .where(eq(tableSessions.tableId, tableId))
    .orderBy(desc(tableSessions.createdAt))
    .limit(1);

  return result[0] ?? null;
}

/**
 * Inserta una nueva sesión de mesa.
 */
export async function createTableSession(
  db: DbClient,
  data: NewTableSession
): Promise<TableSession> {
  const [created] = await db.insert(tableSessions).values(data).returning();
  if (!created) {
    throw new Error('No se pudo crear la sesión de mesa.');
  }
  return created;
}

/**
 * Actualiza el estado y marcas de cierre/cooldown de una sesión.
 */
export async function updateSessionStatus(
  db: DbClient,
  sessionId: string,
  status: TableSession['status'],
  closedAt?: Date | null,
  cooldownUntil?: Date | null
): Promise<TableSession> {
  const updateData: Partial<NewTableSession> = {
    status,
    updatedAt: new Date(),
  };
  if (closedAt !== undefined) {
    updateData.closedAt = closedAt;
  }
  if (cooldownUntil !== undefined) {
    updateData.cooldownUntil = cooldownUntil;
  }

  const [updated] = await db
    .update(tableSessions)
    .set(updateData)
    .where(eq(tableSessions.id, sessionId))
    .returning();

  if (!updated) {
    throw new Error(`Sesión ${sessionId} no encontrada para actualizar estado.`);
  }
  return updated;
}

/**
 * Asocia el dispositivo activo principal a una sesión de mesa.
 */
export async function updateSessionActiveDevice(
  db: DbClient,
  sessionId: string,
  deviceId: string
): Promise<TableSession> {
  const [updated] = await db
    .update(tableSessions)
    .set({
      activeDeviceId: deviceId,
      updatedAt: new Date(),
    })
    .where(eq(tableSessions.id, sessionId))
    .returning();

  if (!updated) {
    throw new Error(`Sesión ${sessionId} no encontrada.`);
  }
  return updated;
}

/**
 * Registra un nuevo dispositivo vinculado a una sesión de mesa.
 */
export async function createDevice(db: DbClient, data: NewDevice): Promise<Device> {
  const [created] = await db.insert(devices).values(data).returning();
  if (!created) {
    throw new Error('No se pudo registrar el dispositivo.');
  }
  return created;
}

/**
 * Busca un dispositivo activo por el hash de su token criptográfico.
 */
export async function getActiveDeviceByTokenHash(
  db: DbClient,
  tokenHash: string
): Promise<Device | null> {
  const result = await db
    .select()
    .from(devices)
    .where(and(eq(devices.tokenHash, tokenHash), eq(devices.status, 'active')))
    .limit(1);

  return result[0] ?? null;
}

/**
 * Resuelve la sesión completa (dispositivo, sesión, mesa y local) a partir del token hash.
 */
export async function getSessionWithDetailsByTokenHash(
  db: Database,
  tokenHash: string
): Promise<{ device: Device; session: TableSession; table: Table; venue: Venue } | null> {
  const result = await db
    .select({
      device: devices,
      session: tableSessions,
      table: tables,
      venue: venues,
    })
    .from(devices)
    .innerJoin(tableSessions, eq(devices.tableSessionId, tableSessions.id))
    .innerJoin(tables, eq(tableSessions.tableId, tables.id))
    .innerJoin(venues, eq(tables.venueId, venues.id))
    .where(and(eq(devices.tokenHash, tokenHash), eq(devices.status, 'active')))
    .limit(1);

  return result[0] ?? null;
}

/**
 * Revoca un dispositivo activo.
 */
export async function revokeDevice(
  db: DbClient,
  deviceId: string,
  revokedAt = new Date()
): Promise<Device> {
  const [revoked] = await db
    .update(devices)
    .set({
      status: 'revoked',
      revokedAt,
    })
    .where(eq(devices.id, deviceId))
    .returning();

  if (!revoked) {
    throw new Error(`Dispositivo ${deviceId} no encontrado.`);
  }

  return revoked;
}
