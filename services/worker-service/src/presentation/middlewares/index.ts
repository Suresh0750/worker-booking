import { Request, Response, NextFunction } from 'express'
import { body, query, validationResult } from 'express-validator'
import { logger } from '../../infrastructure/config/logger'

// ── Validation chains ─────────────────────────────────────
export const updateProfileValidation = [
  body('name').optional().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('phone').optional().isMobilePhone('any').withMessage('Valid phone number required'),
  body('bio').optional().isLength({ max: 500 }).withMessage('Bio max 500 characters'),
  body('experienceYears').optional().isInt({ min: 0, max: 50 }).withMessage('Experience must be 0-50 years'),
  body('availability').optional().isIn(['AVAILABLE', 'BUSY', 'UNAVAILABLE']).withMessage('Invalid availability'),
]

export const searchValidation = [
  query('lat').notEmpty().isFloat({ min: -90,  max: 90  }).withMessage('Valid latitude required'),
  query('lng').notEmpty().isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
  query('radiusKm').optional().isFloat({ min: 1, max: 100 }).withMessage('Radius must be 1-100 km'),
]

export const addAddressValidation = [
  body('line1').notEmpty().withMessage('Address line1 is required'),
  body('city').notEmpty().withMessage('City is required'),
  body('state').notEmpty().withMessage('State is required'),
  body('pincode').isLength({ min: 6, max: 6 }).withMessage('Valid 6-digit pincode required'),
  body('lat').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  body('lng').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
]

export const addPortfolioValidation = [
  body('mediaUrl').isURL().withMessage('Valid media URL required'),
  body('mediaType').isIn(['IMAGE', 'VIDEO']).withMessage('mediaType must be IMAGE or VIDEO'),
  body('caption').optional().isLength({ max: 200 }).withMessage('Caption max 200 characters'),
]

export const setCategoriesValidation = [
  body('categoryIds').isArray({ min: 1 }).withMessage('At least one category required'),
  body('categoryIds.*').isUUID().withMessage('Each categoryId must be a valid UUID'),
]

// ── Validate result ───────────────────────────────────────
export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      errors: errors.array().map((e) => ({ field: e.type, message: e.msg })),
    })
    return
  }
  next()
}

// ── Internal secret guard ─────────────────────────────────
export const verifyInternalSecret = (req: Request, res: Response, next: NextFunction): void => {
  const secret = req.headers['x-internal-secret']
  if (!secret || secret !== process.env.INTERNAL_SECRET) {
    res.status(403).json({ success: false, message: 'Forbidden' })
    return
  }
  next()
}

// ── Extract user from gateway headers ────────────────────
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

// ── Global error handler ──────────────────────────────────
export interface AppError extends Error { status?: number }

export const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction): void => {
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
