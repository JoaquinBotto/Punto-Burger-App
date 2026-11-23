import { describe, it, expect } from 'vitest';
import { calculateRemainingSeconds, formatSecondsToMinutes } from './index';

describe('calculateRemainingSeconds', () => {
  it('should calculate remaining seconds accurately', () => {
    const now = 1000000;
    const expiresAt = now + 15400; // 15.4 seconds left
    expect(calculateRemainingSeconds(expiresAt, now)).toBe(16);
  });

  it('should return 0 when time has expired', () => {
    const now = 1000000;
    const expiresAt = now - 5000;
    expect(calculateRemainingSeconds(expiresAt, now)).toBe(0);
  });

  it('should return 0 when exact match', () => {
    const now = 1000000;
    expect(calculateRemainingSeconds(now, now)).toBe(0);
  });
});

describe('formatSecondsToMinutes', () => {
  it('should format 0 seconds to 00:00', () => {
    expect(formatSecondsToMinutes(0)).toBe('00:00');
  });

  it('should format 65 seconds to 01:05', () => {
    expect(formatSecondsToMinutes(65)).toBe('01:05');
  });

  it('should handle negative numbers gracefully', () => {
    expect(formatSecondsToMinutes(-10)).toBe('00:00');
  });
});
