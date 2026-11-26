import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { getCompetitionState } from '@/modules/competitions';
import { TABLE_SESSION_COOKIE_NAME } from '@/modules/sessions';

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get(TABLE_SESSION_COOKIE_NAME)?.value;
  const db = getDb();

  try {
    const state = await getCompetitionState(db, sessionToken, {
      headers: request.headers,
      cookies: request.cookies,
    });

    return NextResponse.json(
      {
        ok: true,
        ...state,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error en /api/v1/competitions/current/state:', message);

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'COMPETITION_STATE_FAILED',
          message: 'No fue posible obtener el estado de la competencia.',
        },
      },
      { status: 500 }
    );
  }
}
