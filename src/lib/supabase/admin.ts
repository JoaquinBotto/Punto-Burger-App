import { createClient } from '@supabase/supabase-js';

/**
 * Cliente administrativo de Supabase exclusivo para backend / server-side.
 * Utiliza SUPABASE_SECRET_KEY (API Key moderna de Supabase) con privilegios elevados.
 * NUNCA debe importarse ni ejecutarse en componentes del navegador.
 */
export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error(
      'SUPABASE_URL y SUPABASE_SECRET_KEY deben estar configuradas para utilizar el cliente administrativo de Supabase.'
    );
  }

  return createClient(url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
