import { describe, it, expect } from 'vitest';
import { hashToken, compareTokens } from './tokens';

describe('Token security helpers', () => {
  it('generates a consistent sha256 hash for a given token', () => {
    const token = 'mesa-01-temp-token';
    const hash1 = hashToken(token);
    const hash2 = hashToken(token);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // sha256 in hex
  });

  it('correctly compares valid plaintext token with stored hash', () => {
    const raw = '123456';
    const hash = hashToken(raw);

    expect(compareTokens(raw, hash)).toBe(true);
    expect(compareTokens('654321', hash)).toBe(false);
  });

  it('rejects empty or invalid inputs', () => {
    expect(() => hashToken('')).toThrow();
    expect(compareTokens('', 'abc')).toBe(false);
    expect(compareTokens('123456', '')).toBe(false);
    expect(compareTokens('123456', 'short-invalid-hash')).toBe(false);
  });
});
