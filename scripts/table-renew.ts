import * as dotenv from 'dotenv';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../src/db/schema';
import { renewTable } from '../src/modules/tables/table-renewal.service';

dotenv.config({ path: '.env.local' });
dotenv.config();

function parseArgs() {
  const args = process.argv.slice(2);
  let tableCode = '';
  let force = false;

  for (const arg of args) {
    if (arg === '--force') {
      force = true;
    } else if (!arg.startsWith('--') && !tableCode) {
      tableCode = arg;
    }
  }

  return { tableCode: tableCode || 'mesa-01', force };
}

async function main() {
  const { tableCode, force } = parseArgs();

  const connectionUrl = process.env.DATABASE_URL;
  if (!connectionUrl || connectionUrl.trim() === '') {
    console.error('ERROR: DATABASE_URL no está configurada.');
    process.exit(1);
  }

  const sql = postgres(connectionUrl, { max: 1 });
  const db = drizzle(sql, { schema });

  try {
    console.log(`Renovando ${tableCode}${force ? ' (con --force)' : ''}...`);

    const result = await renewTable(db, tableCode, { force });

    console.log('\n✅ MESA RENOVADA EXITOSAMENTE:');
    console.log(`- Mesa: ${result.tableDisplayName} (${result.tableCode})`);
    console.log(`- Sesión previa cerrada: ${result.previousSessionId ?? 'Ninguna'}`);
    if (result.previousCompetitionEntryId) {
      console.log(`- Entrada de competencia previa: ${result.previousCompetitionEntryId}`);
    }
    console.log(`- Forzado: ${result.forced ? 'SÍ' : 'NO'}`);
    console.log(`- Estado: disponible para nuevos clientes`);
    console.log(`- Mensaje: ${result.message}`);

    await sql.end();
    process.exit(0);
  } catch (err: unknown) {
    const error = err as Error;
    console.error(`\n❌ ERROR al renovar ${tableCode}: ${error.message}`);
    await sql.end();
    process.exit(1);
  }
}

main();
