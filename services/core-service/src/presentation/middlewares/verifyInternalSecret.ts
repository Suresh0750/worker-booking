import { Request, Response, NextFunction } from 'express'
import { HttpStatus } from '@domain/enums/HttpStatus'

/**
 * Guards internal routes — only services presenting the correct
 * x-internal-secret header may call these endpoints.
 */
export const verifyInternalSecret = (req: Request, res: Response, next: NextFunction): void => {
  const secret = req.headers['x-internal-secret']

  if (!secret || secret !== process.env.INTERNAL_SECRET) {
    res.status(HttpStatus.FORBIDDEN).json({ success: false, message: 'Forbidden' })
    return
  }

  next()
}
