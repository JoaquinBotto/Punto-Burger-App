import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as schema from '../schema';
import { seedCategories } from './data/categories';
import { seedQuestions } from './data/questions';

dotenv.config({ path: '.env.local' });
dotenv.config();

export async function runSeeds() {
  const connectionUrl = process.env.DATABASE_URL;
  if (!connectionUrl || connectionUrl.trim() === '') {
    throw new Error(
      'DATABASE_URL no está configurada. Para ejecutar el seed se requiere una conexión válida a PostgreSQL / Supabase.'
    );
  }

  console.log('--- Iniciando Seed Idempotente de Punto Burger ---');
  const sql = postgres(connectionUrl, { max: 1 });
  const db = drizzle(sql, { schema });

  try {
    // 1. Venue oficial: Punto Burger Esperanza
    console.log('1. Sembrando Venue oficial...');
    let [venue] = await db
      .insert(schema.venues)
      .values({
        name: 'Punto Burger Esperanza',
        slug: 'esperanza-central',
        timezone: 'America/Argentina/Cordoba',
        status: 'active',
      })
      .onConflictDoNothing({ target: schema.venues.slug })
      .returning();

    if (!venue) {
      const existing = await db
        .select()
        .from(schema.venues)
        .where(eq(schema.venues.slug, 'esperanza-central'))
        .limit(1);
      venue = existing[0];
    }

    if (!venue) {
      throw new Error('Fallo crítico al recuperar o crear el venue oficial.');
    }
    console.log(`✓ Venue: ${venue.name} (${venue.id})`);

    // 2. Mesa 01 oficial
    console.log('2. Sembrando Mesa 01...');
    let [table] = await db
      .insert(schema.tables)
      .values({
        venueId: venue.id,
        code: 'mesa-01',
        displayName: 'Mesa 01',
        status: 'available',
        qrToken: 'pb_mesa_01_esperanza_central',
      })
      .onConflictDoNothing({ target: [schema.tables.venueId, schema.tables.code] })
      .returning();

    if (!table) {
      const existing = await db
        .select()
        .from(schema.tables)
        .where(eq(schema.tables.code, 'mesa-01'))
        .limit(1);
      table = existing[0];
    }
    console.log(`✓ Mesa: ${table?.displayName ?? 'mesa-01'} (${table?.code})`);

    // 3. Categorías
    console.log('3. Sembrando Categorías de Trivia...');
    const categoryMap = new Map<string, string>();

    for (const cat of seedCategories) {
      const [inserted] = await db
        .insert(schema.categories)
        .values({
          slug: cat.slug,
          name: cat.name,
          description: cat.description,
          status: cat.status,
          sortOrder: cat.sortOrder,
        })
        .onConflictDoNothing({ target: schema.categories.slug })
        .returning();

      if (inserted) {
        categoryMap.set(cat.slug, inserted.id);
      } else {
        const [existing] = await db
          .select()
          .from(schema.categories)
          .where(eq(schema.categories.slug, cat.slug))
          .limit(1);
        if (existing) {
          categoryMap.set(cat.slug, existing.id);
        }
      }
    }
    console.log(`✓ ${categoryMap.size} Categorías activas verificadas.`);

    // 4. Banco de preguntas aprobadas
    console.log('4. Sembrando Banco de Preguntas Aprobadas...');
    let insertedQuestionsCount = 0;
    let existingQuestionsCount = 0;

    for (const q of seedQuestions) {
      const categoryId = categoryMap.get(q.categorySlug);
      if (!categoryId) {
        console.warn(`Categoría no encontrada para slug: ${q.categorySlug}`);
        continue;
      }

      // Comprobar idempotencia por prompt + categoría
      const [existing] = await db
        .select()
        .from(schema.questions)
        .where(eq(schema.questions.prompt, q.prompt))
        .limit(1);

      if (existing) {
        existingQuestionsCount++;
        continue;
      }

      await db.insert(schema.questions).values({
        categoryId,
        prompt: q.prompt,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctOption: q.correctOption,
        difficulty: q.difficulty,
        ageRange: q.ageRange,
        educationLevel: q.educationLevel,
        explanation: q.explanation,
        status: q.status,
      });
      insertedQuestionsCount++;
    }

    console.log(
      `✓ Preguntas: ${insertedQuestionsCount} insertadas, ${existingQuestionsCount} ya existentes (Total: ${seedQuestions.length}).`
    );
    console.log('--- Seed completado exitosamente ---');
  } finally {
    await sql.end();
  }
}

// Ejecución directa si se invoca desde CLI
if (process.argv[1]?.includes('seeds/index.ts')) {
  runSeeds()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error durante la ejecución del seed:', err);
      process.exit(1);
    });
}
