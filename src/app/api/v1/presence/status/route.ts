import { NextRequest, NextResponse } from 'next/server';
import { checkPresence } from '@/lib/security/presence';

export async function GET(request: NextRequest) {
  const result = checkPresence(request.headers, request.cookies);

  return NextResponse.json(
    {
      ok: true,
      status: {
        mode: result.mode,
        verified: result.verified,
        required: result.required,
      },
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        Pragma: 'no-cache',
      },
    }
  );
}
