import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { TABLE_SESSION_COOKIE_NAME } from '@/modules/sessions';
import { DomainError, closeTableSession } from '@/modules/trivia';

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
    const result = await closeTableSession(db, sessionCookie);

    const response = NextResponse.json(result, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        Pragma: 'no-cache',
      },
    });

    // Eliminar la cookie oficial de sesión de mesa
    response.cookies.delete(TABLE_SESSION_COOKIE_NAME);

    return response;
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
    console.error('Error no controlado en /api/v1/sessions/close:', message);

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'SESSION_CLOSE_FAILED',
          message: 'Ocurrió un error inesperado al finalizar la sesión.',
        },
      },
      { status: 500 }
    );
  }
}
