import { and, eq } from 'drizzle-orm';
import type { DbClient } from '../client';
import { tables, type NewTable, type Table } from '../schema/tables';

export async function createTable(db: DbClient, data: NewTable): Promise<Table> {
  const [created] = await db.insert(tables).values(data).returning();
  if (!created) {
    throw new Error('No se pudo registrar la mesa.');
  }
  return created;
}

export async function getTableByVenueAndCode(
  db: DbClient,
  venueId: string,
  code: string
): Promise<Table | null> {
  const result = await db
    .select()
    .from(tables)
    .where(and(eq(tables.venueId, venueId), eq(tables.code, code)))
    .limit(1);
  return result[0] ?? null;
}

export async function getTableByQrToken(db: DbClient, qrToken: string): Promise<Table | null> {
  const result = await db.select().from(tables).where(eq(tables.qrToken, qrToken)).limit(1);
  return result[0] ?? null;
}

export async function getTableByCode(db: DbClient, code: string): Promise<Table | null> {
  const result = await db.select().from(tables).where(eq(tables.code, code)).limit(1);
  return result[0] ?? null;
}

export async function getTableById(db: DbClient, tableId: string): Promise<Table | null> {
  const result = await db.select().from(tables).where(eq(tables.id, tableId)).limit(1);
  return result[0] ?? null;
}

export async function getTablesByVenueId(db: DbClient, venueId: string): Promise<Table[]> {
  return db.select().from(tables).where(eq(tables.venueId, venueId)).orderBy(tables.code);
}

export async function updateTableStatus(
  db: DbClient,
  tableId: string,
  status: Table['status']
): Promise<Table> {
  const [updated] = await db
    .update(tables)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(tables.id, tableId))
    .returning();

  if (!updated) {
    throw new Error(`Mesa ${tableId} no encontrada para actualizar estado.`);
  }
  return updated;
}

export async function updateTableQrToken(
  db: DbClient,
  tableId: string,
  qrToken: string
): Promise<Table> {
  const [updated] = await db
    .update(tables)
    .set({
      qrToken,
      updatedAt: new Date(),
    })
    .where(eq(tables.id, tableId))
    .returning();

  if (!updated) {
    throw new Error(`Mesa ${tableId} no encontrada para actualizar token QR.`);
  }
  return updated;
}
