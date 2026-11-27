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
  gameId?: string;
  mode: 'casual' | 'competition';
  competition?: {
    id: string;
    name: string | null;
  };
  roundNumber?: 1 | 2 | 3;
}

export interface ActiveQuestionView {
  position: number;
  difficulty: QuestionDifficulty;
  targetAlias: string | null;
  isGroup: boolean;
  prompt: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  presentedAt: string | null;
  expiresAt: string | null;
  serverNow: string;
  questionId?: string;
}

export interface AnswerFeedbackView {
  result: 'correct' | 'incorrect' | 'unanswered';
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
  correctOption: 'A' | 'B' | 'C' | 'D';
  explanation: string | null;
  pointsAwarded: number;
  totalScore: number;
}

export interface GameStateResult {
  ok: true;
  game: {
    id: string;
    status: 'created' | 'active' | 'completed' | 'abandoned' | 'invalidated';
    currentQuestionIndex: number;
    currentPosition: number;
    totalQuestions: number;
    totalScore: number;
    correctCount: number;
    incorrectCount: number;
    unansweredCount: number;
    category: {
      slug: string;
      name: string;
    };
    group: {
      name: string;
    };
    table: {
      code: string;
      displayName: string;
    };
  };
  question: ActiveQuestionView | null;
  feedback: AnswerFeedbackView | null;
  isResolved: boolean;
  next?: string;
}

export interface StartGameResult {
  ok: true;
  game: {
    id: string;
    status: 'active';
    currentQuestionIndex: number;
    currentPosition: number;
  };
  question: ActiveQuestionView;
}

export interface SubmitAnswerResult {
  ok: true;
  answer: AnswerFeedbackView;
  isLastQuestion: boolean;
}

export interface AdvanceGameResult {
  ok: true;
  advanced: boolean;
  completed: boolean;
  next?: string;
  currentQuestionIndex?: number;
  currentPosition?: number;
  question?: ActiveQuestionView;
}

export interface DifficultyBreakdown {
  initial: {
    total: number;
    correct: number;
    score: number;
    maxScore: number;
  };
  medium: {
    total: number;
    correct: number;
    score: number;
    maxScore: number;
  };
  advanced: {
    total: number;
    correct: number;
    score: number;
    maxScore: number;
  };
}

export interface GameResultsView {
  ok: true;
  game: {
    id: string;
    status: 'completed';
    startedAt: string | null;
    finishedAt: string | null;
    totalScore: number;
    maxScore: number;
    correctCount: number;
    incorrectCount: number;
    unansweredCount: number;
    category: {
      slug: string;
      name: string;
    };
    group: {
      name: string;
    };
    table: {
      code: string;
      displayName: string;
    };
    breakdown: DifficultyBreakdown;
  };
}
