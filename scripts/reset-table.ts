import { getDb } from '@/db/client';
import { sql } from 'drizzle-orm';

async function main() {
  const tableCode = process.argv[2] || 'mesa-01';
  const db = getDb();
  await db.execute(sql`
    UPDATE table_sessions 
    SET status = 'closed', closed_at = NOW(), cooldown_until = NULL 
    WHERE table_id IN (SELECT id FROM tables WHERE code = ${tableCode}) 
      AND status = 'active'
  `);
  await db.execute(sql`UPDATE tables SET status = 'available' WHERE code = ${tableCode}`);
  await db.execute(sql`UPDATE table_sessions SET cooldown_until = NULL WHERE status = 'closed'`);
  console.log(`Table ${tableCode} reset to available with all active sessions closed.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
