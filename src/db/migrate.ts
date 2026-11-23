import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

export async function runMigrations() {
  const connectionUrl = process.env.DATABASE_MIGRATION_URL || process.env.DATABASE_URL;
  if (!connectionUrl || connectionUrl.trim() === '') {
    throw new Error(
      'DATABASE_MIGRATION_URL (o DATABASE_URL) no está configurada. Configure las credenciales de base de datos para ejecutar migraciones.'
    );
  }

  console.log('Iniciando migraciones de base de datos...');
  const migrationClient = postgres(connectionUrl, { max: 1 });
  const db = drizzle(migrationClient);

  try {
    await migrate(db, { migrationsFolder: './src/db/migrations' });
    console.log('Migraciones completadas exitosamente.');
  } finally {
    await migrationClient.end();
  }
}

// Ejecución directa si se invoca desde la línea de comandos
if (process.argv[1]?.includes('migrate.ts')) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error al ejecutar migraciones:', err);
      process.exit(1);
    });
}
