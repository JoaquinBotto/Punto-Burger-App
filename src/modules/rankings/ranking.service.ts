import { sql } from 'drizzle-orm';
import type { Database, DbClient } from '@/db/client';
import { resolveSessionFromCookie } from '@/modules/sessions';
import { getTableById } from '@/db/repositories/tables.repository';
import {
  OFFICIAL_RANKING_TIMEZONE,
  type DailyRankingEntry,
  type TableRankingContext,
} from './types';

/**
 * Retorna los límites de tiempo UTC (inicio y fin) para el día civil en la zona horaria oficial del local.
 * America/Argentina/Cordoba no observa horario de verano (UTC-3 permanente).
 */
export function getDailyDateRange(
  date = new Date(),
  timezone = OFFICIAL_RANKING_TIMEZONE
): { dateString: string; startOfDay: Date; endOfDay: Date } {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const dateString = formatter.format(date); // YYYY-MM-DD

  // Offset constante -03:00 para Argentina
  const startOfDay = new Date(`${dateString}T00:00:00.000-03:00`);
  const endOfDay = new Date(`${dateString}T23:59:59.999-03:00`);

  return { dateString, startOfDay, endOfDay };
}

interface RawRankingRow extends Record<string, unknown> {
  position: number | string;
  table_id: string;
  table_code: string;
  table_display_name: string;
  game_session_id: string;
  total_score: number | string;
  correct_count: number | string;
  total_response_time_ms: number | string;
  finished_at: string | Date;
}

/**
 * Obtiene el ranking diario oficial de mesas en Punto Burger.
 * Cada mesa física aparece a lo sumo una vez por día (su mejor partida completada y elegible).
 * Criterios de orden:
 * 1. Mayor total_score
 * 2. Mayor correct_count
 * 3. Menor total_response_time_ms (tiempo total sumado de preguntas efectivamente contestadas)
 * 4. Menor finished_at (partida completada más temprano)
 */
export async function getDailyRanking(
  db: DbClient,
  options?: { date?: Date; limit?: number }
): Promise<DailyRankingEntry[]> {
  const { startOfDay, endOfDay } = getDailyDateRange(options?.date);
  const limit = options?.limit ?? 10;

  const result = await db.execute<RawRankingRow>(sql`
    WITH eligible_games AS (
      SELECT
        gs.id AS game_session_id,
        ts.table_id,
        t.code AS table_code,
        t.display_name AS table_display_name,
        gs.total_score,
        gs.correct_count,
        gs.finished_at,
        COALESCE(rt.total_response_time_ms, 0) AS total_response_time_ms,
        ROW_NUMBER() OVER (
          PARTITION BY ts.table_id
          ORDER BY
            gs.total_score DESC,
            gs.correct_count DESC,
            COALESCE(rt.total_response_time_ms, 0) ASC,
            gs.finished_at ASC
        ) AS table_rank
      FROM game_sessions gs
      JOIN table_sessions ts ON ts.id = gs.table_session_id
      JOIN tables t ON t.id = ts.table_id
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
          ), 0)::bigint AS total_response_time_ms
        FROM answers a
        JOIN game_questions gq ON gq.id = a.game_question_id
        GROUP BY a.game_session_id
      ) rt ON rt.game_session_id = gs.id
      WHERE gs.status = 'completed'
        AND gs.ranking_eligible = true
        AND gs.finished_at >= ${startOfDay.toISOString()}
        AND gs.finished_at <= ${endOfDay.toISOString()}
    )
    SELECT
      ROW_NUMBER() OVER (
        ORDER BY
          total_score DESC,
          correct_count DESC,
          total_response_time_ms ASC,
          finished_at ASC
      )::int AS position,
      table_id,
      table_code,
      table_display_name,
      game_session_id,
      total_score,
      correct_count,
      total_response_time_ms,
      finished_at
    FROM eligible_games
    WHERE table_rank = 1
    ORDER BY position ASC
    LIMIT ${limit};
  `);

  const rows = Array.from(result) as unknown as RawRankingRow[];

  return rows.map((row) => ({
    position: Number(row.position),
    table: {
      id: row.table_id,
      code: row.table_code,
      name: row.table_display_name,
    },
    score: Number(row.total_score),
    correctCount: Number(row.correct_count),
    totalResponseTimeMs: Number(row.total_response_time_ms),
    finishedAt: new Date(row.finished_at),
    gameSessionId: row.game_session_id,
  }));
}

/**
 * Obtiene el ranking completo (sin límite) para un día determinado.
 * Utilizado para posicionamiento contextual (incluso fuera del Top 10).
 */
