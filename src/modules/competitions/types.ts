export type CompetitionStatus = 'scheduled' | 'active' | 'finalized' | 'cancelled';
export type CompetitionTimingMode = 'scheduled' | 'open';
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
  entryId: string;
  table: string; // e.g. 'Mesa 01'
  tableCode: string;
  groupName: string; // e.g. 'Los Bacon'
  displayName: string; // e.g. 'Mesa 01 · Los Bacon'
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
    timingMode: CompetitionTimingMode;
    localDate: string | null;
    startsAt: string | null;
    endsAt: string | null;
    registrationOpensAt: string | null;
    joinCutoffAt: string | null;
    finalizationGraceUntil: string | null;
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
