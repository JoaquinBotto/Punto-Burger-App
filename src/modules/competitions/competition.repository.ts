import { and, eq, desc, sql } from 'drizzle-orm';
import type { DbClient } from '@/db/client';
import {
  competitions,
  competitionBlueprintSlots,
  competitionEntries,
  competitionRounds,
  gameSessions,
  gameQuestions,
  tables,
  groups,
  type Competition,
  type NewCompetition,
  type CompetitionBlueprintSlot,
  type NewCompetitionBlueprintSlot,
  type CompetitionEntry,
  type NewCompetitionEntry,
  type CompetitionRound,
  type NewCompetitionRound,
} from '@/db/schema';
import type { CompetitionStatus, CompetitionEntryStatus } from './types';

export async function getCompetitionById(db: DbClient, id: string): Promise<Competition | null> {
  const [comp] = await db.select().from(competitions).where(eq(competitions.id, id)).limit(1);
  return comp ?? null;
}

export async function getCompetitionByVenueAndDate(
  db: DbClient,
  venueId: string,
  localDate: string
): Promise<Competition | null> {
  const [comp] = await db
    .select()
    .from(competitions)
    .where(
      and(
        eq(competitions.venueId, venueId),
        eq(competitions.localDate, localDate),
        sql`status != 'cancelled'`
      )
    )
    .orderBy(desc(competitions.createdAt))
    .limit(1);
  return comp ?? null;
}

export async function createCompetitionRecord(
  db: DbClient,
  data: NewCompetition
): Promise<Competition> {
  const [comp] = await db.insert(competitions).values(data).returning();
  if (!comp) {
    throw new Error('Fallo al crear el registro de competencia.');
  }
  return comp;
}

export async function updateCompetitionStatus(
  db: DbClient,
  competitionId: string,
  status: CompetitionStatus
): Promise<Competition | null> {
  const [comp] = await db
    .update(competitions)
    .set({ status, updatedAt: new Date() })
    .where(eq(competitions.id, competitionId))
    .returning();
  return comp ?? null;
}

export async function createCompetitionBlueprintSlots(
  db: DbClient,
  slots: NewCompetitionBlueprintSlot[]
): Promise<CompetitionBlueprintSlot[]> {
  if (slots.length === 0) return [];
  return db.insert(competitionBlueprintSlots).values(slots).returning();
}

export async function getCompetitionBlueprintSlots(
  db: DbClient,
  competitionId: string,
  roundNumber?: number
): Promise<CompetitionBlueprintSlot[]> {
  const conditions = [eq(competitionBlueprintSlots.competitionId, competitionId)];
  if (roundNumber !== undefined) {
    conditions.push(eq(competitionBlueprintSlots.roundNumber, roundNumber));
  }

  return db
    .select()
    .from(competitionBlueprintSlots)
    .where(and(...conditions))
    .orderBy(competitionBlueprintSlots.roundNumber, competitionBlueprintSlots.position);
}

export async function getCompetitionEntry(
  db: DbClient,
  competitionId: string,
  tableId: string
): Promise<CompetitionEntry | null> {
  const [entry] = await db
    .select()
    .from(competitionEntries)
    .where(
      and(
        eq(competitionEntries.competitionId, competitionId),
        eq(competitionEntries.tableId, tableId)
      )
    )
    .limit(1);
  return entry ?? null;
}

export async function getCompetitionEntryByTableSessionId(
  db: DbClient,
  tableSessionId: string
): Promise<CompetitionEntry | null> {
  const [entry] = await db
    .select()
    .from(competitionEntries)
    .where(eq(competitionEntries.tableSessionId, tableSessionId))
    .limit(1);
  return entry ?? null;
}

export async function createCompetitionEntry(
  db: DbClient,
  data: NewCompetitionEntry
): Promise<CompetitionEntry> {
  const [entry] = await db.insert(competitionEntries).values(data).returning();
  if (!entry) {
    throw new Error('Fallo al inscribir la mesa en la competencia.');
  }
  return entry;
}

export async function updateCompetitionEntryStatus(
  db: DbClient,
  entryId: string,
  status: CompetitionEntryStatus,
  completedAt?: Date | null
): Promise<CompetitionEntry | null> {
  const updateData: Partial<CompetitionEntry> = {
    status,
    updatedAt: new Date(),
  };
  if (completedAt !== undefined) {
    updateData.completedAt = completedAt;
  }

  const [entry] = await db
    .update(competitionEntries)
    .set(updateData)
    .where(eq(competitionEntries.id, entryId))
    .returning();
  return entry ?? null;
}

export async function createCompetitionRound(
  db: DbClient,
  data: NewCompetitionRound
): Promise<CompetitionRound> {
  const [round] = await db.insert(competitionRounds).values(data).returning();
  if (!round) {
    throw new Error('Fallo al crear la ronda de competencia.');
  }
  return round;
}

export async function getCompetitionRounds(
  db: DbClient,
  entryId: string
): Promise<Array<CompetitionRound & { gameSession: typeof gameSessions.$inferSelect }>> {
  const rows = await db
    .select({
      round: competitionRounds,
      gameSession: gameSessions,
    })
    .from(competitionRounds)
    .innerJoin(gameSessions, eq(competitionRounds.gameSessionId, gameSessions.id))
    .where(eq(competitionRounds.competitionEntryId, entryId))
    .orderBy(competitionRounds.roundNumber);

  return rows.map((r) => ({
    ...r.round,
    gameSession: r.gameSession,
  }));
}

/**
 * Retorna todos los IDs de preguntas que ya fueron asignados a esta entrada de mesa
 * en cualquiera de sus rondas preparadas.
 */
export async function getUsedQuestionIdsForEntry(
  db: DbClient,
  entryId: string
): Promise<Set<string>> {
  const rows = await db
    .select({ questionId: gameQuestions.questionId })
    .from(competitionRounds)
    .innerJoin(gameQuestions, eq(competitionRounds.gameSessionId, gameQuestions.gameSessionId))
    .where(eq(competitionRounds.competitionEntryId, entryId));

  return new Set(rows.map((r) => r.questionId));
}

/**
 * Obtiene todas las entradas con sus rondas completadas para calcular el ranking de una competencia.
 */
export async function getCompetitionEntriesWithRounds(db: DbClient, competitionId: string) {
  return db
    .select({
      entry: competitionEntries,
      table: tables,
      group: groups,
    })
    .from(competitionEntries)
    .innerJoin(tables, eq(competitionEntries.tableId, tables.id))
    .innerJoin(groups, eq(competitionEntries.groupId, groups.id))
    .where(eq(competitionEntries.competitionId, competitionId));
}
