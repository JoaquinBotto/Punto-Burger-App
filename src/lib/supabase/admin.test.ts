import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getSupabaseAdmin } from './admin';

describe('Supabase admin client helper', () => {
  const origUrl = process.env.SUPABASE_URL;
  const origSecretKey = process.env.SUPABASE_SECRET_KEY;

  beforeEach(() => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SECRET_KEY;
  });

  afterEach(() => {
    process.env.SUPABASE_URL = origUrl;
    process.env.SUPABASE_SECRET_KEY = origSecretKey;
  });

  it('throws an error if credentials are missing', () => {
    expect(() => getSupabaseAdmin()).toThrowError(/SUPABASE_URL y SUPABASE_SECRET_KEY/);
  });
});
