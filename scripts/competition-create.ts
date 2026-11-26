import * as dotenv from 'dotenv';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as schema from '../src/db/schema';
import { createCompetition } from '../src/modules/competitions/competition.service';

dotenv.config({ path: '.env.local' });
dotenv.config();

function parseArgs() {
  const args = process.argv.slice(2);
  const params: Record<string, string | boolean> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i] ?? '';
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      if (key === 'is-test') {
        params[key] = true;
      } else if (i + 1 < args.length && !(args[i + 1] ?? '').startsWith('--')) {
        params[key] = args[i + 1] ?? '';
        i++;
      }
    }
  }

  return params;
}

async function main() {
  const params = parseArgs();
  const venueSlug = (params['venue-slug'] as string) || 'esperanza-central';

  const connectionUrl = process.env.DATABASE_URL;
  if (!connectionUrl || connectionUrl.trim() === '') {
    console.error('ERROR: DATABASE_URL no está configurada.');
    process.exit(1);
  }

  const sql = postgres(connectionUrl, { max: 1 });
  const db = drizzle(sql, { schema });

  try {
    const [venue] = await db
      .select({ id: schema.venues.id, name: schema.venues.name })
      .from(schema.venues)
      .where(eq(schema.venues.slug, venueSlug))
      .limit(1);

    if (!venue) {
      console.error(`ERROR: No se encontró el local con slug "${venueSlug}".`);
      process.exit(1);
    }

    const todayDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Cordoba',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

    const localDate = (params['date'] as string) || todayDate;
    const startTime = (params['start'] as string) || '20:00';
    const endTime = (params['end'] as string) || '23:00';
    const name = (params['name'] as string) || `Competencia ${localDate}`;
    const registrationMinutesBefore = params['registration-minutes-before']
      ? parseInt(params['registration-minutes-before'] as string, 10)
      : 30;
    const joinCutoffMinutesBeforeEnd = params['join-cutoff-minutes-before-end']
      ? parseInt(params['join-cutoff-minutes-before-end'] as string, 10)
      : 30;
    const graceMinutes = params['grace-minutes']
      ? parseInt(params['grace-minutes'] as string, 10)
      : 30;
    const isTest = Boolean(params['is-test']);

    console.log(`Creando competencia para ${venue.name} (${venueSlug})...`);
    console.log(`- Fecha: ${localDate}`);
    console.log(`- Horario: ${startTime} a ${endTime} (America/Argentina/Cordoba)`);
    console.log(`- Test mode: ${isTest}`);

    const comp = await createCompetition(db, venue.id, {
      localDate,
      startTime,
      endTime,
      name,
      registrationMinutesBefore,
      joinCutoffMinutesBeforeEnd,
      graceMinutes,
      isTest,
    });

    console.log('\n✅ COMPETENCIA CREADA EXITOSAMENTE:');
    console.table([
      {
        ID: comp.id,
        Nombre: comp.name,
        Fecha: comp.localDate,
        Estado: comp.status,
        'Abre Registro': comp.registrationOpensAt.toISOString(),
        Inicio: comp.startsAt.toISOString(),
        'Cierre Registro': comp.joinCutoffAt.toISOString(),
        Fin: comp.endsAt.toISOString(),
        'Gracia Hasta': comp.finalizationGraceUntil.toISOString(),
        'Es Test': comp.isTest ? 'SÍ' : 'NO',
      },
    ]);

    await sql.end();
  } catch (err) {
    console.error('ERROR al crear competencia:', err);
    await sql.end();
    process.exit(1);
  }
}

main();
