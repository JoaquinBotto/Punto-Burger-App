import { and, eq } from 'drizzle-orm';
import type { Database } from '../client';
import { tables, type NewTable, type Table } from '../schema/tables';

export async function createTable(db: Database, data: NewTable): Promise<Table> {
  const [created] = await db.insert(tables).values(data).returning();
  if (!created) {
    throw new Error('No se pudo registrar la mesa.');
  }
  return created;
}

export async function getTableByVenueAndCode(
  db: Database,
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

export async function getTableByQrToken(db: Database, qrToken: string): Promise<Table | null> {
  const result = await db.select().from(tables).where(eq(tables.qrToken, qrToken)).limit(1);
  return result[0] ?? null;
}

export async function getTableByCode(db: Database, code: string): Promise<Table | null> {
  const result = await db.select().from(tables).where(eq(tables.code, code)).limit(1);
  return result[0] ?? null;
}

export async function updateTableStatus(
  db: Database,
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
