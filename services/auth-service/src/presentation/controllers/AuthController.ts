import { Request, Response, NextFunction } from 'express'
import { RegisterUser }       from '../../application/use-cases/RegisterUser'
import { LoginUser }          from '../../application/use-cases/LoginUser'
import { RefreshAccessToken } from '../../application/use-cases/RefreshAccessToken'
import { LogoutUser }         from '../../application/use-cases/LogoutUser'
import { PrismaAuthRepository }  from '../../infrastructure/repositories/PrismaAuthRepository'
import { UserServiceClient }     from '../../infrastructure/services/UserServiceClient'

// Compose dependencies once — repository + external clients injected into use cases
const authRepo          = new PrismaAuthRepository()
const userServiceClient = new UserServiceClient()

const registerUser       = new RegisterUser(authRepo, userServiceClient)
const loginUser          = new LoginUser(authRepo)
const refreshAccessToken = new RefreshAccessToken(authRepo)
const logoutUser         = new LogoutUser(authRepo)

export class AuthController {
  // POST /auth/register
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await registerUser.execute(req.body)
      res.status(201).json({ success: true, data: result })
    } catch (err) {
      next(err)
    }
  }

  // POST /auth/login
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await loginUser.execute(req.body)
      res.status(200).json({ success: true, data: result })
    } catch (err) {
      next(err)
    }
  }

  // POST /auth/refresh
  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await refreshAccessToken.execute(req.body)
      res.status(200).json({ success: true, data: result })
    } catch (err) {
      next(err)
    }
  }

  // POST /auth/logout
  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await logoutUser.execute(req.body)
      res.status(200).json({ success: true, message: 'Logged out successfully' })
    } catch (err) {
      next(err)
    }
  }

  // POST /auth/logout-all  — logs out from every device
  static async logoutAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId // set by JWT middleware in API Gateway
      await logoutUser.executeAll(userId)
      res.status(200).json({ success: true, message: 'Logged out from all devices' })
    } catch (err) {
      next(err)
    }
  }

  // POST /internal/auth/verify — called by API Gateway to validate a JWT
  static async verifyToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const jwt = await import('jsonwebtoken')
      const { token } = req.body

      if (!token) {
        res.status(400).json({ success: false, message: 'Token is required' })
        return
      }

      const payload = jwt.default.verify(token, process.env.JWT_SECRET as string)
      res.status(200).json({ success: true, data: payload })
    } catch (err: any) {
      res.status(401).json({ success: false, message: 'Invalid or expired token' })
    }
  }
}
