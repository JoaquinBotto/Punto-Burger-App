import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDb } from '@/db/client';
import { TABLE_SESSION_COOKIE_NAME } from '@/modules/sessions';
import { getGameResults } from '@/modules/trivia';
import { ResultsClient } from './results-client';

export const dynamic = 'force-dynamic';

export default async function PlayResultsPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(TABLE_SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    redirect('/');
    return null;
  }

  const db = getDb();
  let results;

  try {
    const data = await getGameResults(db, sessionCookie);
    results = data.game;
  } catch {
    redirect('/play');
    return null;
  }

  return <ResultsClient results={results} />;
}
