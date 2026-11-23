import { NextResponse } from 'next/server';

export interface HealthResponse {
  status: 'ok';
  service: string;
  timestamp: string;
}

export async function GET(): Promise<NextResponse<HealthResponse>> {
  return NextResponse.json(
    {
      status: 'ok',
      service: 'punto-burger-app',
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
