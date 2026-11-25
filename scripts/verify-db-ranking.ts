import { getDb } from '@/db/client';
import { sql } from 'drizzle-orm';

async function main() {
  const db = getDb();
  const cols = await db.execute(
    sql`SELECT column_name, column_default, is_nullable FROM information_schema.columns WHERE table_name = 'game_sessions' AND column_name = 'ranking_eligible'`
  );
  console.log('Column info:', Array.from(cols));

  const counts = await db.execute(
    sql`SELECT ranking_eligible, count(*)::int as total FROM game_sessions GROUP BY ranking_eligible`
  );
  console.log('Counts by ranking_eligible:', Array.from(counts));

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
