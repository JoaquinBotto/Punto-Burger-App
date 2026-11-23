import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

declare global {
  var __dbClient: postgres.Sql | undefined;
}

/**
 * Obtiene la cadena de conexión de runtime. Lanza un error explícito si no está configurada.
 */
export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url || url.trim() === '') {
    throw new Error(
      'DATABASE_URL no está configurada. Configure la variable de entorno DATABASE_URL en su archivo .env.local o en la configuración del servidor DonWeb.'
    );
  }
  return url.trim();
}

/**
 * Retorna el cliente SQL de postgres.js reutilizando la conexión en desarrollo (HMR).
 */
export function getSqlClient(): postgres.Sql {
  if (process.env.NODE_ENV === 'production') {
    return postgres(getDatabaseUrl(), { max: 10, idle_timeout: 20 });
  }

  if (!global.__dbClient) {
    global.__dbClient = postgres(getDatabaseUrl(), { max: 5 });
  }
  return global.__dbClient;
}

/**
 * Instancia de Drizzle ORM tipada con el esquema completo de las 13 entidades.
 */
export function getDb() {
  const sql = getSqlClient();
  return drizzle(sql, { schema });
}

export type Database = ReturnType<typeof getDb>;
