/**
 * Rate Limiter en Memoria para Protección de Códigos Temporales (PPA-010)
 *
 * NOTA DE ARQUITECTURA:
 * Este limitador en memoria es adecuado y válido para el prototipo con instancia única
 * en DonWeb Cloud Server supervisada por PM2.
 * Si en el futuro la aplicación escala horizontalmente a múltiples procesos de PM2 en cluster
 * o servidores independientes, este almacén deberá migrarse a almacenamiento compartido (Redis o tabla de base de datos).
 */

interface AttemptRecord {
  count: number;
  firstAttemptAt: number;
  blockedUntil?: number;
}

const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_DURATION_MS = 5 * 60 * 1000; // Ventana de 5 minutos
const BLOCK_DURATION_MS = 5 * 60 * 1000; // Bloqueo de 5 minutos

const attemptsMap = new Map<string, AttemptRecord>();

export function checkRateLimit(
  key: string,
  now = Date.now()
): {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSeconds?: number;
} {
  const record = attemptsMap.get(key);

  if (!record) {
    return { allowed: true, remainingAttempts: MAX_FAILED_ATTEMPTS };
  }

  // Verificar si está en período de bloqueo
  if (record.blockedUntil && record.blockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.blockedUntil - now) / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSeconds };
  }

  // Si la ventana expiró, reiniciar conteo
  if (now - record.firstAttemptAt > WINDOW_DURATION_MS) {
    attemptsMap.delete(key);
    return { allowed: true, remainingAttempts: MAX_FAILED_ATTEMPTS };
  }

  const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - record.count);
  return { allowed: remaining > 0, remainingAttempts: remaining };
}

export function recordRateLimitFailure(key: string, now = Date.now()): void {
  const record = attemptsMap.get(key);

  if (!record || now - record.firstAttemptAt > WINDOW_DURATION_MS) {
    attemptsMap.set(key, {
      count: 1,
      firstAttemptAt: now,
    });
    return;
  }

  record.count += 1;
  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
  }
}

export function recordRateLimitSuccess(key: string): void {
  attemptsMap.delete(key);
}

export function resetRateLimiter(): void {
  attemptsMap.clear();
}
