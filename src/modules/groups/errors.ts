// ==============================================================================
// Punto Burger - Errores de Dominio para Configuración de Grupo y Juego
// ==============================================================================

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
  readonly statusCode = 404;

  constructor(message = 'No se encontró una sesión activa vinculada a este dispositivo.') {
    super(message);
  }
}

export class SessionExpiredError extends DomainError {
  readonly code = 'SESSION_EXPIRED';
  readonly statusCode = 401;

  constructor(message = 'La sesión de la mesa ha expirado por límite de tiempo.') {
    super(message);
  }
}

export class DeviceNotActiveError extends DomainError {
  readonly code = 'DEVICE_NOT_ACTIVE';
  readonly statusCode = 403;

  constructor(message = 'Este dispositivo no ostenta el control activo de la mesa.') {
    super(message);
  }
}

export class GroupNameInvalidError extends DomainError {
  readonly code = 'GROUP_NAME_INVALID';
  readonly statusCode = 400;

  constructor(message = 'El nombre del equipo debe tener entre 2 y 30 caracteres válidos.') {
    super(message);
  }
}

export class ParticipantCountInvalidError extends DomainError {
  readonly code = 'PARTICIPANT_COUNT_INVALID';
  readonly statusCode = 400;

  constructor(message = 'El grupo debe contener entre 1 y 8 participantes.') {
    super(message);
  }
}

export class ParticipantInvalidError extends DomainError {
  readonly code = 'PARTICIPANT_INVALID';
  readonly statusCode = 400;

  constructor(message = 'Uno o más participantes contienen datos incompletos o inválidos.') {
    super(message);
  }
}

export class CategoryNotFoundError extends DomainError {
  readonly code = 'CATEGORY_NOT_FOUND';
  readonly statusCode = 404;

  constructor(message = 'La categoría seleccionada no existe.') {
    super(message);
  }
}

export class CategoryNotAvailableError extends DomainError {
  readonly code = 'CATEGORY_NOT_AVAILABLE';
  readonly statusCode = 400;

  constructor(message = 'Esta categoría está temporalmente no disponible.') {
    super(message);
  }
}

export class CategoryNotReadyError extends DomainError {
  readonly code = 'CATEGORY_NOT_READY';
  readonly statusCode = 400;

  constructor(message = 'Esta categoría está temporalmente no disponible.') {
    super(message);
  }
}

export class GameAlreadyStartedError extends DomainError {
  readonly code = 'GAME_ALREADY_STARTED';
  readonly statusCode = 409;

  constructor(
    message = 'La partida ya ha comenzado y no permite modificar la configuración del equipo.'
  ) {
    super(message);
  }
}

export class SetupCreationFailedError extends DomainError {
  readonly code = 'SETUP_CREATION_FAILED';
  readonly statusCode = 500;

  constructor(
    message = 'Ocurrió un error inesperado al guardar la configuración del equipo. Por favor, reintentá.'
  ) {
    super(message);
  }
}
