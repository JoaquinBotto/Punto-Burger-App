import { desc, eq, sql } from 'drizzle-orm';

import type { DbClient } from '../client';
import { gameSessions, type GameSession, type NewGameSession } from '../schema/game-sessions';
import { categories, type Category } from '../schema/categories';

export async function getGameSessionByTableSessionId(
  db: DbClient,
  tableSessionId: string
): Promise<GameSession | null> {
  const result = await db
    .select()
    .from(gameSessions)
    .where(eq(gameSessions.tableSessionId, tableSessionId))
    .orderBy(desc(gameSessions.createdAt))
    .limit(1);

  return result[0] ?? null;
}

export async function getGameSessionsByTableSessionId(
  db: DbClient,
  tableSessionId: string
): Promise<GameSession[]> {
  return db
    .select()
    .from(gameSessions)
    .where(eq(gameSessions.tableSessionId, tableSessionId))
    .orderBy(desc(gameSessions.createdAt));
}

export async function getGameSessionWithCategory(
  db: DbClient,
  tableSessionId: string
): Promise<(GameSession & { category: Category | null }) | null> {
  const result = await db
    .select({
      gameSession: gameSessions,
      category: categories,
    })
    .from(gameSessions)
    .leftJoin(categories, eq(gameSessions.categoryId, categories.id))
    .where(eq(gameSessions.tableSessionId, tableSessionId))
    .orderBy(desc(gameSessions.createdAt))
    .limit(1);

  if (!result[0]) {
    return null;
  }

  return {
    ...result[0].gameSession,
    category: result[0].category,
  };
}

export async function createGameSession(db: DbClient, data: NewGameSession): Promise<GameSession> {
  const [created] = await db.insert(gameSessions).values(data).returning();
  if (!created) {
    throw new Error('No se pudo crear la sesión de juego.');
  }
  return created;
}

export async function updateGameSessionCategory(
  db: DbClient,
  gameSessionId: string,
  categoryId: string
): Promise<GameSession> {
  const [updated] = await db
    .update(gameSessions)
    .set({
      categoryId,
      updatedAt: new Date(),
    })
    .where(eq(gameSessions.id, gameSessionId))
    .returning();

  if (!updated) {
    throw new Error('No se pudo actualizar la categoría de la sesión de juego.');
  }
  return updated;
}

export async function getGameSessionById(
  db: DbClient,
  gameSessionId: string
): Promise<GameSession | null> {
  const [result] = await db
    .select()
    .from(gameSessions)
    .where(eq(gameSessions.id, gameSessionId))
    .limit(1);

  return result ?? null;
}

export async function updateGameSessionStatus(
  db: DbClient,
  gameSessionId: string,
  status: GameSession['status'],
  startedAt?: Date,
  finishedAt?: Date
): Promise<GameSession> {
  const updateData: Partial<NewGameSession> = {
    status,
    updatedAt: new Date(),
  };
  if (startedAt !== undefined) {
    updateData.startedAt = startedAt;
  }
  if (finishedAt !== undefined) {
    updateData.finishedAt = finishedAt;
  }

  const [updated] = await db
    .update(gameSessions)
    .set(updateData)
    .where(eq(gameSessions.id, gameSessionId))
    .returning();

  if (!updated) {
    throw new Error(`Sesión de juego ${gameSessionId} no encontrada.`);
  }

  return updated;
}

export async function advanceGameSessionQuestion(
  db: DbClient,
  gameSessionId: string,
  newQuestionIndex: number
): Promise<GameSession> {
  const [updated] = await db
    .update(gameSessions)
    .set({
      currentQuestionIndex: newQuestionIndex,
      updatedAt: new Date(),
    })
    .where(eq(gameSessions.id, gameSessionId))
    .returning();

  if (!updated) {
    throw new Error(`Sesión de juego ${gameSessionId} no encontrada.`);
  }

  return updated;
}

export async function updateGameSessionScoreAndCounts(
  db: DbClient,
  gameSessionId: string,
  pointsToAdd: number,
  result: 'correct' | 'incorrect' | 'unanswered'
): Promise<GameSession> {
  const countField =
    result === 'correct'
      ? { correctCount: sql<number>`${gameSessions.correctCount} + 1` }
      : result === 'incorrect'
        ? { incorrectCount: sql<number>`${gameSessions.incorrectCount} + 1` }
        : { unansweredCount: sql<number>`${gameSessions.unansweredCount} + 1` };

  const [updated] = await db
    .update(gameSessions)
    .set({
      totalScore: sql<number>`${gameSessions.totalScore} + ${pointsToAdd}`,
      ...countField,
      updatedAt: new Date(),
    })
    .where(eq(gameSessions.id, gameSessionId))
    .returning();

  if (!updated) {
    throw new Error(`Sesión de juego ${gameSessionId} no encontrada.`);
  }

  return updated;
}

export async function updateGameSessionRankingEligibility(
  db: DbClient,
  gameSessionId: string,
  rankingEligible: boolean
): Promise<GameSession> {
  const [updated] = await db
    .update(gameSessions)
    .set({
      rankingEligible,
      updatedAt: new Date(),
    })
    .where(eq(gameSessions.id, gameSessionId))
    .returning();

  if (!updated) {
    throw new Error(`Sesión de juego ${gameSessionId} no encontrada.`);
  }

  return updated;
}
