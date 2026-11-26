import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { joinCompetition } from '@/modules/competitions';
import { TABLE_SESSION_COOKIE_NAME } from '@/modules/sessions';
import { DomainError } from '@/modules/trivia/errors';

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get(TABLE_SESSION_COOKIE_NAME)?.value;
  if (!sessionToken || sessionToken.trim() === '') {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: 'No se encontró una sesión activa de mesa.',
        },
      },
      { status: 401 }
    );
  }

  const db = getDb();

  try {
    const result = await joinCompetition(db, sessionToken, {
      headers: request.headers,
      cookies: request.cookies,
    });

    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    });
  } catch (error: unknown) {
    if (error instanceof DomainError) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: error.statusCode }
      );
    }

    const message = error instanceof Error ? error.message : String(error);
    console.error('Error no controlado en /api/v1/competitions/current/join:', message);

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'COMPETITION_JOIN_FAILED',
          message: 'No fue posible inscribirse en la competencia de hoy.',
        },
      },
      { status: 500 }
    );
  }
}
