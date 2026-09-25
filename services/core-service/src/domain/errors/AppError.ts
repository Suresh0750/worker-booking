import { HttpStatus } from '@domain/enums/HttpStatus'

/**
 * Base application error.
 *
 * Carries an HTTP status code alongside the message so the error handler
 * can respond with the right status without any extra coupling.
 *
 * Single Responsibility  – only represents an operational error with a status.
 * Open/Closed            – extend to add domain-specific error types; never modify this class.
 * Liskov Substitution    – every subclass is a valid Error and a valid AppError.
 * Interface Segregation  – exposes only what a generic error handler needs (status + message).
 * Dependency Inversion   – depends on the HttpStatus enum abstraction, not raw numbers.
 */
export class AppError extends Error {
  public readonly status: number
  public readonly isOperational: boolean

  constructor(message: string, status: number = HttpStatus.INTERNAL_SERVER_ERROR) {
    super(message)

    // Restore the correct prototype chain when targeting ES5
    Object.setPrototypeOf(this, new.target.prototype)

    this.name = new.target.name
    this.status = status
    this.isOperational = true  // distinguishes expected errors from programming bugs

    // Capture a clean stack trace (V8 only; no-op elsewhere)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, new.target)
    }
  }
}

// ── Concrete subtypes (Open/Closed: add here, never touch AppError) ──────────

/** 400 Bad Request */
export class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, HttpStatus.BAD_REQUEST)
  }
}

/** 401 Unauthorized */
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, HttpStatus.UNAUTHORIZED)
  }
}

/** 403 Forbidden */
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, HttpStatus.FORBIDDEN)
  }
}

/** 404 Not Found */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, HttpStatus.NOT_FOUND)
  }
}

/** 409 Conflict */
export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, HttpStatus.CONFLICT)
  }
}

/** 429 Too Many Requests */
export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, HttpStatus.TOO_MANY_REQUESTS)
  }
}

/** 500 Internal Server Error */
export class InternalServerError extends AppError {
  constructor(message = 'Internal server error') {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR)
  }
}
