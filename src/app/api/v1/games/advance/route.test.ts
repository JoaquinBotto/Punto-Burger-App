import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';
import * as triviaModule from '@/modules/trivia';
import { TABLE_SESSION_COOKIE_NAME } from '@/modules/sessions';

vi.mock('@/db/client', () => ({
  getDb: vi.fn(() => ({})),
}));

describe('POST /api/v1/games/advance Route Handler', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('responde HTTP 401 si no se envía la cookie de sesión', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/games/advance', {
      method: 'POST',
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.ok).toBe(false);
  });

  it('responde HTTP 200 con la siguiente pregunta cuando se avanza exitosamente', async () => {
    vi.spyOn(triviaModule, 'advanceGame').mockResolvedValue({
      ok: true,
      advanced: true,
      completed: false,
      currentQuestionIndex: 1,
      currentPosition: 2,
      question: {
        position: 2,
        difficulty: 'initial',
        targetAlias: null,
        isGroup: true,
        prompt: 'Pregunta 2',
        optionA: 'A',
        optionB: 'B',
        optionC: 'C',
        optionD: 'D',
        presentedAt: '2026-11-25T12:00:10Z',
        expiresAt: '2026-11-25T12:00:30Z',
        serverNow: '2026-11-25T12:00:10Z',
      },
    });

    const request = new NextRequest('http://localhost:3000/api/v1/games/advance', {
      method: 'POST',
      headers: {
        cookie: `${TABLE_SESSION_COOKIE_NAME}=token_abc`,
      },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.advanced).toBe(true);
    expect(json.currentPosition).toBe(2);
  });

  it('responde completed=true y next=/play/results cuando se avanza desde la pregunta 10', async () => {
    vi.spyOn(triviaModule, 'advanceGame').mockResolvedValue({
      ok: true,
      advanced: true,
      completed: true,
      next: '/play/results',
    });

    const request = new NextRequest('http://localhost:3000/api/v1/games/advance', {
      method: 'POST',
      headers: {
        cookie: `${TABLE_SESSION_COOKIE_NAME}=token_abc`,
      },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.completed).toBe(true);
    expect(json.next).toBe('/play/results');
  });
});
