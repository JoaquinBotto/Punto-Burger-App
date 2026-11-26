import { randomBytes } from 'node:crypto';
import * as dotenv from 'dotenv';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { and, eq } from 'drizzle-orm';
import * as schema from '../src/db/schema';

dotenv.config({ path: '.env.local' });
dotenv.config();

export function generateSecureQrToken(): string {
  return randomBytes(24).toString('base64url');
}

export async function provisionTables(venueSlug = 'esperanza-central') {
  const connectionUrl = process.env.DATABASE_MIGRATION_URL || process.env.DATABASE_URL;
  if (!connectionUrl || connectionUrl.trim() === '') {
    throw new Error('DATABASE_URL o DATABASE_MIGRATION_URL no está configurada.');
  }

  const sql = postgres(connectionUrl, { max: 1 });
  const db = drizzle(sql, { schema });

  try {
    const [venue] = await db
      .select()
      .from(schema.venues)
      .where(eq(schema.venues.slug, venueSlug))
      .limit(1);

    if (!venue) {
      throw new Error(`Local con slug "${venueSlug}" no encontrado.`);
    }

    console.log(`Verificando aprovisionamiento de 30 mesas para: ${venue.name} (${venue.slug})`);

    let createdCount = 0;
    let rotatedCount = 0;
    let existingCount = 0;

    for (let i = 1; i <= 30; i++) {
      const padNum = String(i).padStart(2, '0');
      const code = `mesa-${padNum}`;
      const displayName = `Mesa ${padNum}`;

      const [existingTable] = await db
        .select()
        .from(schema.tables)
        .where(and(eq(schema.tables.venueId, venue.id), eq(schema.tables.code, code)))
        .limit(1);

      if (!existingTable) {
        // Insertar mesa nueva
        const qrToken = generateSecureQrToken();
        await db.insert(schema.tables).values({
          venueId: venue.id,
          code,
          displayName,
          status: 'available',
          qrToken,
        });
        createdCount++;
        console.log(`[+] ${displayName} (${code}) creada con token QR permanente.`);
      } else {
        // Verificar si tiene un token QR predecible legacy o de baja entropía
        if (
          existingTable.qrToken.startsWith('pb_mesa') ||
          existingTable.qrToken === `pb_${code.replace('-', '_')}_${venue.slug}` ||
          existingTable.qrToken.length < 20
        ) {
          const newQrToken = generateSecureQrToken();
          await db
            .update(schema.tables)
            .set({
              qrToken: newQrToken,
              updatedAt: new Date(),
            })
            .where(eq(schema.tables.id, existingTable.id));
          rotatedCount++;
          console.log(
            `[*] ${displayName} (${code}) rotada de token predecible a token criptográfico permanente.`
          );
        } else {
          existingCount++;
        }
      }
    }

    console.log(`--- Resumen de Aprovisionamiento ---`);
    console.log(`Total mesas objetivo: 30`);
    console.log(`Mesas creadas: ${createdCount}`);
    console.log(`Mesas rotadas a token seguro: ${rotatedCount}`);
    console.log(`Mesas ya existentes y seguras: ${existingCount}`);
    console.log(`Estado: Completo y consistente.`);
  } finally {
    await sql.end();
  }
}

if (process.argv[1]?.includes('provision-tables.ts')) {
  provisionTables()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en aprovisionamiento de mesas:', err);
      process.exit(1);
    });
}
