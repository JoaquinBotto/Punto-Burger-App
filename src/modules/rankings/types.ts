export const OFFICIAL_RANKING_TIMEZONE = 'America/Argentina/Cordoba';

export interface DailyRankingEntry {
  position: number;
  table: {
    id?: string;
    code: string;
    name: string;
  };
  score: number;
  correctCount: number;
  totalResponseTimeMs: number;
  finishedAt: Date;
  gameSessionId?: string;
}

export interface PublicRankingTableItem {
  position: number;
  table: {
    code: string;
    name: string;
  };
  score: number;
  correctCount: number;
}

export interface PublicDailyRankingResponse {
  ok: true;
  date: string;
  timezone: string;
  generatedAt: string;
  ranking: PublicRankingTableItem[];
}

export interface TableRankingContext {
  authenticated: boolean;
  ranked: boolean;
  position: number | null;
  table: {
    code: string;
    name: string;
  } | null;
  bestScore: number | null;
  correctCount: number | null;
  gapToPrevious: number | null;
  previousPosition: number | null;
  isNewRecord?: boolean;
}
