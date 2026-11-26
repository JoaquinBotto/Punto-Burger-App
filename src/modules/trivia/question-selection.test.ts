import { describe, it, expect } from 'vitest';
import { selectQuestionsForSlots } from './question-selection';
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

function generateDiversePool(): Question[] {
  const list: Question[] = [];
  const ageVariants = ['child', 'teen', 'adult', 'general'];
  const eduVariants = ['primary', 'secondary', 'higher', null];

  // 20 initial
  for (let i = 1; i <= 20; i++) {
    const age = ageVariants[i % ageVariants.length]!;
    const edu = eduVariants[i % eduVariants.length]!;
    list.push(makeMockQuestion(`init-${i}`, 'initial', age, edu));
  }
  // 20 medium
  for (let i = 1; i <= 20; i++) {
    const age = ageVariants[i % ageVariants.length]!;
    const edu = eduVariants[i % eduVariants.length]!;
    list.push(makeMockQuestion(`med-${i}`, 'medium', age, edu));
  }
  // 20 advanced
  for (let i = 1; i <= 20; i++) {
    const age = ageVariants[i % ageVariants.length]!;
    const edu = eduVariants[i % eduVariants.length]!;
    list.push(makeMockQuestion(`adv-${i}`, 'advanced', age, edu));
  }
  return list;
}

