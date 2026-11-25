import { eq } from 'drizzle-orm';
import type { DbClient } from '../client';
import { groups, type Group, type NewGroup } from '../schema/groups';

export async function getGroupByTableSessionId(
  db: DbClient,
  tableSessionId: string
): Promise<Group | null> {
  const result = await db
    .select()
    .from(groups)
    .where(eq(groups.tableSessionId, tableSessionId))
    .limit(1);

  return result[0] ?? null;
}

export async function createGroup(db: DbClient, data: NewGroup): Promise<Group> {
  const [created] = await db.insert(groups).values(data).returning();
  if (!created) {
    throw new Error('No se pudo crear el grupo.');
  }
  return created;
}

export async function updateGroupName(db: DbClient, groupId: string, name: string): Promise<Group> {
  const [updated] = await db
    .update(groups)
    .set({
      name,
      updatedAt: new Date(),
    })
    .where(eq(groups.id, groupId))
    .returning();

  if (!updated) {
    throw new Error('No se pudo actualizar el nombre del grupo.');
  }
  return updated;
}
