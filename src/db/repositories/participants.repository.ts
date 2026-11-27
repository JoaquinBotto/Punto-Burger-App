import { asc, eq } from 'drizzle-orm';
import type { DbClient } from '../client';
import { participants, type Participant } from '../schema/participants';

export async function getParticipantsByGroupId(
  db: DbClient,
  groupId: string
): Promise<Participant[]> {
  return db
    .select()
    .from(participants)
    .where(eq(participants.groupId, groupId))
    .orderBy(asc(participants.position));
}

export interface ReplaceParticipantInput {
  alias: string;
  ageRange: string;
  educationLevel?: string | null;
  position: number;
}

export async function replaceGroupParticipants(
  db: DbClient,
  groupId: string,
  items: ReplaceParticipantInput[]
): Promise<Participant[]> {
  const existing = await getParticipantsByGroupId(db, groupId);

  // Si la lista es semánticamente idéntica, retornar la existente sin cambios ni queries innecesarias
  if (existing.length === items.length) {
    const isIdentical = items.every((item, idx) => {
      const ex = existing[idx];
      return (
        ex &&
        ex.alias.trim() === item.alias.trim() &&
        ex.ageRange === item.ageRange &&
        (ex.educationLevel ?? null) === (item.educationLevel ?? null) &&
        ex.position === item.position
      );
    });

    if (isIdentical) {
      return existing;
    }
  }

  // Actualizar participantes en sus posiciones existentes para mantener IDs estables
  const result: Participant[] = [];
  const commonLength = Math.min(existing.length, items.length);

  for (let i = 0; i < commonLength; i++) {
    const ex = existing[i]!;
    const item = items[i]!;
    const needsUpdate =
      ex.alias.trim() !== item.alias.trim() ||
      ex.ageRange !== item.ageRange ||
      (ex.educationLevel ?? null) !== (item.educationLevel ?? null) ||
      ex.position !== item.position;

    if (needsUpdate) {
      const [updated] = await db
        .update(participants)
        .set({
          alias: item.alias.trim(),
          ageRange: item.ageRange,
          educationLevel: item.educationLevel ?? null,
          position: item.position,
        })
        .where(eq(participants.id, ex.id))
        .returning();
      if (updated) {
        result.push(updated);
      }
    } else {
      result.push(ex);
    }
  }

  // Si hay más items nuevos que existentes, insertar los adicionales
  if (items.length > existing.length) {
    const toInsert = items.slice(existing.length).map((item) => ({
      groupId,
      alias: item.alias.trim(),
      ageRange: item.ageRange,
      educationLevel: item.educationLevel ?? null,
      position: item.position,
    }));
    const inserted = await db.insert(participants).values(toInsert).returning();
    result.push(...inserted);
  }

  // Si hay menos items nuevos que existentes, eliminar los sobrantes
  if (existing.length > items.length) {
    const toRemove = existing.slice(items.length);
    for (const p of toRemove) {
      await db.delete(participants).where(eq(participants.id, p.id));
    }
  }

  return result.sort((a, b) => a.position - b.position);
}

export async function getParticipantById(db: DbClient, id: string): Promise<Participant | null> {
  const [result] = await db.select().from(participants).where(eq(participants.id, id)).limit(1);
  return result ?? null;
}
