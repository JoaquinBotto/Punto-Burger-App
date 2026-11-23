import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getSupabaseAdmin } from './admin';

describe('Supabase admin client helper', () => {
  const origUrl = process.env.SUPABASE_URL;
  const origKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  beforeEach(() => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  afterEach(() => {
    process.env.SUPABASE_URL = origUrl;
    process.env.SUPABASE_SERVICE_ROLE_KEY = origKey;
  });

  it('throws an error if credentials are missing', () => {
    expect(() => getSupabaseAdmin()).toThrowError(/SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY/);
  });
});
