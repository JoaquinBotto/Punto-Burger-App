import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';
import * as triviaModule from '@/modules/trivia';
import { TABLE_SESSION_COOKIE_NAME } from '@/modules/sessions';

vi.mock('@/db/client', () => ({
  getDb: vi.fn(() => ({})),
}));

describe('POST /api/v1/games/answer Route Handler', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('responde HTTP 401 si no se envía la cookie de sesión', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/games/answer', {
      method: 'POST',
      body: JSON.stringify({ selectedOption: 'A' }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.ok).toBe(false);
  });

  it('responde HTTP 400 si la opción no es A, B, C o D', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/games/answer', {
      method: 'POST',
      headers: {
        cookie: `${TABLE_SESSION_COOKIE_NAME}=token_abc`,
      },
      body: JSON.stringify({ selectedOption: 'Z' }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('INVALID_INPUT');
  });

  it('responde HTTP 200 con el resultado y puntaje de la respuesta', async () => {
    vi.spyOn(triviaModule, 'submitAnswer').mockResolvedValue({
      ok: true,
      answer: {
        result: 'correct',
        selectedOption: 'B',
        correctOption: 'B',
        explanation: 'Explicación de prueba.',
        pointsAwarded: 100,
        totalScore: 100,
      },
      isLastQuestion: false,
    });

    const request = new NextRequest('http://localhost:3000/api/v1/games/answer', {
      method: 'POST',
      headers: {
        cookie: `${TABLE_SESSION_COOKIE_NAME}=token_abc`,
      },
      body: JSON.stringify({ selectedOption: 'B' }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.answer.result).toBe('correct');
    expect(json.answer.pointsAwarded).toBe(100);
    expect(json.answer.totalScore).toBe(100);
  });
});
