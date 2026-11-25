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

describe('buildAssignmentPlan', () => {
  it('lanza error si la lista de participantes está vacía o excede 8', () => {
    expect(() => buildAssignmentPlan([])).toThrow();
    const nine = Array.from({ length: 9 }, (_, i) => makeParticipant(i + 1, `P${i + 1}`, 'adult'));
    expect(() => buildAssignmentPlan(nine)).toThrow();
  });

  it('para 1 solo participante: todas las 10 preguntas van dirigidas a él y adaptadas a su perfil', () => {
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
      expect(slot.targetAgeRange).toBe('adult');
      expect(slot.targetEducationLevel).toBe('higher');
      expect(slot.isGroup).toBe(false);
    }
  });

  it('para grupo homogéneo (todos del mismo rango, ej: 3 teens): todas son grupales adaptadas al perfil común', () => {
    const teens = [
      makeParticipant(1, 'Santi', 'teen', 'secondary'),
      makeParticipant(2, 'Lucas', 'teen', 'secondary'),
      makeParticipant(3, 'Mateo', 'teen', 'secondary'),
    ];
    const plan = buildAssignmentPlan(teens);

    expect(plan).toHaveLength(10);
    for (const slot of plan) {
      expect(slot.targetParticipantId).toBeNull();
      expect(slot.targetAlias).toBeNull();
      expect(slot.targetAgeRange).toBe('teen');
      expect(slot.targetEducationLevel).toBeNull();
      expect(slot.isGroup).toBe(true);
    }
  });

  it('para grupo mixto (ej: child, teen, adult): alterna rangos etarios, incluye grupales y todos reciben al menos 1 dirigida', () => {
    const mixed = [
      makeParticipant(1, 'Cata', 'child', 'primary'),
      makeParticipant(2, 'Santi', 'teen', 'secondary'),
      makeParticipant(3, 'Joaco', 'adult', 'higher'),
    ];
    const plan = buildAssignmentPlan(mixed);

    expect(plan).toHaveLength(10);

    // Cada participante recibe al menos 1 pregunta dirigida
    const directedSlots = plan.filter((s) => !s.isGroup);
    const cataCount = directedSlots.filter((s) => s.targetAlias === 'Cata').length;
    const santiCount = directedSlots.filter((s) => s.targetAlias === 'Santi').length;
    const joacoCount = directedSlots.filter((s) => s.targetAlias === 'Joaco').length;

    expect(cataCount).toBeGreaterThanOrEqual(1);
    expect(santiCount).toBeGreaterThanOrEqual(1);
    expect(joacoCount).toBeGreaterThanOrEqual(1);
    expect(cataCount + santiCount + joacoCount).toBe(directedSlots.length);

    // Existen preguntas grupales
    const groupSlots = plan.filter((s) => s.isGroup);
    expect(groupSlots.length).toBeGreaterThan(0);
    for (const g of groupSlots) {
      expect(g.targetParticipantId).toBeNull();
      expect(g.targetAgeRange).toBe('general');
    }

    // Ningún participante recibe las 10 preguntas
    expect(cataCount).toBeLessThan(10);
    expect(santiCount).toBeLessThan(10);
    expect(joacoCount).toBeLessThan(10);

    // Posición 10 (la final) es grupal
    expect(plan[9]?.isGroup).toBe(true);
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

    // Cada uno de los 8 participantes tiene exactamente 1 turno dirigido
    for (let i = 1; i <= 8; i++) {
      const found = directedSlots.find((s) => s.targetParticipantId === `part-${i}`);
      expect(found).toBeDefined();
    }
  });

  it('el algoritmo es determinista para la misma lista de participantes', () => {
    const mixed = [
      makeParticipant(1, 'Cata', 'child'),
      makeParticipant(2, 'Santi', 'teen'),
      makeParticipant(3, 'Joaco', 'adult'),
    ];
    const plan1 = buildAssignmentPlan(mixed);
    const plan2 = buildAssignmentPlan(mixed);

    expect(plan1).toEqual(plan2);
  });
});
