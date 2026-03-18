import { Request, Response, NextFunction } from 'express'
import { body, query, validationResult } from 'express-validator'
import { logger } from '../../infrastructure/config/logger'

// ── Validation chains ─────────────────────────────────────
export const createBookingValidation = [
  body('workerId').isUUID().withMessage('Valid workerId required'),
  body('categoryId').isUUID().withMessage('Valid categoryId required'),
  body('description').isLength({ min: 10, max: 500 }).withMessage('Description must be 10-500 chars'),
  body('address').notEmpty().withMessage('Address is required'),
  body('city').notEmpty().withMessage('City is required'),
  body('lat').optional().isFloat({ min: -90, max: 90 }),
  body('lng').optional().isFloat({ min: -180, max: 180 }),
  body('scheduledAt').optional().isISO8601().withMessage('scheduledAt must be a valid date'),
]

export const updateStatusValidation = [
  body('status')
    .isIn(['ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
    .withMessage('Invalid status'),
  body('note').optional().isLength({ max: 200 }),
]

export const sendMessageValidation = [
  body('content').isLength({ min: 1, max: 1000 }).withMessage('Message must be 1-1000 chars'),
]

export const updatePriceValidation = [
  body('priceAgreed').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
]

export const getBookingsValidation = [
  query('status')
    .optional()
    .isIn(['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
]

// ── Validate result ───────────────────────────────────────
export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      errors:  errors.array().map((e) => ({ field: e.type, message: e.msg })),
    })
    return
  }
  next()
}

// ── Extract user injected by API Gateway ──────────────────
export const extractUser = (req: Request, res: Response, next: NextFunction): void => {
  const userId   = req.headers['x-user-id']   as string
  const userRole = req.headers['x-user-role'] as string

  if (!userId) {
    res.status(401).json({ success: false, message: 'Unauthorized' })
    return
  }

  ;(req as any).userId   = userId
  ;(req as any).userRole = userRole
  next()
}

// ── Internal secret guard ─────────────────────────────────
export const verifyInternalSecret = (req: Request, res: Response, next: NextFunction): void => {
  if (req.headers['x-internal-secret'] !== process.env.INTERNAL_SECRET) {
    res.status(403).json({ success: false, message: 'Forbidden' })
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
