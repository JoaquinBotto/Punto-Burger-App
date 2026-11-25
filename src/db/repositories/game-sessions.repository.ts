import { desc, eq } from 'drizzle-orm';
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
