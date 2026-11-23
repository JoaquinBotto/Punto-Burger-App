import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Genera un hash SHA-256 seguro a partir de un token o código en texto plano.
 * Utilizado para no almacenar nunca códigos temporales ni tokens de control en claro.
 */
export function hashToken(token: string): string {
  if (!token) {
    throw new Error('El token a hashear no puede estar vacío.');
  }
  return createHash('sha256').update(token.trim()).digest('hex');
}

/**
 * Compara un token en texto plano con un hash almacenado de forma segura contra timing attacks.
 */
export function compareTokens(plainToken: string, storedHash: string): boolean {
  if (!plainToken || !storedHash) {
    return false;
  }
  const computedHash = hashToken(plainToken);
  const bufferA = Buffer.from(computedHash, 'hex');
  const bufferB = Buffer.from(storedHash, 'hex');

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return timingSafeEqual(bufferA, bufferB);
}
