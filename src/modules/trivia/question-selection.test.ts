import { describe, it, expect } from 'vitest';
import { scoreCompatibility, selectQuestionsForSlots } from './question-selection';
import { buildAssignmentPlan } from './assignment-plan';
import { QuestionPoolInsufficientError } from './errors';
import type { Question } from '../../db/schema/questions';
import type { Participant } from '../../db/schema/participants';

function makeMockQuestion(
  id: string,
  difficulty: 'initial' | 'medium' | 'advanced',
  ageRange = 'general',
  educationLevel: string | null = null,
  status: 'approved' | 'draft' | 'archived' = 'approved'
): Question {
  return {
    id,
    categoryId: 'cat-1',
    prompt: `Pregunta ${id}`,
    optionA: 'Opción A',
    optionB: 'Opción B',
    optionC: 'Opción C',
    optionD: 'Opción D',
    correctOption: 'A',
    difficulty,
    ageRange,
    educationLevel,
    explanation: 'Explicación',
    status,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('scoreCompatibility', () => {
  it('asigna puntaje máximo (5) para coincidencia exacta de ageRange y educationLevel', () => {
    const q = makeMockQuestion('q1', 'initial', 'teen', 'secondary');
    expect(scoreCompatibility(q, 'teen', 'secondary')).toBe(5);
  });

  it('asigna puntaje 4 para ageRange exacto sin restricción de educationLevel', () => {
    const q = makeMockQuestion('q1', 'initial', 'teen', null);
    expect(scoreCompatibility(q, 'teen', 'secondary')).toBe(4);
  });

  it('asigna puntaje 1 para fallback general (formato del seed actual)', () => {
    const q = makeMockQuestion('q1', 'initial', 'general', null);
    expect(scoreCompatibility(q, 'child', 'primary')).toBe(1);
    expect(scoreCompatibility(q, 'teen', 'secondary')).toBe(1);
    expect(scoreCompatibility(q, 'adult', 'higher')).toBe(1);
  });

  it('asigna puntaje 0 (incompatible) si la pregunta es de un rango etario diferente incompatible', () => {
    const q = makeMockQuestion('q1', 'initial', 'adult', 'higher');
    expect(scoreCompatibility(q, 'child', 'primary')).toBe(0);
  });
});

describe('selectQuestionsForSlots', () => {
  function generatePool(
    initialCount = 4,
    mediumCount = 4,
    advancedCount = 4,
    ageRange = 'general'
  ): Question[] {
    const list: Question[] = [];
    for (let i = 1; i <= initialCount; i++) {
      list.push(makeMockQuestion(`init-${i}`, 'initial', ageRange));
    }
    for (let i = 1; i <= mediumCount; i++) {
      list.push(makeMockQuestion(`med-${i}`, 'medium', ageRange));
    }
    for (let i = 1; i <= advancedCount; i++) {
      list.push(makeMockQuestion(`adv-${i}`, 'advanced', ageRange));
    }
    return list;
  }

  const mockParticipants: Participant[] = [
    {
      id: 'p1',
      groupId: 'g1',
      alias: 'Cata',
      ageRange: 'child',
      educationLevel: 'primary',
      position: 1,
      createdAt: new Date(),
    },
    {
      id: 'p2',
      groupId: 'g1',
      alias: 'Santi',
      ageRange: 'teen',
      educationLevel: 'secondary',
      position: 2,
      createdAt: new Date(),
    },
  ];

  it('selecciona exactamente 10 preguntas con distribución 3/4/3 y sin duplicados usando fallback general', () => {
    const candidates = generatePool(4, 4, 4, 'general');
    const plan = buildAssignmentPlan(mockParticipants);

    const selected = selectQuestionsForSlots(candidates, plan);

    expect(selected).toHaveLength(10);

    // 3 initial, 4 medium, 3 advanced
    const initial = selected.slice(0, 3);
    const medium = selected.slice(3, 7);
    const advanced = selected.slice(7, 10);

    expect(initial.every((s) => s.question.difficulty === 'initial')).toBe(true);
    expect(medium.every((s) => s.question.difficulty === 'medium')).toBe(true);
    expect(advanced.every((s) => s.question.difficulty === 'advanced')).toBe(true);

    // Unicidad absoluta de questionId
    const uniqueIds = new Set(selected.map((s) => s.question.id));
    expect(uniqueIds.size).toBe(10);
  });

  it('lanza QuestionPoolInsufficientError si faltan preguntas initial (< 3)', () => {
    const candidates = generatePool(2, 4, 4);
    const plan = buildAssignmentPlan(mockParticipants);

    expect(() => selectQuestionsForSlots(candidates, plan)).toThrow(QuestionPoolInsufficientError);
  });

  it('lanza QuestionPoolInsufficientError si faltan preguntas medium (< 4)', () => {
    const candidates = generatePool(4, 3, 4);
    const plan = buildAssignmentPlan(mockParticipants);

    expect(() => selectQuestionsForSlots(candidates, plan)).toThrow(QuestionPoolInsufficientError);
  });

  it('lanza QuestionPoolInsufficientError si faltan preguntas advanced (< 3)', () => {
    const candidates = generatePool(4, 4, 2);
    const plan = buildAssignmentPlan(mockParticipants);

    expect(() => selectQuestionsForSlots(candidates, plan)).toThrow(QuestionPoolInsufficientError);
  });

  it('ignora preguntas que no tienen status approved', () => {
    const candidates = generatePool(4, 4, 4);
    // Cambiar una initial a draft, dejando solo 3 aprobadas
    candidates[0]!.status = 'draft';

    const plan = buildAssignmentPlan(mockParticipants);
    const selected = selectQuestionsForSlots(candidates, plan);

    expect(selected).toHaveLength(10);
    expect(selected.every((s) => s.question.status === 'approved')).toBe(true);
  });

  it('permite inyectar un RNG determinista para reproducibilidad de tests', () => {
    const candidates = generatePool(4, 4, 4);
    const plan = buildAssignmentPlan(mockParticipants);

    // RNG fijo que siempre devuelve 0 (primer candidato disponible)
    const fixedRng = () => 0;
    const selected1 = selectQuestionsForSlots(candidates, plan, fixedRng);
    const selected2 = selectQuestionsForSlots(candidates, plan, fixedRng);

    const ids1 = selected1.map((s) => s.question.id);
    const ids2 = selected2.map((s) => s.question.id);

    expect(ids1).toEqual(ids2);
  });
});
