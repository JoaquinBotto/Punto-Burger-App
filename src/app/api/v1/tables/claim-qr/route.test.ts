import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';
import * as sessionsModule from '@/modules/sessions';
import * as clientModule from '@/db/client';
import { TableAlreadyInUseError, TableNotFoundError } from '@/modules/tables/errors';
import type { Database } from '@/db/client';

describe('POST /api/v1/tables/claim-qr', () => {
  const dummyDb = {} as Database;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(clientModule, 'getDb').mockReturnValue(dummyDb);
  });

  it('reclama una mesa exitosamente por qrToken y emite cookie', async () => {
    vi.spyOn(sessionsModule, 'claimTableSessionByQr').mockResolvedValue({
      ok: true,
      session: {
        table: 'Mesa 01',
        status: 'active',
        expiresAt: '2026-11-25T14:00:00.000Z',
      },
      next: '/play/setup',
      rawDeviceToken: 'super-secure-token',
    });

    const request = new NextRequest('http://localhost:3000/api/v1/tables/claim-qr', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ qrToken: 'qr-token-super-seguro-123' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.session.table).toBe('Mesa 01');
    expect(data.next).toBe('/play/setup');

    const cookieHeader = response.headers.get('set-cookie');
    expect(cookieHeader).toContain('pb_table_session=super-secure-token');
    expect(cookieHeader).toContain('HttpOnly');
  });

  it('rechaza si el cuerpo es inválido o el qrToken es demasiado corto', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/tables/claim-qr', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ qrToken: 'short' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.ok).toBe(false);
    expect(data.error.code).toBe('INVALID_INPUT');
  });

  it('retorna 404 si la mesa no existe para el qrToken', async () => {
    vi.spyOn(sessionsModule, 'claimTableSessionByQr').mockRejectedValue(
      new TableNotFoundError('Mesa no encontrada con el código QR provisto.')
    );

    const request = new NextRequest('http://localhost:3000/api/v1/tables/claim-qr', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ qrToken: 'token-inexistente-123456' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data.ok).toBe(false);
    expect(data.error.code).toBe('TABLE_NOT_FOUND');
  });

  it('retorna 409 si la mesa ya está en uso', async () => {
    vi.spyOn(sessionsModule, 'claimTableSessionByQr').mockRejectedValue(
      new TableAlreadyInUseError()
    );

    const request = new NextRequest('http://localhost:3000/api/v1/tables/claim-qr', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ qrToken: 'token-ocupada-123456' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(409);

    const data = await response.json();
    expect(data.ok).toBe(false);
    expect(data.error.code).toBe('TABLE_ALREADY_IN_USE');
  });
});
