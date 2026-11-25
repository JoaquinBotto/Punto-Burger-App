import { getDb } from '../src/db/client';
import { updateGameSessionRankingEligibility } from '../src/db/repositories/game-sessions.repository';

async function main() {
  const [gameSessionId, eligibleStr] = process.argv.slice(2);
  if (!gameSessionId) {
    console.error('Uso: npx tsx scripts/set-game-ranking-eligible.ts <gameSessionId> <true|false>');
    process.exit(1);
  }

  const eligible = eligibleStr === 'true';
  const db = getDb();
  await updateGameSessionRankingEligibility(db, gameSessionId, eligible);
  console.log(`Game session ${gameSessionId} ranking_eligible set to ${eligible}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
