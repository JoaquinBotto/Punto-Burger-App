import { describe, it, expect } from 'vitest';
import { buildAssignmentPlan } from './assignment-plan';
import type { Participant } from '../../db/schema/participants';

function makeParticipant(
  position: number,
  alias: string,
  ageRange: string,
  educationLevel: string | null = null
): Participant {
  return {
    id: `part-${position}`,
    groupId: 'group-1',
    alias,
    ageRange,
    educationLevel,
    position,
    createdAt: new Date(),
  };
}

describe('buildAssignmentPlan (PPA-LAUNCH-001 Competitive Fairness)', () => {
  it('lanza error si la lista de participantes está vacía o excede 8', () => {
    expect(() => buildAssignmentPlan([])).toThrow();
    const nine = Array.from({ length: 9 }, (_, i) => makeParticipant(i + 1, `P${i + 1}`, 'adult'));
    expect(() => buildAssignmentPlan(nine)).toThrow();
  });

  it('para 1 solo participante: todas las 10 preguntas van dirigidas a él', () => {
    const single = makeParticipant(1, 'Joaco', 'adult', 'higher');
    const plan = buildAssignmentPlan([single]);

    expect(plan).toHaveLength(10);
    // Verificar dificultades 3/4/3
    expect(plan.slice(0, 3).every((s) => s.difficulty === 'initial')).toBe(true);
    expect(plan.slice(3, 7).every((s) => s.difficulty === 'medium')).toBe(true);
    expect(plan.slice(7, 10).every((s) => s.difficulty === 'advanced')).toBe(true);

    // Todas dirigidas al único jugador
    for (const slot of plan) {
      expect(slot.targetParticipantId).toBe('part-1');
      expect(slot.targetAlias).toBe('Joaco');
      expect(slot.isGroup).toBe(false);
    }
  });

  it('para 2 participantes: 6 preguntas dirigidas (3 c/u en round robin) y 4 grupales', () => {
    const players = [makeParticipant(1, 'Joaco', 'adult'), makeParticipant(2, 'Santi', 'child')];
    const plan = buildAssignmentPlan(players);

    expect(plan).toHaveLength(10);
    const directed = plan.filter((s) => !s.isGroup);
    const group = plan.filter((s) => s.isGroup);

    expect(directed).toHaveLength(6);
    expect(group).toHaveLength(4);

    // Posiciones grupales estándar para 4 grupales: [3, 5, 7, 10]
    expect(plan[2]!.isGroup).toBe(true);
    expect(plan[4]!.isGroup).toBe(true);
    expect(plan[6]!.isGroup).toBe(true);
    expect(plan[9]!.isGroup).toBe(true);

    // Round robin estricto de las 6 dirigidas: P1, P2, P1, P2, P1, P2
    expect(directed.map((s) => s.targetAlias)).toEqual([
      'Joaco',
      'Santi',
      'Joaco',
      'Santi',
      'Joaco',
      'Santi',
    ]);
  });

  it('para 3 participantes: 6 dirigidas (2 c/u en round robin) y 4 grupales', () => {
    const players = [
      makeParticipant(1, 'Joaco', 'adult'),
      makeParticipant(2, 'Santi', 'teen'),
      makeParticipant(3, 'Mica', 'child'),
    ];
    const plan = buildAssignmentPlan(players);

    expect(plan).toHaveLength(10);
    const directed = plan.filter((s) => !s.isGroup);
    const group = plan.filter((s) => s.isGroup);

    expect(directed).toHaveLength(6);
    expect(group).toHaveLength(4);

    // Round robin estricto: Joaco -> Santi -> Mica -> Joaco -> Santi -> Mica
    expect(directed.map((s) => s.targetAlias)).toEqual([
      'Joaco',
      'Santi',
      'Mica',
      'Joaco',
      'Santi',
      'Mica',
    ]);
  });

  it('para 4 participantes: 8 dirigidas (2 c/u) y 2 grupales', () => {
    const players = [
      makeParticipant(1, 'P1', 'adult'),
      makeParticipant(2, 'P2', 'teen'),
      makeParticipant(3, 'P3', 'child'),
      makeParticipant(4, 'P4', 'adult'),
    ];
    const plan = buildAssignmentPlan(players);

    expect(plan).toHaveLength(10);
    const directed = plan.filter((s) => !s.isGroup);
    const group = plan.filter((s) => s.isGroup);

    expect(directed).toHaveLength(8);
    expect(group).toHaveLength(2);

    expect(directed.map((s) => s.targetAlias)).toEqual([
      'P1',
      'P2',
      'P3',
      'P4',
      'P1',
      'P2',
      'P3',
      'P4',
    ]);
  });

  it('EQUIDAD: grupo homogéneo vs grupo mixto del mismo tamaño genera exactamente el mismo patrón de turnos', () => {
    // Grupo A: 3 niños
    const groupHomogeneous = [
      makeParticipant(1, 'Nene1', 'child', 'primary'),
      makeParticipant(2, 'Nene2', 'child', 'primary'),
      makeParticipant(3, 'Nene3', 'child', 'primary'),
    ];

    // Grupo B: 1 niño, 1 teen, 1 adulto
    const groupMixed = [
      makeParticipant(1, 'Nene', 'child', 'primary'),
      makeParticipant(2, 'Adolescente', 'teen', 'secondary'),
      makeParticipant(3, 'Adulto', 'adult', 'higher'),
    ];

    const planA = buildAssignmentPlan(groupHomogeneous);
    const planB = buildAssignmentPlan(groupMixed);

    // Mismo largo y dificultades idénticas
    expect(planA).toHaveLength(10);
    expect(planB).toHaveLength(10);

    for (let i = 0; i < 10; i++) {
      expect(planA[i]!.difficulty).toBe(planB[i]!.difficulty);
      expect(planA[i]!.isGroup).toBe(planB[i]!.isGroup);
      // Las posiciones asignadas a jugador coinciden exactamente en posición relativa
      if (!planA[i]!.isGroup) {
        expect(planA[i]!.targetParticipantId).toBe(planB[i]!.targetParticipantId);
      }
    }
  });

  it('para 8 participantes: todos los 8 reciben exactamente 1 pregunta dirigida y hay 2 grupales', () => {
    const eight = [
      makeParticipant(1, 'P1', 'child'),
      makeParticipant(2, 'P2', 'teen'),
      makeParticipant(3, 'P3', 'adult'),
      makeParticipant(4, 'P4', 'child'),
      makeParticipant(5, 'P5', 'teen'),
      makeParticipant(6, 'P6', 'adult'),
      makeParticipant(7, 'P7', 'teen'),
      makeParticipant(8, 'P8', 'adult'),
    ];
    const plan = buildAssignmentPlan(eight);

    expect(plan).toHaveLength(10);

    const directedSlots = plan.filter((s) => !s.isGroup);
    expect(directedSlots).toHaveLength(8);

    const groupSlots = plan.filter((s) => s.isGroup);
    expect(groupSlots).toHaveLength(2);

    for (let i = 1; i <= 8; i++) {
      const found = directedSlots.find((s) => s.targetParticipantId === `part-${i}`);
      expect(found).toBeDefined();
    }
  });

  it('el algoritmo es estrictamente determinista para la misma lista de participantes', () => {
    const players = [
      makeParticipant(1, 'Cata', 'child'),
      makeParticipant(2, 'Santi', 'teen'),
      makeParticipant(3, 'Joaco', 'adult'),
    ];
    const plan1 = buildAssignmentPlan(players);
    const plan2 = buildAssignmentPlan(players);

    expect(plan1).toEqual(plan2);
  });
});
