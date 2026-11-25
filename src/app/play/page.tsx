import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDb } from '@/db/client';
import { TABLE_SESSION_COOKIE_NAME } from '@/modules/sessions';
import { getGameState, getPlayPageData } from '@/modules/trivia';
import { PlayGame } from './play-game';

export const dynamic = 'force-dynamic';

export default async function PlayPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(TABLE_SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    redirect('/');
    return null;
  }

  const db = getDb();
  let playData;

  try {
    playData = await getPlayPageData(db, sessionCookie);
  } catch {
    redirect('/play/setup');
    return null;
  }

  if (!playData.isPrepared) {
    redirect('/play/setup');
    return null;
  }

  // Si la partida ya fue completada, redirigir a resultados
  if (playData.gameStatus === 'completed') {
    redirect('/play/results');
    return null;
  }

  // Si la partida está activa, pre-cargar el estado del juego server-side
  let initialGameState = null;
  if (playData.gameStatus === 'active') {
    try {
      initialGameState = await getGameState(db, sessionCookie);
    } catch {
      // Si falla, PlayGame lo recuperará en el cliente
    }
  }

  return <PlayGame playData={playData} initialState={initialGameState} />;
}
