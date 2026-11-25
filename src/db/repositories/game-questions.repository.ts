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
