import { Request, Response, NextFunction } from 'express'
import { logger } from '../../infrastructure/config/logger'

export interface AppError extends Error {
  status?: number
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const status  = err.status ?? 500
  const message = err.message ?? 'Internal server error'

  if (status === 500) {
    logger.error(`Unhandled error: ${err.stack}`)
  }

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` })
}
