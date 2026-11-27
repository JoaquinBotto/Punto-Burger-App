import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDb } from '@/db/client';
import { TABLE_SESSION_COOKIE_NAME } from '@/modules/sessions';
import { getPlaySetupData } from '@/modules/groups';
import { getCompetitionState } from '@/modules/competitions';
import PlaySetupWizard from './play-setup-wizard';

export default async function PlaySetupPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(TABLE_SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    redirect('/');
  }

  let setupData = null;
  let competition = null;
  let competitionState = null;
  const db = getDb();

  try {
    setupData = await getPlaySetupData(db, sessionCookie);
    if (setupData) {
      competitionState = await getCompetitionState(db, sessionCookie);
      const comp = competitionState.competition;
      if (comp) {
        competition = {
          id: comp.id,
          name: comp.name,
          status: comp.status,
          timingMode: comp.timingMode,
          startsAt: comp.startsAt,
          endsAt: comp.endsAt,
          registrationOpensAt: comp.registrationOpensAt,
          joinCutoffAt: comp.joinCutoffAt,
        };
      }
    }
  } catch (error) {
    console.error('Error al resolver la sesión en /play/setup:', error);
    redirect('/');
  }

  if (!setupData) {
    redirect('/');
  }

  return (
    <PlaySetupWizard
      initialData={setupData}
      competition={competition}
      competitionState={competitionState}
    />
  );
}
