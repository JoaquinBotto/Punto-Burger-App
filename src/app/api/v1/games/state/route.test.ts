import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';
import * as triviaModule from '@/modules/trivia';
import { TABLE_SESSION_COOKIE_NAME } from '@/modules/sessions';

vi.mock('@/db/client', () => ({
  getDb: vi.fn(() => ({})),
}));

describe('GET /api/v1/games/state Route Handler', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('responde HTTP 401 si no se envía la cookie de sesión', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/games/state', {
      method: 'GET',
    });

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('SESSION_NOT_FOUND');
  });

  it('responde HTTP 200 con el estado actual del juego', async () => {
    vi.spyOn(triviaModule, 'getGameState').mockResolvedValue({
      ok: true,
      game: {
        id: 'game-123',
        status: 'active',
        currentQuestionIndex: 0,
        currentPosition: 1,
        totalQuestions: 10,
        totalScore: 0,
        correctCount: 0,
        incorrectCount: 0,
        unansweredCount: 0,
        category: { slug: 'deportes', name: 'Deportes' },
        group: { name: 'Los Bacon' },
        table: { code: 'mesa-01', displayName: 'Mesa 01' },
      },
      question: {
        position: 1,
        difficulty: 'initial',
        targetAlias: null,
        isGroup: true,
        prompt: '¿Quién ganó el mundial 2022?',
        optionA: 'Francia',
        optionB: 'Argentina',
        optionC: 'Brasil',
        optionD: 'Croacia',
        presentedAt: '2026-11-25T12:00:00Z',
        expiresAt: '2026-11-25T12:00:20Z',
        serverNow: '2026-11-25T12:00:05Z',
      },
      feedback: null,
      isResolved: false,
    });

    const request = new NextRequest('http://localhost:3000/api/v1/games/state', {
      method: 'GET',
      headers: {
        cookie: `${TABLE_SESSION_COOKIE_NAME}=token_abc`,
      },
    });

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.game.currentPosition).toBe(1);
    expect(json.isResolved).toBe(false);
  });
});
