import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { TABLE_SESSION_COOKIE_NAME } from '@/modules/sessions';
import { DomainError, getPlaySetupData, saveGameSetup } from '@/modules/groups';

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get(TABLE_SESSION_COOKIE_NAME)?.value;
  const db = getDb();

  const data = await getPlaySetupData(db, sessionCookie);
  if (!data) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: 'No se encontró una sesión activa válida.',
        },
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ok: true,
    data,
  });
}

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'INVALID_REQUEST_BODY',
          message: 'El cuerpo de la solicitud debe ser un formato JSON válido.',
        },
      },
      { status: 400 }
    );
  }

  const db = getDb();

  try {
    const result = await saveGameSetup(db, sessionCookie, body);

    return NextResponse.json(
      {
        ok: true,
        group: result.group,
        participants: result.participants,
        gameSession: result.gameSession,
        next: result.next,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          Pragma: 'no-cache',
        },
      }
    );
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
    console.error('Error no controlado en /api/v1/games/setup:', message);

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'SETUP_CREATION_FAILED',
          message: 'Ocurrió un error inesperado al guardar la configuración del equipo.',
        },
      },
      { status: 500 }
    );
  }
}
