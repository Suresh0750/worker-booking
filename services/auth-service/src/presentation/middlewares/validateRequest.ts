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
