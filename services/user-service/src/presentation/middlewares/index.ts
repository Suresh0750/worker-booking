import { Request, Response, NextFunction } from 'express'
import { logger } from '../../infrastructure/config/logger'

// ── Internal Secret ───────────────────────────────────────
export const verifyInternalSecret = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const secret = req.headers['x-internal-secret']
  if (!secret || secret !== process.env.INTERNAL_SECRET) {
    res.status(403).json({ success: false, message: 'Forbidden' })
    return
  }
  next()
}

// ── JWT payload extractor ─────────────────────────────────
// API Gateway validates JWT and forwards userId in header
export const extractUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const userId = req.headers['x-user-id'] as string
  const role   = req.headers['x-user-role'] as string

  if (!userId) {
    res.status(401).json({ success: false, message: 'Unauthorized' })
    return
  }

  ;(req as any).userId = userId
  ;(req as any).userRole = role
  next()
}

// ── Error Handler ─────────────────────────────────────────
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
