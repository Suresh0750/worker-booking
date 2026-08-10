import { Request, Response, NextFunction } from 'express'
import { RegisterUser }       from '../../application/use-cases/RegisterUser'
import { LoginUser }          from '../../application/use-cases/LoginUser'
import { RefreshAccessToken } from '../../application/use-cases/RefreshAccessToken'
import { LogoutUser }         from '../../application/use-cases/LogoutUser'
import { Otp }               from '../../application/use-cases/Otp'
import { HttpStatus }         from '../../domain/enums/HttpStatus'
import authRepo  from '../../infrastructure/repositories/PrismaAuthRepository'
import otpRepo   from '../../infrastructure/repositories/PrismaOtpRepository'
import otpDeliveryService from '../../infrastructure/services/OtpDeliveryService'
import userServiceClient    from '../../infrastructure/services/UserServiceClient'
import workerServiceClient   from '../../infrastructure/services/WorkerServiceClient'

// Compose dependencies once — repository + external clients injected into use cases

const registerUser       = new RegisterUser(authRepo, userServiceClient, workerServiceClient, otpRepo)
const loginUser          = new LoginUser(authRepo)
const refreshAccessToken = new RefreshAccessToken(authRepo)
const logoutUser         = new LogoutUser(authRepo)
const otp = new Otp(authRepo, otpRepo, otpDeliveryService)

export class AuthController {
  // POST /auth/register
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await registerUser.execute(req.body)
      res.status(HttpStatus.CREATED).json({ success: true, data: result })
    } catch (err) {
      next(err)
    }
  }

  // POST /auth/login
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await loginUser.execute(req.body)
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) {
      next(err)
    }
  }

  // POST /auth/refresh
  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await refreshAccessToken.execute(req.body)
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) {
      next(err)
    }
  }

  // POST /auth/send-otp
  static async sendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await otp.send(req.body)
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) {
      next(err)
    }
  }

  // POST /auth/verify-otp
  static async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await otp.verify(req.body)
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) {
      next(err)
    }
  }

  // POST /auth/logout
  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await logoutUser.execute(req.body)
      res.status(HttpStatus.OK).json({ success: true, message: 'Logged out successfully' })
    } catch (err) {
      next(err)
    }
  }

  // POST /auth/logout-all  — logs out from every device
  static async logoutAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId // set by JWT middleware in API Gateway
      await logoutUser.executeAll(userId)
      res.status(HttpStatus.OK).json({ success: true, message: 'Logged out from all devices' })
    } catch (err) {
      next(err)
    }
  }

  // POST /internal/auth/verify — called by API Gateway to validate a JWT
  static async verifyToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const jwt = await import('jsonwebtoken')
      const { token } = req.body

      const payload = jwt.default.verify(token, process.env.JWT_SECRET as string)
      res.status(HttpStatus.OK).json({ success: true, data: payload })
    } catch (err: any) {
      res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: 'Invalid or expired token' })
    }
  }
}
