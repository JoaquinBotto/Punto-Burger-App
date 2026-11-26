import * as dotenv from 'dotenv';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, sql } from 'drizzle-orm';
import * as schema from '../src/db/schema';
import { getCurrentCompetition } from '../src/modules/competitions/competition.service';
import { getCompetitionRanking } from '../src/modules/competitions/competition-ranking.service';

dotenv.config({ path: '.env.local' });
dotenv.config();

async function main() {
  const venueSlug = process.argv[2] || 'esperanza-central';

  const connectionUrl = process.env.DATABASE_URL;
  if (!connectionUrl || connectionUrl.trim() === '') {
    console.error('ERROR: DATABASE_URL no está configurada.');
    process.exit(1);
  }

  const client = postgres(connectionUrl, { max: 1 });
  const db = drizzle(client, { schema });

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

    const comp = await getCurrentCompetition(db, venue.id, { allowTest: true });

    if (!comp) {
      console.log(
        `No hay ninguna competencia programada, activa o finalizada hoy en ${venue.name}.`
      );
      await client.end();
      return;
    }

    // Estadísticas de mesas
    const entriesSummary = await db.execute(sql`
      SELECT
        status,
        COUNT(*)::int as count
      FROM competition_entries
      WHERE competition_id = ${comp.id}
      GROUP BY status
    `);

    const ranking = await getCompetitionRanking(db, comp.id);
    const leader = ranking[0];

    console.log(`\n🏆 ESTADO DE COMPETENCIA — ${venue.name}`);
    console.table([
      {
        ID: comp.id,
        Nombre: comp.name,
        Fecha: comp.localDate,
        Estado: comp.status.toUpperCase(),
        Inicio: comp.startsAt.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        Fin: comp.endsAt.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        Test: comp.isTest ? 'SÍ' : 'NO',
      },
    ]);

    console.log('\n📊 INSCRIPCIONES POR ESTADO:');
    console.table(entriesSummary);

    if (leader) {
      console.log(`\n🥇 ${comp.status === 'finalized' ? 'MESA GANADORA' : 'LÍDER ACTUAL'}:`);
      console.log(`- Mesa: ${leader.table}`);
      console.log(`- Puntaje: ${leader.totalScore} pts`);
      console.log(`- Ciclos completados: ${leader.roundsCompleted}/3`);
      console.log(`- Preguntas correctas: ${leader.correctCount}`);
      console.log(`- Tiempo total: ${Math.round(Number(leader.totalResponseTimeMs) / 1000)}s`);
    } else {
      console.log('\nSin puntuaciones registradas aún.');
    }

    await client.end();
  } catch (err) {
    console.error('ERROR al consultar estado:', err);
    await client.end();
    process.exit(1);
  }
}

main();
