import { randomBytes } from 'node:crypto';
import * as dotenv from 'dotenv';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as schema from '../src/db/schema';

dotenv.config({ path: '.env.local' });
dotenv.config();

export async function rotateTableQr(tableCodeInput?: string) {
  if (!tableCodeInput || tableCodeInput.trim() === '') {
    console.error('Uso: npm run qr:rotate -- <código-de-mesa> (ej: mesa-05)');
    process.exit(1);
  }

  const normalizedCode = tableCodeInput.trim().toLowerCase();
  const connectionUrl = process.env.DATABASE_MIGRATION_URL || process.env.DATABASE_URL;
  if (!connectionUrl || connectionUrl.trim() === '') {
    throw new Error('DATABASE_URL no está configurada.');
  }

  const sql = postgres(connectionUrl, { max: 1 });
  const db = drizzle(sql, { schema });

  try {
    const [table] = await db
      .select()
      .from(schema.tables)
      .where(eq(schema.tables.code, normalizedCode))
      .limit(1);

    if (!table) {
      throw new Error(`Mesa con código "${normalizedCode}" no encontrada.`);
    }

    const newQrToken = randomBytes(24).toString('base64url');
    const now = new Date();

    await db.transaction(async (tx) => {
      await tx
        .update(schema.tables)
        .set({
          qrToken: newQrToken,
          updatedAt: now,
        })
        .where(eq(schema.tables.id, table.id));

      await tx.insert(schema.auditEvents).values({
        venueId: table.venueId,
        eventType: 'table_qr_rotated',
        entityType: 'table',
        entityId: table.id,
        actorType: 'system',
        actorId: 'cli-admin',
        metadata: {
          tableCode: table.code,
          rotatedAt: now.toISOString(),
        },
      });
    });

    console.log(`[✓] Token QR rotado exitosamente para ${table.displayName} (${table.code}).`);
    console.log(`    El nuevo QR ya se encuentra activo sin modificar el historial de partidas.`);
  } finally {
    await sql.end();
  }
}

if (process.argv[1]?.includes('rotate-table-qr.ts')) {
  const tableCode = process.argv[2];
  rotateTableQr(tableCode)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error al rotar token QR:', err);
      process.exit(1);
    });
}
