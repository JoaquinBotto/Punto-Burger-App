import { describe, it, expect } from 'vitest';
import { validateEnv } from './index';

describe('validateEnv', () => {
  it('should validate default environment without throwing', () => {
    const config = validateEnv({});
    expect(config.NODE_ENV).toBe('development');
    expect(config.APP_URL).toBe('http://localhost:3000');
  });

  it('should accept valid custom APP_URL', () => {
    const config = validateEnv({
      NODE_ENV: 'production',
      APP_URL: 'https://puntoburger.com.ar',
    });
    expect(config.NODE_ENV).toBe('production');
    expect(config.APP_URL).toBe('https://puntoburger.com.ar');
  });

  it('should reject invalid APP_URL', () => {
    expect(() =>
      validateEnv({
        APP_URL: 'not-a-valid-url',
      })
    ).toThrow('Configuración de variables de entorno inválida.');
  });
});
