import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { HttpStatus } from '@domain/enums/HttpStatus'

interface JwtPayload {
  userId:   string
  role:     string
  email:    string
  iat?:     number
  exp?:     number
}

export const authenticateJwt = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(HttpStatus.UNAUTHORIZED).json({ 
      success: false, 
      message: 'Authorization token required' 
    })
    return
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload

    const req_ = req as any
    req_.userId    = payload.userId
    req_.userRole  = payload.role
    req_.userEmail = payload.email

    next()
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(HttpStatus.UNAUTHORIZED).json({ 
        success: false, 
        message: 'Token expired' 
      })
      return
    }

    res.status(HttpStatus.UNAUTHORIZED).json({ 
      success: false, 
      message: 'Invalid token' 
    })
  }
}
