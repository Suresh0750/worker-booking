import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { logger } from '../../infrastructure/config/logger'

export interface JwtPayload {
  userId: string
  email:  string
  role:   string
  iat:    number
  exp:    number
}

// Validates JWT and injects x-user-id + x-user-role into request headers
// Downstream services read these headers — they never verify the JWT themselves
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Missing or invalid authorization header' })
    return
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload

    // Inject user info as headers — downstream services trust these
    req.headers['x-user-id']   = payload.userId
    req.headers['x-user-role'] = payload.role
    req.headers['x-user-email'] = payload.email

    // Remove authorization header — downstream services don't need it
    // and this prevents accidental JWT leakage
    delete req.headers.authorization

    next()
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ success: false, message: 'Token expired — please refresh' })
      return
    }
    res.status(401).json({ success: false, message: 'Invalid token' })
  }
}

// Optional auth — passes through even without a token
// Used for public routes that show extra data when logged in
export const optionalAuthenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload
      req.headers['x-user-id']    = payload.userId
      req.headers['x-user-role']  = payload.role
      req.headers['x-user-email'] = payload.email
      delete req.headers.authorization
    } catch {
      // Token invalid but route is public — continue without user context
      logger.warn('Optional auth: invalid token, proceeding without user context')
    }
  }

  next()
}

// Role guard — must be used after authenticate
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = req.headers['x-user-role'] as string

    if (!userRole || !roles.map((r) => r.toUpperCase()).includes(userRole.toUpperCase())) {
      res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`,
      })
      return
    }

    next()
  }
}
