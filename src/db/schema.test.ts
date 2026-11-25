import { describe, it, expect } from 'vitest';
import * as schema from './schema';

describe('Database Schema & 13 Entities Architecture', () => {
  it('exports all 13 foundational database tables', () => {
    expect(schema.venues).toBeDefined();
    expect(schema.tables).toBeDefined();
    expect(schema.accessCodes).toBeDefined();
    expect(schema.tableSessions).toBeDefined();
    expect(schema.devices).toBeDefined();
    expect(schema.groups).toBeDefined();
    expect(schema.participants).toBeDefined();
    expect(schema.categories).toBeDefined();
    expect(schema.questions).toBeDefined();
    expect(schema.gameSessions).toBeDefined();
    expect(schema.gameQuestions).toBeDefined();
    expect(schema.answers).toBeDefined();
    expect(schema.auditEvents).toBeDefined();
  });

  it('validates venue configuration defaults', () => {
    expect(schema.venues.timezone.default).toBe('America/Argentina/Cordoba');
    expect(schema.venues.status.default).toBe('active');
  });

  it('verifies table functional statuses', () => {
    const allowedTableStatuses = ['disabled', 'available', 'in_use', 'cooldown'];
    expect(allowedTableStatuses).toContain(schema.tables.status.default);
  });

  it('verifies table session active status default', () => {
    expect(schema.tableSessions.status.default).toBe('active');
  });

  it('verifies question status default is draft', () => {
    expect(schema.questions.status.default).toBe('draft');
  });

  it('verifies game session status default is created', () => {
    expect(schema.gameSessions.status.default).toBe('created');
  });

  it('verifies game_questions snapshot columns and targetParticipantId (PPA-012)', () => {
    expect(schema.gameQuestions.promptSnapshot).toBeDefined();
    expect(schema.gameQuestions.optionASnapshot).toBeDefined();
    expect(schema.gameQuestions.optionBSnapshot).toBeDefined();
    expect(schema.gameQuestions.optionCSnapshot).toBeDefined();
    expect(schema.gameQuestions.optionDSnapshot).toBeDefined();
    expect(schema.gameQuestions.correctOptionSnapshot).toBeDefined();
    expect(schema.gameQuestions.ageRangeSnapshot).toBeDefined();
    expect(schema.gameQuestions.targetParticipantId).toBeDefined();
  });
});
