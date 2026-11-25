import { asc, eq, sql } from 'drizzle-orm';
import type { DbClient } from '../client';
import { gameQuestions, type GameQuestion, type NewGameQuestion } from '../schema/game-questions';

export async function getGameQuestionsBySessionId(
  db: DbClient,
  gameSessionId: string
): Promise<GameQuestion[]> {
  return db
    .select()
    .from(gameQuestions)
    .where(eq(gameQuestions.gameSessionId, gameSessionId))
    .orderBy(asc(gameQuestions.position));
}

export async function createGameQuestions(
  db: DbClient,
  questionsData: NewGameQuestion[]
): Promise<GameQuestion[]> {
  if (questionsData.length === 0) {
    return [];
  }
  return db.insert(gameQuestions).values(questionsData).returning();
}

export async function countGameQuestionsBySessionId(
  db: DbClient,
  gameSessionId: string
): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(gameQuestions)
    .where(eq(gameQuestions.gameSessionId, gameSessionId));

  return result?.count ?? 0;
}

export async function getGameQuestionByPosition(
  db: DbClient,
  gameSessionId: string,
  position: number
): Promise<GameQuestion | null> {
  const [result] = await db
    .select()
    .from(gameQuestions)
    .where(
      sql`${gameQuestions.gameSessionId} = ${gameSessionId} AND ${gameQuestions.position} = ${position}`
    )
    .limit(1);

  return result ?? null;
}

export async function getGameQuestionById(db: DbClient, id: string): Promise<GameQuestion | null> {
  const [result] = await db.select().from(gameQuestions).where(eq(gameQuestions.id, id)).limit(1);

  return result ?? null;
}

export async function updateGameQuestionTiming(
  db: DbClient,
  id: string,
  presentedAt: Date,
  expiresAt: Date
): Promise<GameQuestion> {
  const [updated] = await db
    .update(gameQuestions)
    .set({
      presentedAt,
      expiresAt,
    })
    .where(eq(gameQuestions.id, id))
    .returning();

  if (!updated) {
    throw new Error(`Pregunta de juego ${id} no encontrada para actualizar tiempos.`);
  }

  return updated;
}
