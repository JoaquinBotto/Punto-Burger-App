import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db/client';
import {
  claimTableSessionByQr,
  TABLE_SESSION_COOKIE_NAME,
  getTableSessionCookieOptions,
  SessionError,
} from '@/modules/sessions';
import { TableError } from '@/modules/tables';

const claimQrSchema = z.object({
  qrToken: z
    .string({ required_error: 'El token QR es obligatorio.' })
    .trim()
    .min(10, 'El token QR no es válido.'),
});

export async function POST(request: NextRequest) {
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

  const parseResult = claimQrSchema.safeParse(body);
  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message || 'Token QR inválido.';
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

  // Extraer IP del cliente
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const clientIp = forwardedFor ? (forwardedFor.split(',')[0] ?? '').trim() : realIp || '127.0.0.1';

  // Extraer cookie de sesión previa si existe
  const existingCookieToken = request.cookies.get(TABLE_SESSION_COOKIE_NAME)?.value;

  try {
    const db = getDb();
    const result = await claimTableSessionByQr(db, parseResult.data, existingCookieToken, clientIp);

    const response = NextResponse.json({
      ok: true,
      session: result.session,
      next: result.next,
    });

    // Asignar cookie segura al navegador
    response.cookies.set(
      TABLE_SESSION_COOKIE_NAME,
      result.rawDeviceToken,
      getTableSessionCookieOptions()
    );

    return response;
  } catch (error: unknown) {
    if (error instanceof TableError || error instanceof SessionError) {
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
    console.error('Error no controlado en /api/v1/tables/claim-qr:', message);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Ocurrió un error inesperado al procesar la solicitud.',
        },
      },
      { status: 500 }
    );
  }
}
