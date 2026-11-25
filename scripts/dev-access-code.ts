import * as dotenv from 'dotenv';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as schema from '../src/db/schema';
import { getCurrentVenueAccessCode } from '../src/lib/security/access-codes';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });
dotenv.config();

async function main() {
  const venueSlug = process.argv[2] || 'esperanza-central';
  const secret = process.env.ACCESS_CODE_SECRET;

  if (!secret || secret.trim() === '') {
    console.error('ERROR: ACCESS_CODE_SECRET no está configurada en las variables de entorno.');
    process.exit(1);
  }

  let venueId = process.env.VENUE_ID;
  let venueName = process.env.VENUE_NAME;

  if (!venueId) {
    const connectionUrl = process.env.DATABASE_URL;
    if (!connectionUrl || connectionUrl.trim() === '') {
      console.error(
        'ERROR: DATABASE_URL no está configurada. Configure DATABASE_URL en su archivo .env.local o defina VENUE_ID para modo offline.'
      );
      process.exit(1);
    }

    const sql = postgres(connectionUrl, { max: 1 });
    const db = drizzle(sql, { schema });

    try {
      const [venue] = await db
        .select({
          id: schema.venues.id,
          name: schema.venues.name,
          slug: schema.venues.slug,
        })
        .from(schema.venues)
        .where(eq(schema.venues.slug, venueSlug))
        .limit(1);

      if (!venue) {
        console.error(`ERROR: No se encontró ningún local con slug "${venueSlug}".`);
        process.exit(1);
      }

      venueId = venue.id;
      venueName = venue.name;
    } finally {
      await sql.end();
    }
  }

  const details = getCurrentVenueAccessCode(venueId, secret);
  const secondsRemaining = Math.max(
    0,
    Math.floor((details.validUntil.getTime() - Date.now()) / 1000)
  );

  console.log(`Venue: ${venueName || 'Punto Burger Esperanza'}`);
  console.log(`Código actual: ${details.code}`);
  console.log(`Expira en: ${secondsRemaining} segundos`);
}

main().catch((err) => {
  console.error('Fallo inesperado:', err);
  process.exit(1);
});
