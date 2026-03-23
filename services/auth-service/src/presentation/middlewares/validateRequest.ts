import { Request, Response, NextFunction } from 'express'
import { body, validationResult } from 'express-validator'

// Reusable validation chains
export const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must have uppercase, lowercase and a number'),
  body('role')
    .optional()
    .isIn(['USER', 'WORKER'])
    .withMessage('Role must be USER or WORKER'),
  body('name').optional().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('phone').optional().isMobilePhone('any').withMessage('Valid phone number required'),
  body('avatar').optional().isURL().withMessage('Avatar must be a valid URL'),
  body('bio').optional().isLength({ max: 500 }).withMessage('Bio max 500 characters'),
  body('experienceYears')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Experience must be 0-50 years'),
  body('availability')
    .optional()
    .isIn(['AVAILABLE', 'BUSY', 'UNAVAILABLE'])
    .withMessage('Invalid availability'),
]

export const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
]

export const refreshValidation = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
]

// Middleware that checks the result of the chains above
export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
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
