import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDatabaseUrl, getDb } from './client';

describe('Database client configuration & error handling', () => {
  const originalEnv = process.env.DATABASE_URL;

  beforeEach(() => {
    delete process.env.DATABASE_URL;
  });

  afterEach(() => {
    process.env.DATABASE_URL = originalEnv;
  });

  it('throws an informative error if DATABASE_URL is missing when accessing getDatabaseUrl', () => {
    expect(() => getDatabaseUrl()).toThrowError(
      /DATABASE_URL no está configurada\. Configure la variable de entorno DATABASE_URL/
    );
  });

  it('throws an informative error when trying to initialize db without DATABASE_URL', () => {
    expect(() => getDb()).toThrowError(/DATABASE_URL no está configurada/);
  });

  it('returns trimmed URL when DATABASE_URL is configured', () => {
    process.env.DATABASE_URL = ' postgresql://test:test@localhost:5432/test ';
    expect(getDatabaseUrl()).toBe('postgresql://test:test@localhost:5432/test');
  });
});
