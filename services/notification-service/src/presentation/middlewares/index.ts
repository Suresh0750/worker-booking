import { Request, Response, NextFunction } from 'express'
import { logger } from '../../infrastructure/config/logger'

// ── Internal secret guard ─────────────────────────────────
export const verifyInternalSecret = (req: Request, res: Response, next: NextFunction): void => {
  if (req.headers['x-internal-secret'] !== process.env.INTERNAL_SECRET) {
    res.status(403).json({ success: false, message: 'Forbidden' })
    return
  }
  next()
}

// ── Global error handler ──────────────────────────────────
export interface AppError extends Error {
  status?: number
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const status  = err.status ?? 500
  const message = err.message ?? 'Internal server error'
  if (status === 500) logger.error(`Unhandled error: ${err.stack}`)
  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` })
}
