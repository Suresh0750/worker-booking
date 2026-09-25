import { Request, Response, NextFunction } from 'express'
import { HttpStatus } from '@domain/enums/HttpStatus'
import { AppError } from '@domain/errors/AppError'
import { logger } from '@infrastructure/config/logger'

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const isOperational = err instanceof AppError && err.isOperational
  const status = isOperational ? (err as AppError).status : HttpStatus.INTERNAL_SERVER_ERROR

  logger.error({
    message:   err.message,
    stack:     err.stack,
    status,
    requestId: req.requestId,
    method:    req.method,
    url:       req.originalUrl,
  })

  const message = isOperational
    ? err.message
    : 'Something went wrong. Please try again later.'

  res.status(status).json({
    success:   false,
    message,
    requestId: req.requestId,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

export const notFoundHandler = (req: Request, res: Response): void => {
  logger.warn({
    message:   `Route not found: ${req.method} ${req.originalUrl}`,
    requestId: req.requestId,
    method:    req.method,
    url:       req.originalUrl,
  })

  res.status(HttpStatus.NOT_FOUND).json({
    success:   false,
    message:   `Route ${req.originalUrl} not found`,
    requestId: req.requestId,
  })
}
