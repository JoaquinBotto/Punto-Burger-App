import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';
import * as triviaModule from '@/modules/trivia';
import { TABLE_SESSION_COOKIE_NAME } from '@/modules/sessions';

vi.mock('@/db/client', () => ({
  getDb: vi.fn(() => ({})),
}));

describe('POST /api/v1/games/prepare Route Handler', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('responde HTTP 401 si no se envía la cookie de sesión de mesa', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/games/prepare', {
      method: 'POST',
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('SESSION_NOT_FOUND');
  });

  it('responde HTTP 200 con la metadata de la partida cuando prepareGame es exitoso', async () => {
    vi.spyOn(triviaModule, 'prepareGame').mockResolvedValue({
      ok: true,
      game: {
        status: 'created',
        prepared: true,
        questionCount: 10,
        category: {
          slug: 'deportes',
          name: 'Deportes',
        },
      },
      next: '/play',
    });

    const request = new NextRequest('http://localhost:3000/api/v1/games/prepare', {
      method: 'POST',
      headers: {
        cookie: `${TABLE_SESSION_COOKIE_NAME}=valid_token_123`,
      },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.game.prepared).toBe(true);
    expect(json.game.questionCount).toBe(10);
    expect(json.next).toBe('/play');

    // Comprobar que no se exponen opciones correctas ni explicaciones
    expect(json.game.correctOption).toBeUndefined();
    expect(json.game.correctOptionSnapshot).toBeUndefined();
    expect(json.game.questions).toBeUndefined();
  });

  it('mapea errores de dominio al código de estado HTTP correspondiente (ej: 400 para QUESTION_POOL_INSUFFICIENT)', async () => {
    vi.spyOn(triviaModule, 'prepareGame').mockRejectedValue(
      new triviaModule.QuestionPoolInsufficientError(
        'No hay suficientes preguntas en la categoría.'
      )
    );

    const request = new NextRequest('http://localhost:3000/api/v1/games/prepare', {
      method: 'POST',
      headers: {
        cookie: `${TABLE_SESSION_COOKIE_NAME}=valid_token_123`,
      },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('QUESTION_POOL_INSUFFICIENT');
  });

  it('sanitiza errores internos inesperados y responde HTTP 500 sin exponer detalles de SQL', async () => {
    vi.spyOn(triviaModule, 'prepareGame').mockRejectedValue(
      new Error('SELECT * FROM questions syntax error at line 1')
    );

    const request = new NextRequest('http://localhost:3000/api/v1/games/prepare', {
      method: 'POST',
      headers: {
        cookie: `${TABLE_SESSION_COOKIE_NAME}=valid_token_123`,
      },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('GAME_PREPARATION_FAILED');
    expect(json.error.message).not.toContain('SELECT');
  });
});
