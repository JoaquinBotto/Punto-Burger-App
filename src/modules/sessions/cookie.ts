export const TABLE_SESSION_COOKIE_NAME = 'pb_table_session';
export const TABLE_SESSION_MAX_AGE_SECONDS = 90 * 60; // 90 minutos (5400 s)

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  path: string;
  maxAge: number;
}

/**
 * Retorna las opciones oficiales y seguras para la cookie pb_table_session.
 */
export function getTableSessionCookieOptions(
  isProduction = process.env.NODE_ENV === 'production'
): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: TABLE_SESSION_MAX_AGE_SECONDS,
  };
}