describe('selectQuestionsForSlots (PPA-LAUNCH-001 Competitive Fairness)', () => {
  const candidates = generateDiversePool();

  it('TEST ANTI-EXPLOIT: perfil child/primary vs perfil adult/higher con mismo RNG produce EXACTAMENTE las mismas preguntas', () => {
    // Grupo A: niños de primaria
    const groupChild: Participant[] = [
      {
        id: 'p1-child',
        groupId: 'g-child',
        alias: 'Benja',
        ageRange: 'child',
        educationLevel: 'primary',
        position: 1,
        createdAt: new Date(),
      },
      {
        id: 'p2-child',
        groupId: 'g-child',
        alias: 'Sofi',
        ageRange: 'child',
        educationLevel: 'primary',
        position: 2,
        createdAt: new Date(),
      },
    ];

    // Grupo B: adultos con educación superior
    const groupAdult: Participant[] = [
      {
        id: 'p1-adult',
        groupId: 'g-adult',
        alias: 'Carlos',
        ageRange: 'adult',
        educationLevel: 'higher',
        position: 1,
        createdAt: new Date(),
      },
      {
        id: 'p2-adult',
        groupId: 'g-adult',
        alias: 'Mariana',
        ageRange: 'adult',
        educationLevel: 'higher',
        position: 2,
        createdAt: new Date(),
      },
    ];

    const planChild = buildAssignmentPlan(groupChild);
    const planAdult = buildAssignmentPlan(groupAdult);

    // Mismo RNG pseudoaleatorio determinista
    const seed = 42;
    const makeRng = () => {
      let s = seed;
      return () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
      };
    };

    const selectedChild = selectQuestionsForSlots(candidates, planChild, makeRng());
    const selectedAdult = selectQuestionsForSlots(candidates, planAdult, makeRng());

    const idsChild = selectedChild.map((s) => s.question.id);
    const idsAdult = selectedAdult.map((s) => s.question.id);

    // Deben ser 100% idénticos
    expect(idsChild).toEqual(idsAdult);
  });

  it('TEST EDUCATION LEVEL: comparar primary, secondary, higher y null con mismo RNG produce selecciones idénticas', () => {
    const levels = ['primary', 'secondary', 'higher', null];
    const results: string[][] = [];

    for (const level of levels) {
      const participants: Participant[] = [
        {
          id: 'p1',
          groupId: 'g1',
          alias: 'Jugador',
          ageRange: 'adult',
          educationLevel: level,
          position: 1,
          createdAt: new Date(),
        },
      ];
      const plan = buildAssignmentPlan(participants);

      let s = 12345;
      const deterministicRng = () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
      };

      const selected = selectQuestionsForSlots(candidates, plan, deterministicRng);
      results.push(selected.map((s) => s.question.id));
    }

    // Todos los niveles educativos producen exactamente la misma secuencia de preguntas
    expect(results[0]).toEqual(results[1]);
    expect(results[1]).toEqual(results[2]);
    expect(results[2]).toEqual(results[3]);
  });

  it('TEST DE DIFICULTAD: selecciona exactamente 3 initial, 4 medium, 3 advanced', () => {
    const participants: Participant[] = [
      {
        id: 'p1',
        groupId: 'g1',
        alias: 'Jugador',
        ageRange: 'child',
        educationLevel: 'primary',
        position: 1,
        createdAt: new Date(),
      },
    ];
    const plan = buildAssignmentPlan(participants);
    const selected = selectQuestionsForSlots(candidates, plan);

    expect(selected).toHaveLength(10);
    expect(selected.slice(0, 3).every((s) => s.question.difficulty === 'initial')).toBe(true);
    expect(selected.slice(3, 7).every((s) => s.question.difficulty === 'medium')).toBe(true);
    expect(selected.slice(7, 10).every((s) => s.question.difficulty === 'advanced')).toBe(true);
  });

  it('TEST DE NO REPETICIÓN: cero IDs duplicados en una partida de 10 preguntas', () => {
    const participants: Participant[] = [
      {
        id: 'p1',
        groupId: 'g1',
        alias: 'Jugador',
        ageRange: 'general',
        educationLevel: null,
        position: 1,
        createdAt: new Date(),
      },
    ];
    const plan = buildAssignmentPlan(participants);
    const selected = selectQuestionsForSlots(candidates, plan);

    const uniqueIds = new Set(selected.map((s) => s.question.id));
    expect(uniqueIds.size).toBe(10);
  });

  it('lanza QuestionPoolInsufficientError si faltan preguntas de alguna dificultad (< 3 initial, < 4 medium, < 3 advanced)', () => {
    const participants: Participant[] = [
      {
        id: 'p1',
        groupId: 'g1',
        alias: 'Jugador',
        ageRange: 'general',
        educationLevel: null,
        position: 1,
        createdAt: new Date(),
      },
    ];
    const plan = buildAssignmentPlan(participants);

    // Falta initial
    const fewInitial = [
      makeMockQuestion('i1', 'initial'),
      makeMockQuestion('i2', 'initial'),
      makeMockQuestion('m1', 'medium'),
      makeMockQuestion('m2', 'medium'),
      makeMockQuestion('m3', 'medium'),
      makeMockQuestion('m4', 'medium'),
      makeMockQuestion('a1', 'advanced'),
      makeMockQuestion('a2', 'advanced'),
      makeMockQuestion('a3', 'advanced'),
    ];
    expect(() => selectQuestionsForSlots(fewInitial, plan)).toThrow(QuestionPoolInsufficientError);
  });

  it('ignora preguntas que no tienen status approved', () => {
    const list = [
      makeMockQuestion('i1', 'initial', 'general', null, 'approved'),
      makeMockQuestion('i2', 'initial', 'general', null, 'approved'),
      makeMockQuestion('i3', 'initial', 'general', null, 'approved'),
      makeMockQuestion('i4', 'initial', 'general', null, 'draft'), // no aprobada
      makeMockQuestion('m1', 'medium', 'general', null, 'approved'),
      makeMockQuestion('m2', 'medium', 'general', null, 'approved'),
      makeMockQuestion('m3', 'medium', 'general', null, 'approved'),
      makeMockQuestion('m4', 'medium', 'general', null, 'approved'),
      makeMockQuestion('a1', 'advanced', 'general', null, 'approved'),
      makeMockQuestion('a2', 'advanced', 'general', null, 'approved'),
      makeMockQuestion('a3', 'advanced', 'general', null, 'approved'),
    ];

    const participants: Participant[] = [
      {
        id: 'p1',
        groupId: 'g1',
        alias: 'Jugador',
        ageRange: 'general',
        educationLevel: null,
        position: 1,
        createdAt: new Date(),
      },
    ];
    const plan = buildAssignmentPlan(participants);
    const selected = selectQuestionsForSlots(list, plan);

    expect(selected).toHaveLength(10);
    expect(selected.every((s) => s.question.status === 'approved')).toBe(true);
    expect(selected.some((s) => s.question.id === 'i4')).toBe(false);
  });
});
