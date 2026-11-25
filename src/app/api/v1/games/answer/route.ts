import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { TABLE_SESSION_COOKIE_NAME } from '@/modules/sessions';
import { DomainError, submitAnswer } from '@/modules/trivia';

const answerSchema = z.object({
  selectedOption: z.enum(['A', 'B', 'C', 'D'], {
    errorMap: () => ({ message: 'La opción de respuesta debe ser A, B, C o D.' }),
  }),
});

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

  const parseResult = answerSchema.safeParse(body);
  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message || 'Opción inválida.';
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: firstError,
        },
      },
      { status: 400 }
    );
  }

  const db = getDb();

  try {
    const result = await submitAnswer(db, sessionCookie, parseResult.data.selectedOption);

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
    console.error('Error no controlado en /api/v1/games/answer:', message);

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'GAME_ANSWER_FAILED',
          message: 'Ocurrió un error inesperado al procesar la respuesta.',
        },
      },
      { status: 500 }
    );
  }
}
