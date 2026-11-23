/**
 * Utilidades compartidas de Punto Burger
 */

/**
 * Calcula los segundos restantes entre la expiración y el momento actual.
 * Retorna 0 si ya expiró.
 */
export function calculateRemainingSeconds(expiresAtMs: number, nowMs: number = Date.now()): number {
  const diffMs = expiresAtMs - nowMs;
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / 1000);
}

/**
 * Formatea segundos a formato MM:SS
 */
export function formatSecondsToMinutes(seconds: number): string {
  const safeSec = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safeSec / 60);
  const remainingSecs = safeSec % 60;
  return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
}
