import * as dotenv from 'dotenv';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../src/db/schema';

dotenv.config({ path: '.env.production' });
dotenv.config({ path: '.env.local' });
dotenv.config();

async function main() {
  const connectionUrl = process.env.DATABASE_URL;
  if (!connectionUrl) {
    console.error('DATABASE_URL no configurada');
    process.exit(1);
  }

  const sql = postgres(connectionUrl, { max: 1 });
  const db = drizzle(sql, { schema });

  const shouldReset = process.argv.includes('--reset');

  const [table] = await db
    .select()
    .from(schema.tables)
    .where(eq(schema.tables.code, 'mesa-01'))
    .limit(1);

  if (!table) {
    console.log('Mesa 01 no encontrada');
    await sql.end();
    return;
  }

  const sessions = await db
    .select()
    .from(schema.tableSessions)
    .where(eq(schema.tableSessions.tableId, table.id))
    .orderBy(desc(schema.tableSessions.createdAt))
    .limit(5);

  const [latestSession] = sessions;

  let gameSession = null;
  let answersList: Array<{ position: number; result: string; pointsAwarded: number }> = [];

  if (latestSession) {
    const [gs] = await db
      .select()
      .from(schema.gameSessions)
      .where(eq(schema.gameSessions.tableSessionId, latestSession.id))
      .limit(1);
    gameSession = gs ?? null;

    if (gameSession) {
      const gqs = await db
        .select()
        .from(schema.gameQuestions)
        .where(eq(schema.gameQuestions.gameSessionId, gameSession.id));

      const ans = await db
        .select()
        .from(schema.answers)
        .where(eq(schema.answers.gameSessionId, gameSession.id));

      const gqMap = new Map(gqs.map((q) => [q.id, q]));
      answersList = ans
        .map((a) => ({
          position: gqMap.get(a.gameQuestionId)?.position ?? 0,
          result: a.result,
          pointsAwarded: a.pointsAwarded,
        }))
        .sort((a, b) => a.position - b.position);
    }
  }

  console.log('=== ESTADO ACTUAL MESA 01 ===');
  console.log('Mesa:', { id: table.id, code: table.code, status: table.status });
  console.log(
    'Última Sesión:',
    latestSession
      ? {
          id: latestSession.id,
          status: latestSession.status,
          expiresAt: latestSession.expiresAt,
          activeDeviceId: latestSession.activeDeviceId,
        }
      : 'Ninguna'
  );

  if (gameSession) {
    console.log('Partida:', {
      id: gameSession.id,
      status: gameSession.status,
      totalScore: gameSession.totalScore,
      correctCount: gameSession.correctCount,
      incorrectCount: gameSession.incorrectCount,
      unansweredCount: gameSession.unansweredCount,
      finishedAt: gameSession.finishedAt,
    });
    console.log('Respuestas registradas (' + answersList.length + '):', answersList);
  }

  if (shouldReset) {
    console.log('\n--- Ejecutando Reset a Available ---');
    const now = new Date();
    await db
      .update(schema.tableSessions)
      .set({ status: 'closed', closedAt: now, updatedAt: now })
      .where(eq(schema.tableSessions.tableId, table.id));

    if (latestSession) {
      await db
        .update(schema.devices)
        .set({ status: 'revoked', revokedAt: now })
        .where(eq(schema.devices.tableSessionId, latestSession.id));
    }

    await db
      .update(schema.tables)
      .set({ status: 'available', updatedAt: now })
      .where(eq(schema.tables.id, table.id));

    console.log('✓ Mesa 01 restablecida a disponible.');
  }

  await sql.end();
}

main().catch(console.error);
