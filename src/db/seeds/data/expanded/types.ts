export interface QuestionOptionSeed {
  text: string;
  isCorrect: boolean;
}

export interface QuestionSeedItem {
  categorySlug: string;
  prompt: string;
  difficulty: 'initial' | 'medium' | 'advanced';
  ageRange: 'child' | 'teen' | 'adult' | 'general';
  educationLevel: 'primary' | 'secondary' | 'higher' | null;
  options: [QuestionOptionSeed, QuestionOptionSeed, QuestionOptionSeed, QuestionOptionSeed];
  explanation: string;
}
