import { Request, Response, NextFunction } from 'express'
import { v4 as uuid } from 'uuid'
import { logger }     from '../../infrastructure/config/logger'

// Adds a unique request ID to every request for tracing across services
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = uuid()
  const start     = Date.now()

  // Attach to headers so downstream services can log the same requestId
  req.headers['x-request-id'] = requestId
  res.setHeader('x-request-id', requestId)

  res.on('finish', () => {
    const duration = Date.now() - start
    const userId   = req.headers['x-user-id'] ?? 'anonymous'

    logger.info(
      `${req.method} ${req.originalUrl} → ${res.statusCode} | ${duration}ms | userId: ${userId} | reqId: ${requestId}`,
    )
  })

  next()
}

// Global error handler
export interface AppError extends Error {
  status?: number
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const status  = err.status ?? 500
  const message = err.message ?? 'Internal server error'

  if (status === 500) {
    logger.error(`Gateway error on ${req.method} ${req.originalUrl}: ${err.stack}`)
  }

  res.status(status).json({
    success: false,
    message,
    requestId: req.headers['x-request-id'],
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    hint:    'Check the API documentation for available routes',
  })
}
