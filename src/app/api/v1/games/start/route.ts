import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { TABLE_SESSION_COOKIE_NAME } from '@/modules/sessions';
import { DomainError, startGame } from '@/modules/trivia';
import { assertCompetitionPresence } from '@/modules/competitions';

export async function POST(request: NextRequest) {
  const sessionCookie = request.cookies.get(TABLE_SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie || sessionCookie.trim() === '') {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message:
            'No se encontró una sesión activa. Escaneá el código QR de tu mesa para comenzar.',
        },
      },
      { status: 401 }
    );
  }

  const db = getDb();

  try {
    await assertCompetitionPresence(db, sessionCookie, request.headers, request.cookies);
    const result = await startGame(db, sessionCookie);

    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        Pragma: 'no-cache',
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
    console.error('Error no controlado en /api/v1/games/start:', message);

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'GAME_START_FAILED',
          message: 'Ocurrió un error inesperado al iniciar la partida.',
        },
      },
      { status: 500 }
    );
  }
}
