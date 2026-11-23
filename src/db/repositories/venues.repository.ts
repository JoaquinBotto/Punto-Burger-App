import { eq } from 'drizzle-orm';
import type { Database } from '../client';
import { venues, type NewVenue, type Venue } from '../schema/venues';

export async function createVenue(db: Database, data: NewVenue): Promise<Venue> {
  const [created] = await db.insert(venues).values(data).returning();
  if (!created) {
    throw new Error('No se pudo crear el local.');
  }
  return created;
}

export async function getVenueBySlug(db: Database, slug: string): Promise<Venue | null> {
  const result = await db.select().from(venues).where(eq(venues.slug, slug)).limit(1);
  return result[0] ?? null;
}

export async function getVenueById(db: Database, id: string): Promise<Venue | null> {
  const result = await db.select().from(venues).where(eq(venues.id, id)).limit(1);
  return result[0] ?? null;
}
