export class TableError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = 'TableError';
  }
}

export class TableNotFoundError extends TableError {
  constructor(message = 'La mesa solicitada no existe o no está registrada.') {
    super('TABLE_NOT_FOUND', message, 404);
  }
}

export class TableDisabledError extends TableError {
  constructor(message = 'Esta mesa no se encuentra habilitada para su uso en este momento.') {
    super('TABLE_DISABLED', message, 403);
  }
}

export class TableCooldownError extends TableError {
  constructor(
    message = 'La mesa se encuentra en período de preparación temporal. Por favor, aguardá unos instantes.'
  ) {
    super('TABLE_COOLDOWN', message, 409);
  }
}

export class TableAlreadyInUseError extends TableError {
  constructor(message = 'Esta mesa ya se encuentra ocupada por otra sesión activa.') {
    super('TABLE_ALREADY_IN_USE', message, 409);
  }
}

export class InvalidAccessCodeError extends TableError {
  constructor(message = 'El código temporal ingresado es incorrecto o ha expirado.') {
    super('INVALID_ACCESS_CODE', message, 400);
  }
}
