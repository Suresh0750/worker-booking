import { Request, Response, NextFunction } from 'express'
import { HttpStatus } from '@domain/enums/HttpStatus'

/**
 * Reads the user identity injected by the API Gateway.
 * The gateway validates the JWT and forwards:
 *   x-user-id   — the user's UUID
 *   x-user-role — the user's role (CUSTOMER | WORKER | ADMIN)
 *
 * Attaches req.userId and req.userRole for downstream handlers.
 */
export const extractUser = (req: Request, res: Response, next: NextFunction): void => {
  const userId   = req.headers['x-user-id']   as string | undefined
  const userRole = req.headers['x-user-role'] as string | undefined

  if (!userId) {
    res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' })
    return
  }

  (req as any).userId   = userId
  (req as any).userRole = userRole
  next()
}
