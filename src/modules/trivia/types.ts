import type { QuestionDifficulty } from './constants';
import type { Question } from '../../db/schema/questions';

export interface SlotAssignment {
  position: number;
  difficulty: QuestionDifficulty;
  targetParticipantId: string | null;
  targetAlias: string | null;
  targetAgeRange: string;
  targetEducationLevel: string | null;
  isGroup: boolean;
}

export interface SelectedQuestionSlot {
  slot: SlotAssignment;
  question: Question;
}

export interface GamePreparationResult {
  ok: true;
  game: {
    status: string;
    prepared: boolean;
    questionCount: number;
    category: {
      slug: string;
      name: string;
    };
  };
  next: string;
}

export interface PlayPageData {
  table: {
    code: string;
    displayName: string;
  };
  group: {
    name: string;
    participantCount: number;
  };
  category: {
    slug: string;
    name: string;
  };
  structure: {
    initial: number;
    medium: number;
    advanced: number;
    total: number;
  };
  gameStatus: string;
  isPrepared: boolean;
}
