import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.production' });
dotenv.config({ path: '.env.local' });
dotenv.config();
import postgres from 'postgres';

async function main() {
  const tableCode = process.argv[2] || 'mesa-01';
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL no configurada');
    process.exit(1);
  }

  const sql = postgres(url, { max: 1 });
  const rows = await sql`
    SELECT
      gq.position,
      gq.difficulty,
      gq.question_id,
      q.category_id,
      gs.created_at as session_created_at
    FROM game_questions gq
    JOIN questions q ON gq.question_id = q.id
    JOIN game_sessions gs ON gq.game_session_id = gs.id
    JOIN table_sessions ts ON gs.table_session_id = ts.id
    JOIN tables t ON ts.table_id = t.id
    WHERE t.code = ${tableCode}
      AND ts.id = (
        SELECT id FROM table_sessions WHERE table_id = t.id ORDER BY created_at DESC LIMIT 1
      )
    ORDER BY gs.created_at ASC, gq.position ASC;
  `;

  console.log('JSON_RESULT:' + JSON.stringify(rows));
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
