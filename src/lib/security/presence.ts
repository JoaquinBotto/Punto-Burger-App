import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '@/lib/env';

export const VENUE_PRESENCE_COOKIE_NAME = 'pb_venue_presence';

export interface PresencePayload {
  venueId: string;
  issuedAt: number; // seconds
  expiresAt: number; // seconds
}

export interface PresenceCheckResult {
  mode: 'off' | 'observe' | 'enforce';
  verified: boolean;
  required: boolean;
  expiresAt?: string;
  reason?: string;
}

/**
 * Obtiene la clave secreta de firma HMAC para tokens de presencia.
 */
function getPresenceSecret(): string {
  return (
    process.env.VENUE_PRESENCE_SECRET ||
    process.env.SESSION_SECRET ||
    'punto_burger_default_presence_secret_key_32_chars!'
  );
}

/**
 * Extrae la IP real del cliente respetando estrictamente el encabezado
 * inyectado y sobreescrito por Nginx (X-PB-Client-IP).
 */
export function getClientIp(headers: Headers): string {
  const pbIp = headers.get('x-pb-client-ip');
  if (pbIp && pbIp.trim() !== '') {
    return pbIp.trim();
  }

  const forwarded = headers.get('x-forwarded-for');
  if (forwarded && forwarded.trim() !== '') {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }

  const realIp = headers.get('x-real-ip');
  if (realIp && realIp.trim() !== '') {
    return realIp.trim();
  }

  return '127.0.0.1';
}

/**
 * Comprueba si una dirección IP IPv4 pertenece a un rango CIDR.
 */
function isIpv4InCidr(ip: string, cidr: string): boolean {
  const [rangeIp, prefixStr] = cidr.split('/');
  if (!rangeIp || !prefixStr) return false;

  const prefix = parseInt(prefixStr, 10);
  if (isNaN(prefix) || prefix < 0 || prefix > 32) return false;

  const ipToLong = (dot: string) => {
    const parts = dot.split('.').map((p) => parseInt(p, 10));
    if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) return null;
    return (((parts[0]! << 24) >>> 0) + (parts[1]! << 16) + (parts[2]! << 8) + parts[3]!) >>> 0;
  };

  const ipLong = ipToLong(ip);
  const rangeLong = ipToLong(rangeIp);
  if (ipLong === null || rangeLong === null) return false;

  const mask = prefix === 0 ? 0 : ((0xffffffff << (32 - prefix)) >>> 0) >>> 0;
  return (ipLong & mask) === (rangeLong & mask);
}

/**
 * Comprueba si la IP de un cliente está incluida en la lista permitida de IPs públicas del local.
 */
export function isIpAllowed(clientIp: string, allowedListRaw: string): boolean {
  if (!allowedListRaw || allowedListRaw.trim() === '') {
    return false;
  }

  const trimmedIp = clientIp.trim();
  const allowedEntries = allowedListRaw
    .split(',')
    .map((e) => e.trim())
    .filter((e) => e.length > 0);

  for (const entry of allowedEntries) {
    if (entry.includes('/')) {
      if (isIpv4InCidr(trimmedIp, entry)) {
        return true;
      }
    } else if (entry.toLowerCase() === trimmedIp.toLowerCase()) {
      return true;
    }
  }

  return false;
}

/**
 * Firma un payload de presencia generando un token seguro codificado en Base64URL.
 */
export function signPresenceToken(payload: PresencePayload): string {
  const secret = getPresenceSecret();
  const serialized = JSON.stringify(payload);
  const dataB64 = Buffer.from(serialized, 'utf-8').toString('base64url');
  const signature = createHmac('sha256', secret).update(dataB64).digest('base64url');
  return `${dataB64}.${signature}`;
}

/**
 * Verifica la firma y vigencia temporal de un token de presencia.
 */
export function verifyPresenceToken(
  token: string,
  expectedVenueId?: string
): PresencePayload | null {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [dataB64, signature] = parts;
  if (!dataB64 || !signature) return null;

  const secret = getPresenceSecret();
  const expectedSignature = createHmac('sha256', secret).update(dataB64).digest('base64url');

  const sigBuffer = Buffer.from(signature);
  const expBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(sigBuffer, expBuffer)) {
    return null;
  }

  try {
    const jsonStr = Buffer.from(dataB64, 'base64url').toString('utf-8');
    const payload = JSON.parse(jsonStr) as PresencePayload;

    if (!payload.venueId || !payload.issuedAt || !payload.expiresAt) {
      return null;
    }

    if (expectedVenueId && payload.venueId !== expectedVenueId) {
      return null;
    }

    const nowSec = Math.floor(Date.now() / 1000);
    if (nowSec > payload.expiresAt) {
      return null; // Token expirado
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Evalúa el estado de presencia para una petición HTTP.
 */
export function checkPresence(
  headers: Headers,
  cookies: { get(name: string): { value: string } | undefined },
  venueId?: string
): PresenceCheckResult {
  const mode = env.VENUE_PRESENCE_MODE;

  if (mode === 'off') {
    return {
      mode: 'off',
      verified: true,
      required: false,
    };
  }

  // Comprobar token en cookie
  const presenceCookie = cookies.get(VENUE_PRESENCE_COOKIE_NAME)?.value;
  let validPayload: PresencePayload | null = null;

  if (presenceCookie) {
    validPayload = verifyPresenceToken(presenceCookie, venueId);
  }

  // Comprobar IP actual
  const clientIp = getClientIp(headers);
  const ipAllowed = isIpAllowed(clientIp, env.VENUE_ALLOWED_PUBLIC_IPS);

  const isVerified = Boolean(validPayload || ipAllowed);

  if (mode === 'observe') {
    return {
      mode: 'observe',
      verified: isVerified,
      required: false,
      expiresAt: validPayload ? new Date(validPayload.expiresAt * 1000).toISOString() : undefined,
    };
  }

  // mode === 'enforce'
  return {
    mode: 'enforce',
    verified: isVerified,
    required: true,
    expiresAt: validPayload ? new Date(validPayload.expiresAt * 1000).toISOString() : undefined,
    reason: isVerified ? undefined : 'Conectate al Wi-Fi de Punto Burger para continuar jugando.',
  };
}

/**
 * Emite un nuevo token de presencia para un local.
 */
export function issuePresenceToken(
  venueId: string,
  ttlSeconds: number = env.VENUE_PRESENCE_TOKEN_TTL_SECONDS
): {
  token: string;
  expiresAt: Date;
  cookieOptions: {
    name: string;
    value: string;
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'lax';
    path: string;
    maxAge: number;
  };
} {
  const nowSec = Math.floor(Date.now() / 1000);
  const expiresAtSec = nowSec + ttlSeconds;
  const expiresAt = new Date(expiresAtSec * 1000);

  const payload: PresencePayload = {
    venueId,
    issuedAt: nowSec,
    expiresAt: expiresAtSec,
  };

  const token = signPresenceToken(payload);

  return {
    token,
    expiresAt,
    cookieOptions: {
      name: VENUE_PRESENCE_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: ttlSeconds,
    },
  };
}
