export class SessionError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = 'SessionError';
  }
}

export class DeviceHasActiveSessionError extends SessionError {
  constructor(
    message = 'Este dispositivo ya tiene una sesión activa en otra mesa. Finalizá la sesión anterior antes de ingresar a una nueva.'
  ) {
    super('DEVICE_HAS_ACTIVE_SESSION', message, 409);
  }
}

export class TooManyAttemptsError extends SessionError {
  constructor(
    message = 'Has alcanzado el límite de intentos fallidos. Por favor, aguardá unos minutos antes de reintentar.'
  ) {
    super('TOO_MANY_ATTEMPTS', message, 429);
  }
}

export class SessionCreationFailedError extends SessionError {
  constructor(message = 'No se pudo crear la sesión de mesa. Por favor, intentá nuevamente.') {
    super('SESSION_CREATION_FAILED', message, 500);
  }
}
