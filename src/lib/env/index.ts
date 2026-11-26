import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_URL: z.string().url().default('http://localhost:3000'),

  // Variables de persistencia y Supabase (PPA-009 / PPA-010 / INFRA-001)
  DATABASE_URL: z.string().optional(),
  DATABASE_MIGRATION_URL: z.string().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  SUPABASE_SECRET_KEY: z.string().optional(),
  SESSION_SECRET: z.string().min(32).optional(),
  ACCESS_CODE_SECRET: z.string().min(32).optional(),

  // Presencia Wi-Fi en local (PPA-CONTEST-001)
  VENUE_PRESENCE_MODE: z.enum(['off', 'observe', 'enforce']).default('off'),
  VENUE_ALLOWED_PUBLIC_IPS: z.string().default(''),
  VENUE_PRESENCE_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(90),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(rawEnv: Record<string, string | undefined> = process.env): Env {
  const result = envSchema.safeParse(rawEnv);
  if (!result.success) {
    console.error('Configuración de entorno inválida:', result.error.format());
    throw new Error('Configuración de variables de entorno inválida.');
  }
  return result.data;
}

export const env = validateEnv();
