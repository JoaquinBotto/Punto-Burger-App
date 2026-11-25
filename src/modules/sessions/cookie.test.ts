import { describe, it, expect } from 'vitest';
import {
  TABLE_SESSION_COOKIE_NAME,
  TABLE_SESSION_MAX_AGE_SECONDS,
  getTableSessionCookieOptions,
} from './cookie';

describe('sessions - cookie configuration', () => {
  it('tiene el nombre oficial de cookie pb_table_session', () => {
    expect(TABLE_SESSION_COOKIE_NAME).toBe('pb_table_session');
  });

  it('tiene una duración de 90 minutos (5400 segundos)', () => {
    expect(TABLE_SESSION_MAX_AGE_SECONDS).toBe(5400);
  });

  it('emite cookie HttpOnly, SameSite Lax y Path /', () => {
    const optionsDev = getTableSessionCookieOptions(false);
    expect(optionsDev.httpOnly).toBe(true);
    expect(optionsDev.sameSite).toBe('lax');
    expect(optionsDev.path).toBe('/');
    expect(optionsDev.maxAge).toBe(5400);
    expect(optionsDev.secure).toBe(false);
  });

  it('habilita Secure exclusivamente en producción', () => {
    const optionsProd = getTableSessionCookieOptions(true);
    expect(optionsProd.secure).toBe(true);
    expect(optionsProd.httpOnly).toBe(true);
  });
});
