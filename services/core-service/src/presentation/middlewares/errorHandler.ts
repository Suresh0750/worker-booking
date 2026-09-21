import { Request, Response, NextFunction } from 'express'
import { HttpStatus } from '@domain/enums/HttpStatus'
import { logger } from '@infrastructure/config/logger'

export interface AppError extends Error {
  status?: number
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const status  = err.status ?? HttpStatus.INTERNAL_SERVER_ERROR
  const message = err.message ?? 'Internal server error'

  if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
    logger.error(`Unhandled error: ${err.stack}`)
  }

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(HttpStatus.NOT_FOUND).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  })
}
