import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';
import * as triviaModule from '@/modules/trivia';
import { TABLE_SESSION_COOKIE_NAME } from '@/modules/sessions';

vi.mock('@/db/client', () => ({
  getDb: vi.fn(() => ({})),
}));

describe('POST /api/v1/sessions/close Route Handler', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('responde HTTP 401 si no se envía la cookie de sesión', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/sessions/close', {
      method: 'POST',
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.ok).toBe(false);
  });

  it('responde HTTP 200 y elimina la cookie de sesión al cerrar exitosamente', async () => {
    vi.spyOn(triviaModule, 'closeTableSession').mockResolvedValue({
      ok: true,
      message: 'Sesión finalizada con éxito.',
      next: '/',
    });

    const request = new NextRequest('http://localhost:3000/api/v1/sessions/close', {
      method: 'POST',
      headers: {
        cookie: `${TABLE_SESSION_COOKIE_NAME}=token_abc`,
      },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.next).toBe('/');

    // Verificar que la cookie fue eliminada en los headers
    const setCookie = response.headers.get('set-cookie');
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain(`${TABLE_SESSION_COOKIE_NAME}=`);
  });
});
