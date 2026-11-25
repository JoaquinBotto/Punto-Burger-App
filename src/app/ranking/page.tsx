import { cookies } from 'next/headers';
import { getDb } from '@/db/client';
import { TABLE_SESSION_COOKIE_NAME } from '@/modules/sessions';
import {
  getDailyRanking,
  getDailyDateRange,
  getTableDailyRankingFromSessionCookie,
} from '@/modules/rankings';
import { RankingClient } from './ranking-client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Ranking de Hoy | Punto Burger',
  description: 'Ranking diario competitivo entre mesas de Punto Burger Esperanza.',
};

export default async function RankingPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(TABLE_SESSION_COOKIE_NAME)?.value;

  const db = getDb();
  const now = new Date();
  const { dateString } = getDailyDateRange(now);

  const [rankingEntries, tableContext] = await Promise.all([
    getDailyRanking(db, { date: now, limit: 10 }),
    sessionCookie ? getTableDailyRankingFromSessionCookie(db, sessionCookie, undefined, now) : null,
  ]);

  const initialRanking = rankingEntries.map((entry) => ({
    position: entry.position,
    table: {
      code: entry.table.code,
      name: entry.table.name,
    },
    score: entry.score,
    correctCount: entry.correctCount,
  }));

  return (
    <RankingClient
      initialDate={dateString}
      initialRanking={initialRanking}
      initialContext={tableContext}
    />
  );
}
