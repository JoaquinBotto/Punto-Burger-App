import * as dotenv from 'dotenv';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as schema from '../src/db/schema';
import {
  getCurrentCompetition,
  finalizeCompetition,
} from '../src/modules/competitions/competition.service';
import { getCompetitionRanking } from '../src/modules/competitions/competition-ranking.service';

dotenv.config({ path: '.env.local' });
dotenv.config();

function parseArgs() {
  const args = process.argv.slice(2);
  const params: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i] ?? '';
    if (arg.startsWith('--') && i + 1 < args.length && !(args[i + 1] ?? '').startsWith('--')) {
      params[arg.slice(2)] = args[i + 1] ?? '';
      i++;
    }
  }

  return params;
}

async function main() {
  const params = parseArgs();
  const venueSlug = params['venue-slug'] || 'esperanza-central';
  const compId = params['id'];

  const connectionUrl = process.env.DATABASE_URL;
  if (!connectionUrl || connectionUrl.trim() === '') {
    console.error('ERROR: DATABASE_URL no está configurada.');
    process.exit(1);
  }

  const client = postgres(connectionUrl, { max: 1 });
  const db = drizzle(client, { schema });

  try {
    let targetCompetitionId = compId;

    if (!targetCompetitionId) {
      const [venue] = await db
        .select({ id: schema.venues.id, name: schema.venues.name })
        .from(schema.venues)
        .where(eq(schema.venues.slug, venueSlug))
        .limit(1);

      if (!venue) {
        console.error(`ERROR: No se encontró el local con slug "${venueSlug}".`);
        process.exit(1);
      }

      const comp = await getCurrentCompetition(db, venue.id, { allowTest: true });
      if (!comp) {
        console.error('No hay ninguna competencia activa o programada hoy para finalizar.');
        process.exit(1);
      }
      targetCompetitionId = comp.id;
    }

    console.log(`Finalizando competencia ${targetCompetitionId}...`);
    const finalizedComp = await finalizeCompetition(db, targetCompetitionId);

    console.log('\n✅ COMPETENCIA FINALIZADA:');
    console.table([
      {
        ID: finalizedComp.id,
        Nombre: finalizedComp.name,
        Estado: finalizedComp.status,
        Fecha: finalizedComp.localDate,
      },
    ]);

    const finalRanking = await getCompetitionRanking(db, finalizedComp.id);
    console.log('\n🏆 PODIO FINAL:');
    console.table(
      finalRanking.slice(0, 10).map((r) => ({
        Puesto: `#${r.position}`,
        Mesa: r.table,
        Puntaje: `${r.totalScore} pts`,
        Ciclos: `${r.roundsCompleted}/3`,
        Correctas: r.correctCount,
        'Tiempo (s)': Math.round(Number(r.totalResponseTimeMs) / 1000),
      }))
    );

    await client.end();
  } catch (err) {
    console.error('ERROR al finalizar competencia:', err);
    await client.end();
    process.exit(1);
  }
}

main();
