import { createHmac, timingSafeEqual } from 'node:crypto';

// Alfabeto de 32 caracteres legible y sin ambigüedades visuales (sin 0, O, 1, I, L)
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const CODE_LENGTH = 5;

// Parámetros temporales estándar de Punto Burger
export const ACCESS_CODE_WINDOW_SECONDS = 300; // 5 minutos por rotación
export const ACCESS_CODE_GRACE_SECONDS = 45; // 45 segundos de gracia para código anterior
export const ACCESS_CODE_WINDOW_MS = ACCESS_CODE_WINDOW_SECONDS * 1000;
export const ACCESS_CODE_GRACE_MS = ACCESS_CODE_GRACE_SECONDS * 1000;

export interface AccessCodeDetails {
  code: string;
  venueId: string;
  windowIndex: number;
  validFrom: Date;
  validUntil: Date;
  graceUntil: Date;
}

export type AccessCodeValidationResult =
  | { isValid: true; reason: 'current_window' | 'grace_period' }
  | { isValid: false; reason: 'invalid_code' | 'expired_grace' };

/**
 * Deriva un código HMAC determinístico de 5 caracteres para un venue y ventana temporal dados.
 */
export function deriveCodeForWindow(venueId: string, windowIndex: number, secret: string): string {
  if (!venueId || !secret) {
    throw new Error('venueId y secret son obligatorios para generar el código temporal.');
  }

  const message = `${venueId.trim()}:${windowIndex}`;
  const hmac = createHmac('sha256', secret.trim()).update(message).digest();

  // Tomamos los primeros 4 bytes como entero sin signo de 32 bits
  let num = hmac.readUInt32BE(0);
  let code = '';

  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[num % ALPHABET.length];
    num = Math.floor(num / ALPHABET.length);
  }

  return code;
}

/**
 * Genera la información completa del código vigente para un local en un instante dado.
 * Utilizado para mostrar el código en pantallas físicas y verificar su vigencia.
 */
export function getCurrentVenueAccessCode(
  venueId: string,
  secret: string,
  timestampMs = Date.now()
): AccessCodeDetails {
  const windowIndex = Math.floor(timestampMs / ACCESS_CODE_WINDOW_MS);
  const code = deriveCodeForWindow(venueId, windowIndex, secret);
  const validFrom = new Date(windowIndex * ACCESS_CODE_WINDOW_MS);
  const validUntil = new Date((windowIndex + 1) * ACCESS_CODE_WINDOW_MS);
  const graceUntil = new Date((windowIndex + 1) * ACCESS_CODE_WINDOW_MS + ACCESS_CODE_GRACE_MS);

  return {
    code,
    venueId,
    windowIndex,
    validFrom,
    validUntil,
    graceUntil,
  };
}

/**
 * Valida un código de mesa ingresado por un cliente.
 * Acepta:
 * 1. Código de la ventana actual.
 * 2. Código de la ventana inmediatamente anterior SI Y SOLO SI está dentro del período de gracia (45 s).
 */
export function validateVenueAccessCode(
  venueId: string,
  inputCode: string,
  secret: string,
  timestampMs = Date.now()
): AccessCodeValidationResult {
  if (!inputCode || !venueId || !secret) {
    return { isValid: false, reason: 'invalid_code' };
  }

  const normalizedInput = inputCode.trim().toUpperCase();
  if (normalizedInput.length !== CODE_LENGTH) {
    return { isValid: false, reason: 'invalid_code' };
  }

  const currentWindowIndex = Math.floor(timestampMs / ACCESS_CODE_WINDOW_MS);
  const currentExpected = deriveCodeForWindow(venueId, currentWindowIndex, secret);

  // 1. Verificación contra ventana actual
  if (secureCompare(normalizedInput, currentExpected)) {
    return { isValid: true, reason: 'current_window' };
  }

  // 2. Verificación contra ventana anterior (período de gracia)
  const elapsedInCurrentWindow = timestampMs - currentWindowIndex * ACCESS_CODE_WINDOW_MS;
  const isWithinGrace = elapsedInCurrentWindow <= ACCESS_CODE_GRACE_MS;

  if (isWithinGrace) {
    const previousWindowIndex = currentWindowIndex - 1;
    const previousExpected = deriveCodeForWindow(venueId, previousWindowIndex, secret);

    if (secureCompare(normalizedInput, previousExpected)) {
      return { isValid: true, reason: 'grace_period' };
    }
  }

  return {
    isValid: false,
    reason: isWithinGrace ? 'invalid_code' : 'expired_grace',
  };
}

/**
 * Comparación en tiempo constante para mitigar timing attacks.
 */
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return timingSafeEqual(bufA, bufB);
}
