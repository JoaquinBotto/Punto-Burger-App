import { eq } from 'drizzle-orm';
import type { DbClient } from '../client';
import { answers, type Answer, type NewAnswer } from '../schema/answers';

export async function getAnswerByGameQuestionId(
  db: DbClient,
  gameQuestionId: string
): Promise<Answer | null> {
  const result = await db
    .select()
    .from(answers)
    .where(eq(answers.gameQuestionId, gameQuestionId))
    .limit(1);

  return result[0] ?? null;
}

export async function getAnswersByGameSessionId(
  db: DbClient,
  gameSessionId: string
): Promise<Answer[]> {
  return db.select().from(answers).where(eq(answers.gameSessionId, gameSessionId));
}

export async function createAnswer(db: DbClient, data: NewAnswer): Promise<Answer> {
  const [created] = await db.insert(answers).values(data).returning();
  if (!created) {
    throw new Error('No se pudo registrar la respuesta.');
  }
  return created;
}
