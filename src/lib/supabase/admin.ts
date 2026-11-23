import { createClient } from '@supabase/supabase-js';

/**
 * Cliente administrativo de Supabase exclusivo para backend / server-side.
 * Utiliza SUPABASE_SERVICE_ROLE_KEY con privilegios elevados.
 * NUNCA debe importarse ni ejecutarse en componentes del navegador.
 */
export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configuradas para utilizar el cliente administrativo de Supabase.'
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
