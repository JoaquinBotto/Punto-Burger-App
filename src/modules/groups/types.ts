import type { GroupSetupInput, ParticipantInput } from './validation';
import type { CanonicalAgeRange, CanonicalEducationLevel } from './constants';
import type { Category } from '../../db/schema/categories';
import type { Group } from '../../db/schema/groups';
import type { Participant } from '../../db/schema/participants';
import type { GameSession } from '../../db/schema/game-sessions';

export type { GroupSetupInput, ParticipantInput, CanonicalAgeRange, CanonicalEducationLevel };

export interface CategoryReadinessInfo {
  isReady: boolean;
  initialCount: number;
  mediumCount: number;
  advancedCount: number;
}

export type CategoryWithReadiness = Category & {
  isReady: boolean;
};

export interface GroupSetupResult {
  ok: true;
  group: {
    id: string;
    name: string;
  };
  participants: Array<{
    id: string;
    alias: string;
    ageRange: string;
    educationLevel: string | null;
    position: number;
  }>;
  gameSession: {
    id: string;
    status: 'created';
    categoryId: string | null;
    categoryName: string;
    categorySlug: string;
  };
  next: string;
}

export interface ExistingGroupSetup {
  group: Group;
  participants: Participant[];
  gameSession: GameSession & {
    category: Category | null;
  };
}

export interface PlaySetupInitialData {
  table: {
    id: string;
    code: string;
    displayName: string;
  };
  venue: {
    id: string;
    name: string;
    slug: string;
  };
  categories: CategoryWithReadiness[];
  existingSetup: {
    groupName: string;
    participants: Array<{
      alias: string;
      ageRange: CanonicalAgeRange;
      educationLevel: CanonicalEducationLevel | null;
      position: number;
    }>;
    categorySlug: string;
    isSaved: boolean;
  } | null;
}
