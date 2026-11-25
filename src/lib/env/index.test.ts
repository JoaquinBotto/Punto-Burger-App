import { describe, it, expect } from 'vitest';
import { validateEnv } from './index';

describe('validateEnv', () => {
  it('should validate default environment without throwing', () => {
    const config = validateEnv({});
    expect(config.NODE_ENV).toBe('development');
    expect(config.APP_URL).toBe('http://localhost:3000');
  });

  it('should accept valid custom APP_URL and Supabase modern keys', () => {
    const config = validateEnv({
      NODE_ENV: 'production',
      APP_URL: 'https://puntoburger.com.ar',
      SUPABASE_URL: 'https://xyz.supabase.co',
      SUPABASE_PUBLISHABLE_KEY: 'pk_test_123',
      SUPABASE_SECRET_KEY: 'sk_test_456',
    });
    expect(config.NODE_ENV).toBe('production');
    expect(config.APP_URL).toBe('https://puntoburger.com.ar');
    expect(config.SUPABASE_PUBLISHABLE_KEY).toBe('pk_test_123');
    expect(config.SUPABASE_SECRET_KEY).toBe('sk_test_456');
  });

  it('should reject invalid APP_URL', () => {
    expect(() =>
      validateEnv({
        APP_URL: 'not-a-valid-url',
      })
    ).toThrow('Configuración de variables de entorno inválida.');
  });
});
