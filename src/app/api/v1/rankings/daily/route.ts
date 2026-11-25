import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import {
  getDailyRanking,
  getDailyDateRange,
  OFFICIAL_RANKING_TIMEZONE,
  type PublicDailyRankingResponse,
} from '@/modules/rankings';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const dateParam = searchParams.get('date');

    let queryDate: Date | undefined;
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      queryDate = new Date(`${dateParam}T12:00:00.000-03:00`);
    }

    const limit = limitParam ? Math.min(Math.max(1, parseInt(limitParam, 10) || 10), 50) : 10;
    const now = queryDate || new Date();
    const { dateString } = getDailyDateRange(now);

    const db = getDb();
    const rankingEntries = await getDailyRanking(db, {
      date: now,
      limit,
    });

    const responseBody: PublicDailyRankingResponse = {
      ok: true,
      date: dateString,
      timezone: OFFICIAL_RANKING_TIMEZONE,
      generatedAt: new Date().toISOString(),
      ranking: rankingEntries.map((entry) => ({
        position: entry.position,
        table: {
          code: entry.table.code,
          name: entry.table.name,
        },
        score: entry.score,
        correctCount: entry.correctCount,
      })),
    };

    return NextResponse.json(responseBody, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=5',
      },
    });
  } catch (error) {
    console.error('Error al consultar el ranking diario:', error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'RANKING_ERROR',
          message: 'No se pudo obtener el ranking diario.',
        },
      },
      { status: 500 }
    );
  }
}
