import { sql } from 'drizzle-orm';
import type { DbClient } from '@/db/client';
import type { CompetitionRankingEntry } from './types';

interface RawCompetitionRankingRow extends Record<string, unknown> {
  position: number | string;
  entry_id: string;
  table_id: string;
  table_code: string;
  table_display_name: string;
  group_name: string | null;
  total_score: number | string;
  correct_count: number | string;
  rounds_completed: number | string;
  total_response_time_ms: number | string;
  completed_at: string | Date | null;
  joined_at: string | Date;
}

/**
 * Obtiene el ranking oficial en vivo o final de una competencia.
 *
 * Criterios de ordenamiento (Sección 34 SDD):
 * 1. Mayor totalScore (suma de puntuaciones de los ciclos completados)
 * 2. Mayor correctCount total acumulado
 * 3. Menor totalResponseTimeMs agregado
 * 4. entry completedAt más temprano (quien completó primero los 3 ciclos)
 * 5. joinedAt más temprano como fallback estable
 *
 * Sin PII: se expone únicamente el nombre de la mesa física (ej. 'Mesa 07').
 */
export async function getCompetitionRanking(
  db: DbClient,
  competitionId: string,
  limit = 30
): Promise<CompetitionRankingEntry[]> {
  const result = await db.execute(sql`
    WITH entry_rounds_summary AS (
      SELECT
        ce.id AS entry_id,
        ce.table_id,
        ce.joined_at,
        ce.completed_at,
        t.code AS table_code,
        t.display_name AS table_display_name,
        g.name AS group_name,
        COALESCE(COUNT(cr.id) FILTER (WHERE gs.status = 'completed'), 0)::int AS rounds_completed,
        COALESCE(SUM(gs.total_score) FILTER (WHERE gs.status = 'completed'), 0)::int AS total_score,
        COALESCE(SUM(gs.correct_count) FILTER (WHERE gs.status = 'completed'), 0)::int AS correct_count,
        COALESCE(SUM(rt.round_response_time_ms), 0)::bigint AS total_response_time_ms
      FROM competition_entries ce
      JOIN tables t ON t.id = ce.table_id
      JOIN groups g ON g.id = ce.group_id
      LEFT JOIN competition_rounds cr ON cr.competition_entry_id = ce.id
      LEFT JOIN game_sessions gs ON gs.id = cr.game_session_id AND gs.status = 'completed'
      LEFT JOIN (
        SELECT
          a.game_session_id,
          COALESCE(SUM(
            CASE
              WHEN a.result IN ('correct', 'incorrect')
                   AND a.answered_at IS NOT NULL
                   AND gq.presented_at IS NOT NULL
                   AND a.answered_at >= gq.presented_at
              THEN GREATEST(0, EXTRACT(EPOCH FROM (a.answered_at - gq.presented_at)) * 1000)
              ELSE 0
            END
          ), 0)::bigint AS round_response_time_ms
        FROM answers a
        JOIN game_questions gq ON gq.id = a.game_question_id
        GROUP BY a.game_session_id
      ) rt ON rt.game_session_id = gs.id
      WHERE ce.competition_id = ${competitionId}
        AND ce.status != 'disqualified'
      GROUP BY ce.id, ce.table_id, ce.joined_at, ce.completed_at, t.code, t.display_name, g.name
    )
    SELECT
      ROW_NUMBER() OVER (
        ORDER BY
          total_score DESC,
          correct_count DESC,
          total_response_time_ms ASC,
          completed_at ASC NULLS LAST,
          joined_at ASC
      )::int AS position,
      entry_id,
      table_id,
      table_code,
      table_display_name,
      group_name,
      total_score,
      correct_count,
      rounds_completed,
      total_response_time_ms,
      completed_at,
      joined_at
    FROM entry_rounds_summary
    ORDER BY position ASC
    LIMIT ${limit};
  `);

  const rows = Array.from(result) as unknown as RawCompetitionRankingRow[];

  return rows.map((row) => {
    const tableDisplayName = String(row.table_display_name);
    const groupName = String(row.group_name ?? '');
    return {
      position: Number(row.position),
      entryId: String(row.entry_id),
      table: tableDisplayName,
      tableCode: String(row.table_code),
      groupName,
      displayName: groupName ? `${tableDisplayName} · ${groupName}` : tableDisplayName,
      totalScore: Number(row.total_score),
      roundsCompleted: Number(row.rounds_completed),
      correctCount: Number(row.correct_count),
      totalResponseTimeMs: Number(row.total_response_time_ms),
      completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
      joinedAt: new Date(row.joined_at).toISOString(),
    };
  });
}
