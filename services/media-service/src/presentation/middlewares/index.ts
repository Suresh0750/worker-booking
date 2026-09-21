import { Request, Response, NextFunction } from 'express'
import { HttpStatus } from '../../domain/enums/HttpStatus'
import { logger } from '../../infrastructure/config/logger'
import { validateRequest } from './validateRequest'

export { validateRequest }

// ── Extract user injected by API Gateway ──────────────────
export const extractUser = (req: Request, res: Response, next: NextFunction): void => {
  const userId   = req.headers['x-user-id']   as string
  const userRole = req.headers['x-user-role'] as string

  if (!userId) {
    res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' })
    return
  }

  ;(req as any).userId   = userId
  ;(req as any).userRole = userRole
  next()
}

// ── Internal secret guard ─────────────────────────────────
export const verifyInternalSecret = (req: Request, res: Response, next: NextFunction): void => {
  if (req.headers['x-internal-secret'] !== process.env.INTERNAL_SECRET) {
    res.status(HttpStatus.FORBIDDEN).json({ success: false, message: 'Forbidden' })
    return
  }
  next()
}

// ── Multer error handler — catches file size + type errors ─
export const multerErrorHandler = (
  err: any,
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      message: `File too large. Maximum size is ${process.env.MAX_FILE_SIZE_MB ?? 10}MB`,
    })
    return
  }
  if (err.message?.includes('File type not allowed')) {
    res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: err.message })
    return
  }
  next(err)
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
  const status  = err.status ?? HttpStatus.INTERNAL_SERVER_ERROR
  const message = err.message ?? 'Internal server error'
  if (status === HttpStatus.INTERNAL_SERVER_ERROR) logger.error(`Unhandled error: ${err.stack}`)
  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(HttpStatus.NOT_FOUND).json({ success: false, message: `Route ${req.originalUrl} not found` })
}
