import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { TABLE_SESSION_COOKIE_NAME } from '@/modules/sessions';
import { getTableDailyRankingFromSessionCookie } from '@/modules/rankings';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const rawCookieToken = request.cookies.get(TABLE_SESSION_COOKIE_NAME)?.value;

    const db = getDb();
    const context = await getTableDailyRankingFromSessionCookie(db, rawCookieToken);

    return NextResponse.json(
      {
        ok: true,
        ...context,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Error al consultar el ranking contextual de mesa:', error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'RANKING_ME_ERROR',
          message: 'No se pudo obtener la posición de la mesa.',
        },
      },
      { status: 500 }
    );
  }
}