export async function getFullDailyRanking(db: DbClient, date?: Date): Promise<DailyRankingEntry[]> {
  const { startOfDay, endOfDay } = getDailyDateRange(date);

  const result = await db.execute<RawRankingRow>(sql`
    WITH eligible_games AS (
      SELECT
        gs.id AS game_session_id,
        ts.table_id,
        t.code AS table_code,
        t.display_name AS table_display_name,
        gs.total_score,
        gs.correct_count,
        gs.finished_at,
        COALESCE(rt.total_response_time_ms, 0) AS total_response_time_ms,
        ROW_NUMBER() OVER (
          PARTITION BY ts.table_id
          ORDER BY
            gs.total_score DESC,
            gs.correct_count DESC,
            COALESCE(rt.total_response_time_ms, 0) ASC,
            gs.finished_at ASC
        ) AS table_rank
      FROM game_sessions gs
      JOIN table_sessions ts ON ts.id = gs.table_session_id
      JOIN tables t ON t.id = ts.table_id
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
          ), 0)::bigint AS total_response_time_ms
        FROM answers a
        JOIN game_questions gq ON gq.id = a.game_question_id
        GROUP BY a.game_session_id
      ) rt ON rt.game_session_id = gs.id
      WHERE gs.status = 'completed'
        AND gs.ranking_eligible = true
        AND gs.finished_at >= ${startOfDay.toISOString()}
        AND gs.finished_at <= ${endOfDay.toISOString()}
    )
    SELECT
      ROW_NUMBER() OVER (
        ORDER BY
          total_score DESC,
          correct_count DESC,
          total_response_time_ms ASC,
          finished_at ASC
      )::int AS position,
      table_id,
      table_code,
      table_display_name,
      game_session_id,
      total_score,
      correct_count,
      total_response_time_ms,
      finished_at
    FROM eligible_games
    WHERE table_rank = 1
    ORDER BY position ASC;
  `);

  const rows = Array.from(result) as unknown as RawRankingRow[];

  return rows.map((row) => ({
    position: Number(row.position),
    table: {
      id: row.table_id,
      code: row.table_code,
      name: row.table_display_name,
    },
    score: Number(row.total_score),
    correctCount: Number(row.correct_count),
    totalResponseTimeMs: Number(row.total_response_time_ms),
    finishedAt: new Date(row.finished_at),
    gameSessionId: row.game_session_id,
  }));
}

/**
 * Obtiene el contexto de ranking para una mesa específica (incluso si está fuera del Top 10).
 */
export async function getTableDailyRanking(
  db: DbClient,
  tableId: string,
  currentGameSessionId?: string,
  date?: Date
): Promise<TableRankingContext> {
  const fullRanking = await getFullDailyRanking(db, date);
  const table = await getTableById(db, tableId);

  if (!table) {
    return {
      authenticated: false,
      ranked: false,
      position: null,
      table: null,
      bestScore: null,
      correctCount: null,
      gapToPrevious: null,
      previousPosition: null,
    };
  }

  const index = fullRanking.findIndex((entry) => entry.table.id === tableId);

  if (index === -1) {
    return {
      authenticated: true,
      ranked: false,
      position: null,
      table: {
        code: table.code,
        name: table.displayName,
      },
      bestScore: null,
      correctCount: null,
      gapToPrevious: null,
      previousPosition: null,
    };
  }

  const entry = fullRanking[index]!;
  let gapToPrevious: number | null = null;
  let previousPosition: number | null = null;

  if (index > 0) {
    const superiorEntry = fullRanking[index - 1]!;
    gapToPrevious = superiorEntry.score - entry.score;
    previousPosition = superiorEntry.position;
  }

  const isNewRecord = currentGameSessionId
    ? entry.gameSessionId === currentGameSessionId
    : undefined;

  return {
    authenticated: true,
    ranked: true,
    position: entry.position,
    table: {
      code: table.code,
      name: table.displayName,
    },
    bestScore: entry.score,
    correctCount: entry.correctCount,
    gapToPrevious,
    previousPosition,
    isNewRecord,
  };
}

/**
 * Obtiene el contexto de ranking para la sesión activa en el navegador.
 */
export async function getTableDailyRankingFromSessionCookie(
  db: Database,
  rawCookieToken: string | undefined,
  currentGameSessionId?: string,
  date = new Date()
): Promise<TableRankingContext> {
  if (!rawCookieToken || rawCookieToken.trim() === '') {
    return {
      authenticated: false,
      ranked: false,
      position: null,
      table: null,
      bestScore: null,
      correctCount: null,
      gapToPrevious: null,
      previousPosition: null,
    };
  }

  const resolved = await resolveSessionFromCookie(db, rawCookieToken, date);
  if (!resolved) {
    return {
      authenticated: false,
      ranked: false,
      position: null,
      table: null,
      bestScore: null,
      correctCount: null,
      gapToPrevious: null,
      previousPosition: null,
    };
  }

  return getTableDailyRanking(db, resolved.session.tableId, currentGameSessionId, date);
}
