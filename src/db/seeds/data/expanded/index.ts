import { culturaGeneralExpanded } from './cultura-general';
import { deportesExpanded } from './deportes';
import { cienciaNaturalezaExpanded } from './ciencia-naturaleza';
import { geografiaExpanded } from './geografia';
import { historiaExpanded } from './historia';
import { entretenimientoExpanded } from './entretenimiento';
import type { QuestionSeedItem } from './types';
import type { SeedQuestion } from '../questions';

export function toSeedQuestion(item: QuestionSeedItem): SeedQuestion {
  const correctIdx = item.options.findIndex((o) => o.isCorrect);
  if (correctIdx === -1) {
    throw new Error(`Question has no correct option: ${item.prompt}`);
  }
  const optionLetters = ['A', 'B', 'C', 'D'] as const;
  const correctOption = optionLetters[correctIdx];
  if (!correctOption) {
    throw new Error(`Invalid option index: ${correctIdx} for ${item.prompt}`);
  }

  return {
    categorySlug: item.categorySlug,
    prompt: item.prompt,
    optionA: item.options[0].text,
    optionB: item.options[1].text,
    optionC: item.options[2].text,
    optionD: item.options[3].text,
    correctOption,
    difficulty: item.difficulty,
    ageRange: item.ageRange,
    educationLevel: item.educationLevel,
    explanation: item.explanation,
    status: 'approved',
  };
}

export const expandedSeedQuestions: SeedQuestion[] = [
  ...culturaGeneralExpanded,
  ...deportesExpanded,
  ...cienciaNaturalezaExpanded,
  ...geografiaExpanded.map(toSeedQuestion),
  ...historiaExpanded.map(toSeedQuestion),
  ...entretenimientoExpanded.map(toSeedQuestion),
];
