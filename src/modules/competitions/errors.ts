import { DomainError } from '@/modules/trivia/errors';

export class CompetitionNotFoundError extends DomainError {
  readonly code = 'COMPETITION_NOT_FOUND';
  readonly statusCode = 404;

  constructor(message = 'No se encontró la competencia solicitada.') {
    super(message);
  }
}

export class CompetitionRegistrationClosedError extends DomainError {
  readonly code = 'COMPETITION_REGISTRATION_CLOSED';
  readonly statusCode = 403;

  constructor(
    message = 'El período de inscripción para la competencia ha finalizado o aún no ha comenzado.'
  ) {
    super(message);
  }
}

export class TableAlreadyJoinedCompetitionError extends DomainError {
  readonly code = 'TABLE_ALREADY_JOINED';
  readonly statusCode = 409;

  constructor(message = 'Esta mesa ya se encuentra inscripta en la competencia de hoy.') {
    super(message);
  }
}

export class CompetitionCutoffReachedError extends DomainError {
  readonly code = 'COMPETITION_CUTOFF_REACHED';
  readonly statusCode = 403;

  constructor(
    message = 'Se ha alcanzado el límite de horario para iniciar nuevos ciclos de la competencia.'
  ) {
    super(message);
  }
}

export class CompetitionRoundAlreadyExistsError extends DomainError {
  readonly code = 'ROUND_ALREADY_EXISTS';
  readonly statusCode = 409;

  constructor(message = 'El ciclo solicitado ya ha sido creado o está en curso.') {
    super(message);
  }
}

export class PreviousRoundNotCompletedError extends DomainError {
  readonly code = 'PREVIOUS_ROUND_NOT_COMPLETED';
  readonly statusCode = 409;

  constructor(message = 'Debés completar el ciclo anterior antes de continuar al siguiente.') {
    super(message);
  }
}

export class CompetitionAllRoundsCompletedError extends DomainError {
  readonly code = 'ALL_ROUNDS_COMPLETED';
  readonly statusCode = 409;

  constructor(message = 'La mesa ya ha completado los 3 ciclos de la competencia.') {
    super(message);
  }
}

export class PresenceRequiredError extends DomainError {
  readonly code = 'PRESENCE_REQUIRED';
  readonly statusCode = 403;

  constructor(message = 'Conectate al Wi-Fi de Punto Burger para continuar jugando.') {
    super(message);
  }
}
