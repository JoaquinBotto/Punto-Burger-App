import * as fs from 'node:fs';
import * as path from 'node:path';
import * as dotenv from 'dotenv';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { asc, eq } from 'drizzle-orm';
import * as schema from '../src/db/schema';

dotenv.config({ path: '.env.local' });
dotenv.config();

export async function exportTableQrManifest(venueSlug = 'esperanza-central') {
  const connectionUrl = process.env.DATABASE_URL || process.env.DATABASE_MIGRATION_URL;
  if (!connectionUrl || connectionUrl.trim() === '') {
    throw new Error('DATABASE_URL no está configurada.');
  }

  const baseUrl = (
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://app.puntoburger.com.ar'
  ).replace(/\/$/, '');

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

    const tableList = await db
      .select({
        code: schema.tables.code,
        displayName: schema.tables.displayName,
        qrToken: schema.tables.qrToken,
      })
      .from(schema.tables)
      .where(eq(schema.tables.venueId, venue.id))
      .orderBy(asc(schema.tables.code));

    if (tableList.length === 0) {
      throw new Error(
        `No se encontraron mesas para el local "${venueSlug}". Ejecute tables:provision primero.`
      );
    }

    // Determinar directorio de destino seguro
    let targetDir = process.env.QR_MANIFEST_DIR;
    if (!targetDir) {
      if (fs.existsSync('/var/www/punto-burger-app/shared')) {
        targetDir = '/var/www/punto-burger-app/shared/qr-print';
      } else {
        targetDir = path.resolve(process.cwd(), 'tmp/qr-print');
      }
    }

    fs.mkdirSync(targetDir, { recursive: true });

    const csvLines = ['table_code,display_name,url'];
    const jsonData = [];

    for (const table of tableList) {
      const url = `${baseUrl}/t/${table.qrToken}`;
      csvLines.push(`${table.code},"${table.displayName}",${url}`);
      jsonData.push({
        table_code: table.code,
        display_name: table.displayName,
        url,
      });
    }

    const csvPath = path.join(targetDir, 'table-qr-manifest.csv');
    const jsonPath = path.join(targetDir, 'table-qr-manifest.json');

    fs.writeFileSync(csvPath, csvLines.join('\n') + '\n', { encoding: 'utf-8' });
    fs.chmodSync(csvPath, 0o600);

    fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2) + '\n', { encoding: 'utf-8' });
    fs.chmodSync(jsonPath, 0o600);

    console.log(`[✓] Manifiesto QR exportado exitosamente.`);
    console.log(`    Total de mesas: ${tableList.length}`);
    console.log(`    Directorio: ${targetDir}`);
    console.log(
      `    Archivos generados: table-qr-manifest.csv, table-qr-manifest.json (permisos 600)`
    );
  } finally {
    await sql.end();
  }
}

if (process.argv[1]?.includes('export-table-qr-manifest.ts')) {
  exportTableQrManifest()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error al exportar manifiesto QR:', err);
      process.exit(1);
    });
}
