export type CompetitionStatus = 'scheduled' | 'active' | 'finalized' | 'cancelled';
export type CompetitionEntryStatus =
  'registered' | 'active' | 'completed' | 'abandoned' | 'disqualified';

export interface CompetitionBlueprintSlotData {
  roundNumber: number;
  position: number;
  difficulty: 'initial' | 'medium' | 'advanced';
  categoryId: string;
}

export interface CompetitionRankingEntry {
  position: number;
  table: string; // e.g. 'Mesa 01'
  tableCode: string;
  totalScore: number;
  roundsCompleted: number; // 0..3
  correctCount: number;
  totalResponseTimeMs: number;
  completedAt: string | null;
  joinedAt: string;
}

export interface CompetitionStateResponse {
  competition: {
    id: string;
    name: string | null;
    status: CompetitionStatus;
    localDate: string;
    startsAt: string;
    endsAt: string;
    registrationOpensAt: string;
    joinCutoffAt: string;
    finalizationGraceUntil: string;
    isTest: boolean;
  } | null;
  entry: {
    id: string;
    status: CompetitionEntryStatus;
    currentRoundNumber: number;
    currentRoundStatus?: 'created' | 'active' | 'completed';
    completedRounds: number;
    roundScores: number[];
    totalScore: number;
    joinedAt: string;
    completedAt: string | null;
  } | null;
  activeGameSessionId?: string | null;
  presence: {
    mode: 'off' | 'observe' | 'enforce';
    verified: boolean;
    required: boolean;
  };
}
