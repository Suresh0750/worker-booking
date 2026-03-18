import { Request, Response, NextFunction } from 'express'
import { body, validationResult } from 'express-validator'

export const updateProfileValidation = [
  body('name').optional().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('phone').optional().isMobilePhone('any').withMessage('Valid phone number required'),
  body('avatar').optional().isURL().withMessage('Avatar must be a valid URL'),
]

export const createAddressValidation = [
  body('line1').notEmpty().withMessage('Address line1 is required'),
  body('city').notEmpty().withMessage('City is required'),
  body('state').notEmpty().withMessage('State is required'),
  body('pincode').notEmpty().isLength({ min: 6, max: 6 }).withMessage('Valid 6-digit pincode required'),
  body('lat').optional().isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('lng').optional().isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
]

export const updateAddressValidation = [
  body('line1').optional().notEmpty().withMessage('Address line1 cannot be empty'),
  body('city').optional().notEmpty().withMessage('City cannot be empty'),
  body('state').optional().notEmpty().withMessage('State cannot be empty'),
  body('pincode').optional().isLength({ min: 6, max: 6 }).withMessage('Valid 6-digit pincode required'),
]

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
