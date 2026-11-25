import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkRateLimit,
  recordRateLimitFailure,
  recordRateLimitSuccess,
  resetRateLimiter,
} from './rate-limiter';

describe('sessions - rate limiter en memoria', () => {
  beforeEach(() => {
    resetRateLimiter();
  });

  it('permite solicitudes iniciales sin intentos fallidos', () => {
    const status = checkRateLimit('192.168.1.1:mesa-01');
    expect(status.allowed).toBe(true);
    expect(status.remainingAttempts).toBe(5);
  });

  it('decrementa intentos restantes tras cada falla', () => {
    const key = '192.168.1.1:mesa-01';
    recordRateLimitFailure(key);
    recordRateLimitFailure(key);

    const status = checkRateLimit(key);
    expect(status.allowed).toBe(true);
    expect(status.remainingAttempts).toBe(3);
  });

  it('bloquea al alcanzar 5 intentos fallidos', () => {
    const key = '192.168.1.1:mesa-01';
    for (let i = 0; i < 5; i++) {
      recordRateLimitFailure(key);
    }

    const status = checkRateLimit(key);
    expect(status.allowed).toBe(false);
    expect(status.remainingAttempts).toBe(0);
    expect(status.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('éxito limpia el registro de fallas', () => {
    const key = '192.168.1.1:mesa-01';
    recordRateLimitFailure(key);
    recordRateLimitFailure(key);
    recordRateLimitSuccess(key);

    const status = checkRateLimit(key);
    expect(status.allowed).toBe(true);
    expect(status.remainingAttempts).toBe(5);
  });
});
