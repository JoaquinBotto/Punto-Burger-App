import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDb } from '@/db/client';
import { TABLE_SESSION_COOKIE_NAME } from '@/modules/sessions';
import { getPlaySetupData } from '@/modules/groups';
import PlaySetupWizard from './play-setup-wizard';

export default async function PlaySetupPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(TABLE_SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    redirect('/');
  }

  let setupData = null;
  try {
    const db = getDb();
    setupData = await getPlaySetupData(db, sessionCookie);
  } catch (error) {
    console.error('Error al resolver la sesión en /play/setup:', error);
    redirect('/');
  }

  if (!setupData) {
    redirect('/');
  }

  return <PlaySetupWizard initialData={setupData} />;
}
