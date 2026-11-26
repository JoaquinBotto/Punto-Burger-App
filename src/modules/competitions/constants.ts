export const OFFICIAL_TIMEZONE = 'America/Argentina/Cordoba';

export const ROUND_1_MAX_SCORE = 1300;
export const ROUND_2_MAX_SCORE = 1500;
export const ROUND_3_MAX_SCORE = 1700;
export const TOTAL_COMPETITION_MAX_SCORE = 4500;

export const COMPETITION_ROUND_DIFFICULTIES: Record<
  1 | 2 | 3,
  Array<'initial' | 'medium' | 'advanced'>
> = {
  // Ciclo 1: 5 initial, 4 medium, 1 advanced (Pos 1-5 initial, 6-9 medium, 10 advanced)
  1: [
    'initial',
    'initial',
    'initial',
    'initial',
    'initial',
    'medium',
    'medium',
    'medium',
    'medium',
    'advanced',
  ],
  // Ciclo 2: 3 initial, 4 medium, 3 advanced (Pos 1-3 initial, 4-7 medium, 8-10 advanced)
  2: [
    'initial',
    'initial',
    'initial',
    'medium',
    'medium',
    'medium',
    'medium',
    'advanced',
    'advanced',
    'advanced',
  ],
  // Ciclo 3: 1 initial, 4 medium, 5 advanced (Pos 1 initial, 2-5 medium, 6-10 advanced)
  3: [
    'initial',
    'medium',
    'medium',
    'medium',
    'medium',
    'advanced',
    'advanced',
    'advanced',
    'advanced',
    'advanced',
  ],
};

export const DEFAULT_REGISTRATION_MINUTES_BEFORE = 15;
export const DEFAULT_JOIN_CUTOFF_MINUTES_BEFORE_END = 30;
export const DEFAULT_GRACE_MINUTES = 10;
