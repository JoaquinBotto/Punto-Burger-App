import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

vi.mock('@/db/client', () => ({
  getDb: vi.fn().mockReturnValue({}),
}));

vi.mock('@/modules/sessions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/modules/sessions')>();
  return {
    ...actual,
    claimTableSession: vi.fn(),
  };
});

describe('POST /api/v1/tables/claim Route Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rechaza solicitud con cuerpo malformado', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/tables/claim', {
      method: 'POST',
      body: 'invalid-json',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('INVALID_REQUEST_BODY');
  });

  it('rechaza solicitud sin los campos requeridos', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/tables/claim', {
      method: 'POST',
      body: JSON.stringify({ tableCode: '' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('INVALID_INPUT');
  });

  it('procesa claim exitoso y emite cookie HttpOnly segura', async () => {
    const { claimTableSession } = await import('@/modules/sessions');
    vi.mocked(claimTableSession).mockResolvedValue({
      ok: true,
      session: {
        table: 'Mesa 01',
        status: 'active',
        expiresAt: '2026-11-25T13:30:00.000Z',
      },
      next: '/play/setup',
      rawDeviceToken: 'token1234567890abcdef',
    });

    const req = new NextRequest('http://localhost:3000/api/v1/tables/claim', {
      method: 'POST',
      body: JSON.stringify({
        tableCode: 'mesa-01',
        accessCode: '7HK9P',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.session.table).toBe('Mesa 01');
    expect(json.next).toBe('/play/setup');

    // Cookie emitida
    const cookie = res.cookies.get('pb_table_session');
    expect(cookie).toBeDefined();
    expect(cookie?.value).toBe('token1234567890abcdef');
    expect(cookie?.httpOnly).toBe(true);
    expect(String(cookie?.sameSite).toLowerCase()).toBe('lax');
    expect(cookie?.path).toBe('/');
  });

  it('sanitiza errores y no expone detalles internos de SQL o stack traces', async () => {
    const { claimTableSession } = await import('@/modules/sessions');
    vi.mocked(claimTableSession).mockRejectedValue(
      new Error('SELECT * FROM tables WHERE query failed due to internal error')
    );

    const req = new NextRequest('http://localhost:3000/api/v1/tables/claim', {
      method: 'POST',
      body: JSON.stringify({
        tableCode: 'mesa-01',
        accessCode: '7HK9P',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('SESSION_CREATION_FAILED');
    expect(json.error.message).not.toContain('SELECT');
    expect(json.error.message).not.toContain('tables');
  });
});
