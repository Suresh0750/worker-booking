import { Request, Response, NextFunction } from 'express'
import { body, query, validationResult } from 'express-validator'
import { HttpStatus } from '../../domain/enums/HttpStatus'
import { logger } from '../../infrastructure/config/logger'

// ── Validation chains ─────────────────────────────────────
export const submitReviewValidation = [
  body('bookingId').isUUID().withMessage('Valid bookingId required'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be a number between 1 and 5'),
  body('comment')
    .optional()
    .isLength({ min: 5, max: 1000 })
    .withMessage('Comment must be 5-1000 characters'),
]

export const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive number'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50'),
]

// ── Validate result ───────────────────────────────────────
export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      errors:  errors.array().map((e) => ({ field: e.type, message: e.msg })),
    })
    return
  }
  next()
}

// ── Extract user from API Gateway headers ─────────────────
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

// ── Error handler ─────────────────────────────────────────
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
