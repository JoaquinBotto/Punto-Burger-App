import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';
import * as triviaModule from '@/modules/trivia';
import { TABLE_SESSION_COOKIE_NAME } from '@/modules/sessions';

vi.mock('@/db/client', () => ({
  getDb: vi.fn(() => ({})),
}));

describe('POST /api/v1/games/start Route Handler', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('responde HTTP 401 si no se envía la cookie de sesión', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/games/start', {
      method: 'POST',
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('SESSION_NOT_FOUND');
  });

  it('responde HTTP 200 con la pregunta 1 activa al iniciar la partida', async () => {
    vi.spyOn(triviaModule, 'startGame').mockResolvedValue({
      ok: true,
      game: {
        id: 'game-123',
        status: 'active',
        currentQuestionIndex: 0,
        currentPosition: 1,
      },
      question: {
        position: 1,
        difficulty: 'initial',
        targetAlias: null,
        isGroup: true,
        prompt: '¿Cuál es la capital de Argentina?',
        optionA: 'Córdoba',
        optionB: 'Buenos Aires',
        optionC: 'Rosario',
        optionD: 'Mendoza',
        presentedAt: '2026-11-25T12:00:00Z',
        expiresAt: '2026-11-25T12:00:20Z',
        serverNow: '2026-11-25T12:00:00Z',
      },
    });

    const request = new NextRequest('http://localhost:3000/api/v1/games/start', {
      method: 'POST',
      headers: {
        cookie: `${TABLE_SESSION_COOKIE_NAME}=token_abc`,
      },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.game.status).toBe('active');
    expect(json.question.position).toBe(1);
    expect(json.question.prompt).toBe('¿Cuál es la capital de Argentina?');
  });
});
