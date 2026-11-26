import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { getCurrentCompetition } from '@/modules/competitions';
import { venues } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const db = getDb();
  const searchParams = request.nextUrl.searchParams;
  const allowTest = searchParams.get('allowTest') === 'true';

  const [defaultVenue] = await db
    .select({ id: venues.id })
    .from(venues)
    .where(eq(venues.slug, 'esperanza-central'))
    .limit(1);

  const venueId = defaultVenue?.id ?? '00000000-0000-0000-0000-000000000001';
  const comp = await getCurrentCompetition(db, venueId, { allowTest });

  if (!comp) {
    return NextResponse.json(
      { ok: true, competition: null },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      competition: {
        id: comp.id,
        name: comp.name,
        timingMode: comp.timingMode,
        localDate: comp.localDate,
        startsAt: comp.startsAt ? comp.startsAt.toISOString() : null,
        endsAt: comp.endsAt ? comp.endsAt.toISOString() : null,
        registrationOpensAt: comp.registrationOpensAt
          ? comp.registrationOpensAt.toISOString()
          : null,
        joinCutoffAt: comp.joinCutoffAt ? comp.joinCutoffAt.toISOString() : null,
        finalizationGraceUntil: comp.finalizationGraceUntil
          ? comp.finalizationGraceUntil.toISOString()
          : null,
        status: comp.status,
        isTest: comp.isTest,
      },
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    }
  );
}
