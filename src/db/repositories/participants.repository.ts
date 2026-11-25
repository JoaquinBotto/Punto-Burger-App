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
  // Eliminar participantes previos del grupo de forma controlada
  await db.delete(participants).where(eq(participants.groupId, groupId));

  if (items.length === 0) {
    return [];
  }

  // Insertar nueva lista asegurando posiciones 1..N
  const inserted = await db
    .insert(participants)
    .values(
      items.map((item) => ({
        groupId,
        alias: item.alias,
        ageRange: item.ageRange,
        educationLevel: item.educationLevel ?? null,
        position: item.position,
      }))
    )
    .returning();

  // Ordenar por position antes de devolver
  return inserted.sort((a, b) => a.position - b.position);
}
