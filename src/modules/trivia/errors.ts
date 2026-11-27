export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class SessionNotFoundError extends DomainError {
  readonly code = 'SESSION_NOT_FOUND';
  readonly statusCode = 401;

  constructor(message = 'La sesión de mesa no fue encontrada.') {
    super(message);
  }
}

export class SessionExpiredError extends DomainError {
  readonly code = 'SESSION_EXPIRED';
  readonly statusCode = 401;

  constructor(message = 'La sesión de mesa ha expirado.') {
    super(message);
  }
}

export class DeviceNotActiveError extends DomainError {
  readonly code = 'DEVICE_NOT_ACTIVE';
  readonly statusCode = 403;

  constructor(message = 'El dispositivo actual no tiene control activo sobre esta mesa.') {
    super(message);
  }
}

export class GameNotFoundError extends DomainError {
  readonly code = 'GAME_NOT_FOUND';
  readonly statusCode = 404;

  constructor(message = 'No se encontró la partida asociada a esta mesa.') {
    super(message);
  }
}

export class GameAlreadyStartedError extends DomainError {
  readonly code = 'GAME_ALREADY_STARTED';
  readonly statusCode = 409;

  constructor(message = 'La partida ya fue iniciada y no puede prepararse nuevamente.') {
    super(message);
  }
}

export class GameNotConfiguredError extends DomainError {
  readonly code = 'GAME_NOT_CONFIGURED';
  readonly statusCode = 400;

  constructor(message = 'La partida no ha sido configurada con una categoría válida.') {
    super(message);
  }
}

export class CategoryNotAvailableError extends DomainError {
  readonly code = 'CATEGORY_NOT_AVAILABLE';
  readonly statusCode = 400;

  constructor(message = 'La categoría seleccionada no se encuentra activa o disponible.') {
    super(message);
  }
}

export class ParticipantsNotConfiguredError extends DomainError {
  readonly code = 'PARTICIPANTS_NOT_CONFIGURED';
  readonly statusCode = 400;

  constructor(message = 'El grupo debe tener entre 1 y 8 participantes registrados.') {
    super(message);
  }
}

export class QuestionPoolInsufficientError extends DomainError {
  readonly code = 'QUESTION_POOL_INSUFFICIENT';
  readonly statusCode = 400;

  constructor(
    message = 'No hay suficientes preguntas aprobadas en la categoría para completar la partida 3/4/3.'
  ) {
    super(message);
  }
}

export class GameSequenceIntegrityError extends DomainError {
  readonly code = 'GAME_SEQUENCE_INTEGRITY_ERROR';
  readonly statusCode = 500;

  constructor(
    message = 'La secuencia de preguntas de la partida presenta una inconsistencia de integridad.'
  ) {
    super(message);
  }
}

export class GamePreparationFailedError extends DomainError {
  readonly code = 'GAME_PREPARATION_FAILED';
  readonly statusCode = 500;

  constructor(message = 'Ocurrió un error inesperado al preparar la secuencia de preguntas.') {
    super(message);
  }
}

export class GameNotActiveError extends DomainError {
  readonly code = 'GAME_NOT_ACTIVE';
  readonly statusCode = 400;

  constructor(message = 'La partida no se encuentra activa.') {
    super(message);
  }
}

export class QuestionAlreadyAnsweredError extends DomainError {
  readonly code = 'QUESTION_ALREADY_ANSWERED';
  readonly statusCode = 409;

  constructor(message = 'La pregunta actual ya fue respondida.') {
    super(message);
  }
}

export class QuestionPositionMismatchError extends DomainError {
  readonly code = 'QUESTION_POSITION_MISMATCH';
  readonly statusCode = 409;

  constructor(
    message = 'La pregunta seleccionada no coincide con la pregunta activa actual de la partida.'
  ) {
    super(message);
  }
}

export class QuestionNotResolvedError extends DomainError {
  readonly code = 'QUESTION_NOT_RESOLVED';
  readonly statusCode = 400;

  constructor(
    message = 'Debe responder o esperar a que expire el tiempo de la pregunta actual antes de avanzar.'
  ) {
    super(message);
  }
}

export class GameAlreadyCompletedError extends DomainError {
  readonly code = 'GAME_ALREADY_COMPLETED';
  readonly statusCode = 400;

  constructor(message = 'La partida ya ha finalizado.') {
    super(message);
  }
}

export class InvalidAnswerOptionError extends DomainError {
  readonly code = 'INVALID_ANSWER_OPTION';
  readonly statusCode = 400;

  constructor(message = 'La opción seleccionada es inválida. Debe ser A, B, C o D.') {
    super(message);
  }
}
