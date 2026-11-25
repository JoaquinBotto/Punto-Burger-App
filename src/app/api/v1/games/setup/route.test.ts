import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from './route';
import * as groupsService from '@/modules/groups/groups.service';
import { GroupNameInvalidError } from '@/modules/groups/errors';

vi.mock('@/db/client', () => ({
  getDb: vi.fn(() => ({})),
}));

describe('POST & GET /api/v1/games/setup Route Handler', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const validPayload = {
    groupName: 'Los Bacon',
    participants: [{ alias: 'Joaco', ageRange: 'adult', educationLevel: 'higher' }],
    categorySlug: 'deportes',
  };

  it('GET /api/v1/games/setup devuelve 401 si no hay sesión activa', async () => {
    vi.spyOn(groupsService, 'getPlaySetupData').mockResolvedValue(null);

    const request = new NextRequest('https://app.puntoburger.com.ar/api/v1/games/setup');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('SESSION_NOT_FOUND');
  });

  it('GET /api/v1/games/setup devuelve 200 con datos de setup si la sesión es válida', async () => {
    const mockData = {
      table: { id: 't-1', code: 'mesa-01', displayName: 'Mesa 01' },
      venue: { id: 'v-1', name: 'Esperanza', slug: 'esperanza-central' },
      categories: [],
      existingSetup: null,
    };
    vi.spyOn(groupsService, 'getPlaySetupData').mockResolvedValue(mockData);

    const request = new NextRequest('https://app.puntoburger.com.ar/api/v1/games/setup', {
      headers: { cookie: 'pb_table_session=token-123' },
    });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data).toEqual(mockData);
  });

  it('POST rechaza solicitudes sin cookie con HTTP 401', async () => {
    const request = new NextRequest('https://app.puntoburger.com.ar/api/v1/games/setup', {
      method: 'POST',
      body: JSON.stringify(validPayload),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('SESSION_NOT_FOUND');
  });

  it('POST rechaza JSON malformado con HTTP 400', async () => {
    const request = new NextRequest('https://app.puntoburger.com.ar/api/v1/games/setup', {
      method: 'POST',
      headers: { cookie: 'pb_table_session=valid-token' },
      body: 'invalid-json{',
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('INVALID_REQUEST_BODY');
  });

  it('POST guarda exitosamente la configuración y responde 200 OK con Cache-Control no-cache', async () => {
    vi.spyOn(groupsService, 'saveGameSetup').mockResolvedValue({
      ok: true,
      group: { id: 'g-1', name: 'Los Bacon' },
      participants: [
        { id: 'p-1', alias: 'Joaco', ageRange: 'adult', educationLevel: 'higher', position: 1 },
      ],
      gameSession: {
        id: 'gs-1',
        status: 'created',
        categoryId: 'c-1',
        categoryName: 'Deportes',
        categorySlug: 'deportes',
      },
      next: '/play/setup',
    });

    const request = new NextRequest('https://app.puntoburger.com.ar/api/v1/games/setup', {
      method: 'POST',
      headers: {
        cookie: 'pb_table_session=valid-token',
        'content-type': 'application/json',
      },
      body: JSON.stringify(validPayload),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.group.name).toBe('Los Bacon');
    expect(body.gameSession.status).toBe('created');
    expect(response.headers.get('cache-control')).toContain('no-store');
  });

  it('POST mapea errores de dominio a códigos HTTP adecuados', async () => {
    vi.spyOn(groupsService, 'saveGameSetup').mockRejectedValue(
      new GroupNameInvalidError('El nombre del equipo debe tener entre 2 y 30 caracteres.')
    );

    const request = new NextRequest('https://app.puntoburger.com.ar/api/v1/games/setup', {
      method: 'POST',
      headers: {
        cookie: 'pb_table_session=valid-token',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ ...validPayload, groupName: 'X' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('GROUP_NAME_INVALID');
  });

  it('POST sanitiza errores internos inesperados y responde HTTP 500 sin exponer SQL ni stack traces', async () => {
    vi.spyOn(groupsService, 'saveGameSetup').mockRejectedValue(
      new Error('SELECT * FROM groups failed with internal DB syntax error')
    );

    const request = new NextRequest('https://app.puntoburger.com.ar/api/v1/games/setup', {
      method: 'POST',
      headers: {
        cookie: 'pb_table_session=valid-token',
        'content-type': 'application/json',
      },
      body: JSON.stringify(validPayload),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('SETUP_CREATION_FAILED');
    expect(body.error.message).not.toContain('SELECT');
  });
});
