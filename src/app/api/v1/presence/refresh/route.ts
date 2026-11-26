import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { getClientIp, isIpAllowed, issuePresenceToken } from '@/lib/security/presence';
import { getDb } from '@/db/client';
import { venues } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const mode = env.VENUE_PRESENCE_MODE;
  const clientIp = getClientIp(request.headers);
  const allowed = isIpAllowed(clientIp, env.VENUE_ALLOWED_PUBLIC_IPS);

  // Si el modo es off, la presencia siempre está verificada
  const isPermitted = mode === 'off' || allowed;

  if (!isPermitted) {
    return NextResponse.json(
      {
        ok: false,
        verified: false,
        error: {
          code: 'PRESENCE_NOT_ALLOWED',
          message: 'Conectate al Wi-Fi de Punto Burger para continuar jugando.',
        },
      },
      {
        status: 403,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  }

  // Obtener venue default si no viene especificado
  const db = getDb();
  const [defaultVenue] = await db
    .select({ id: venues.id })
    .from(venues)
    .where(eq(venues.slug, 'esperanza-central'))
    .limit(1);

  const venueId = defaultVenue?.id || '00000000-0000-0000-0000-000000000001';
  const { expiresAt, cookieOptions } = issuePresenceToken(venueId);

  const response = NextResponse.json(
    {
      ok: true,
      verified: true,
      expiresAt: expiresAt.toISOString(),
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    }
  );

  response.cookies.set({
    name: cookieOptions.name,
    value: cookieOptions.value,
    httpOnly: cookieOptions.httpOnly,
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
    path: cookieOptions.path,
    maxAge: cookieOptions.maxAge,
  });

  return response;
}
