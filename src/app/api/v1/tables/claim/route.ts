import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db/client';
import {
  claimTableSession,
  TABLE_SESSION_COOKIE_NAME,
  getTableSessionCookieOptions,
  SessionError,
} from '@/modules/sessions';
import { TableError } from '@/modules/tables';

const claimSchema = z.object({
  tableCode: z
    .string({ required_error: 'El código de mesa es obligatorio.' })
    .trim()
    .min(1, 'El código de mesa no puede estar vacío.'),
  accessCode: z
    .string({ required_error: 'El código temporal es obligatorio.' })
    .trim()
    .length(5, 'El código temporal debe tener exactamente 5 caracteres.')
    .transform((val) => val.toUpperCase()),
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

  const parseResult = claimSchema.safeParse(body);
  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message || 'Datos de solicitud inválidos.';
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

  // Extraer IP del cliente para el limitador de tasa
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const clientIp = forwardedFor ? (forwardedFor.split(',')[0] ?? '').trim() : realIp || '127.0.0.1';

  // Extraer cookie de sesión previa si existe
  const existingCookieToken = request.cookies.get(TABLE_SESSION_COOKIE_NAME)?.value;

  try {
    const db = getDb();
    const result = await claimTableSession(db, parseResult.data, existingCookieToken, clientIp);

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

    // Sanitización estricta: nunca filtrar errores internos, SQL ni stack traces
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error no controlado en /api/v1/tables/claim:', message);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'SESSION_CREATION_FAILED',
          message: 'Ocurrió un error inesperado al procesar la conexión con la mesa.',
        },
      },
      { status: 500 }
    );
  }
}
