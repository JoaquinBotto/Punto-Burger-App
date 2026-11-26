import { cookies } from 'next/headers';
import { getDb } from '@/db/client';
import { TABLE_SESSION_COOKIE_NAME } from '@/modules/sessions';
import {
  getDailyRanking,
  getDailyDateRange,
  getTableDailyRankingFromSessionCookie,
} from '@/modules/rankings';
import { getCurrentCompetition, getCompetitionRanking } from '@/modules/competitions';
import { venues } from '@/db/schema';
import { eq } from 'drizzle-orm';
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

  const [defaultVenue] = await db
    .select({ id: venues.id })
    .from(venues)
    .where(eq(venues.slug, 'esperanza-central'))
    .limit(1);

  const venueId = defaultVenue?.id ?? '00000000-0000-0000-0000-000000000001';

  // Comprobar si hay competencia oficial hoy (excluyendo test)
  const competition = await getCurrentCompetition(db, venueId, { allowTest: false });

  if (competition && competition.status !== 'cancelled') {
    const compRanking = await getCompetitionRanking(db, competition.id);

    return (
      <RankingClient
        initialDate={dateString}
        initialRanking={[]}
        initialContext={null}
        competition={{
          id: competition.id,
          name: competition.name,
          status: competition.status,
          timingMode: competition.timingMode,
          startsAt: competition.startsAt ? competition.startsAt.toISOString() : null,
          endsAt: competition.endsAt ? competition.endsAt.toISOString() : null,
          localDate: competition.localDate,
        }}
        initialCompetitionRanking={compRanking}
      />
    );
  }

  // Fallback a ranking casual diario si no hay competencia hoy
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
      competition={null}
      initialCompetitionRanking={null}
    />
  );
}
