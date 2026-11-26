import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import {
  getCurrentCompetition,
  getCompetitionRanking,
  getCompetitionById,
} from '@/modules/competitions';
import { venues } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const db = getDb();
  const searchParams = request.nextUrl.searchParams;
  const competitionIdParam = searchParams.get('id');
  const allowTest = searchParams.get('allowTest') === 'true';

  let competition = null;

  if (competitionIdParam) {
    competition = await getCompetitionById(db, competitionIdParam);
  } else {
    const [defaultVenue] = await db
      .select({ id: venues.id })
      .from(venues)
      .where(eq(venues.slug, 'esperanza-central'))
      .limit(1);

    const venueId = defaultVenue?.id ?? '00000000-0000-0000-0000-000000000001';
    competition = await getCurrentCompetition(db, venueId, { allowTest });
  }

  if (!competition) {
    return NextResponse.json(
      {
        ok: true,
        competition: null,
        ranking: [],
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  }

  const ranking = await getCompetitionRanking(db, competition.id);

  return NextResponse.json(
    {
      ok: true,
      competition: {
        id: competition.id,
        name: competition.name,
        status: competition.status,
        timingMode: competition.timingMode,
        localDate: competition.localDate,
        startsAt: competition.startsAt ? competition.startsAt.toISOString() : null,
        endsAt: competition.endsAt ? competition.endsAt.toISOString() : null,
        isTest: competition.isTest,
      },
      ranking,
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    }
  );
}
