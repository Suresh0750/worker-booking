import { Request, Response, NextFunction } from 'express'
import { HttpStatus } from '@domain/enums/HttpStatus'
import { logger } from '@infrastructure/config/logger'

export interface AppError extends Error {
  status?: number
  code?: string
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const status = err.status ?? HttpStatus.INTERNAL_SERVER_ERROR

  // Log the real error internally
  logger.error({
    message: err.message,
    stack: err.stack,
    code: err.code,
  })

  // Never expose internal/database errors
  const message =
    status >= 500
      ? 'Something went wrong. Please try again later.'
      : err.message

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      // Even in development, be careful about exposing Prisma errors.
      stack: err.stack,
    }),
  })
}

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(HttpStatus.NOT_FOUND).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  })
}
