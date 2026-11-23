import { describe, it, expect } from 'vitest';
import {
  deriveCodeForWindow,
  getCurrentVenueAccessCode,
  validateVenueAccessCode,
  ACCESS_CODE_WINDOW_MS,
} from './access-codes';

describe('Deterministic HMAC Venue Access Code', () => {
  const secret = 'super-secure-access-code-secret-for-venues';
  const venueEsperanza = 'venue-esperanza-id-1234';
  const venueRafaela = 'venue-rafaela-id-5678';
  const baseTime = 1700000000000; // Instante fijo de prueba

  it('generates deterministic codes for the same venue and window', () => {
    const codeA = deriveCodeForWindow(venueEsperanza, 100, secret);
    const codeB = deriveCodeForWindow(venueEsperanza, 100, secret);
    expect(codeA).toBe(codeB);
    expect(codeA).toHaveLength(5);
  });

  it('generates different codes for different venues in the same window', () => {
    const codeA = deriveCodeForWindow(venueEsperanza, 100, secret);
    const codeB = deriveCodeForWindow(venueRafaela, 100, secret);
    expect(codeA).not.toBe(codeB);
  });

  it('generates different codes for consecutive time windows in the same venue', () => {
    const codeWindow1 = deriveCodeForWindow(venueEsperanza, 100, secret);
    const codeWindow2 = deriveCodeForWindow(venueEsperanza, 101, secret);
    expect(codeWindow1).not.toBe(codeWindow2);
  });

  it('validates the current active code successfully', () => {
    const currentInfo = getCurrentVenueAccessCode(venueEsperanza, secret, baseTime);
    const validation = validateVenueAccessCode(venueEsperanza, currentInfo.code, secret, baseTime);

    expect(validation.isValid).toBe(true);
    if (validation.isValid) {
      expect(validation.reason).toBe('current_window');
    }
  });

  it('validates the previous code when within the 45-second grace period', () => {
    // Calculamos el inicio de una nueva ventana
    const windowIndex = Math.floor(baseTime / ACCESS_CODE_WINDOW_MS);
    const startOfNextWindow = (windowIndex + 1) * ACCESS_CODE_WINDOW_MS;

    // Código de la ventana anterior
    const previousCode = deriveCodeForWindow(venueEsperanza, windowIndex, secret);

    // Momento de validación: 30 segundos dentro de la nueva ventana (dentro de gracia <= 45s)
    const testTimeWithinGrace = startOfNextWindow + 30 * 1000;

    const validation = validateVenueAccessCode(
      venueEsperanza,
      previousCode,
      secret,
      testTimeWithinGrace
    );

    expect(validation.isValid).toBe(true);
    if (validation.isValid) {
      expect(validation.reason).toBe('grace_period');
    }
  });

  it('rejects the previous code after the 45-second grace period has elapsed', () => {
    const windowIndex = Math.floor(baseTime / ACCESS_CODE_WINDOW_MS);
    const startOfNextWindow = (windowIndex + 1) * ACCESS_CODE_WINDOW_MS;

    const previousCode = deriveCodeForWindow(venueEsperanza, windowIndex, secret);

    // Momento de validación: 50 segundos dentro de la nueva ventana (superó los 45s de gracia)
    const testTimeAfterGrace = startOfNextWindow + 50 * 1000;

    const validation = validateVenueAccessCode(
      venueEsperanza,
      previousCode,
      secret,
      testTimeAfterGrace
    );

    expect(validation.isValid).toBe(false);
    if (!validation.isValid) {
      expect(validation.reason).toBe('expired_grace');
    }
  });

  it('rejects completely invalid codes or wrong lengths', () => {
    const res1 = validateVenueAccessCode(venueEsperanza, 'XXXXX', secret, baseTime);
    expect(res1.isValid).toBe(false);

    const res2 = validateVenueAccessCode(venueEsperanza, 'SHORT', secret, baseTime);
    expect(res2.isValid).toBe(false);

    const res3 = validateVenueAccessCode(venueEsperanza, '', secret, baseTime);
    expect(res3.isValid).toBe(false);
  });
});
