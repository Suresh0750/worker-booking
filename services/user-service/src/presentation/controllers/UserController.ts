import { Request, Response, NextFunction } from 'express'
import { CreateProfile }    from '../../application/use-cases/CreateProfile'
import { GetProfile }       from '../../application/use-cases/GetProfile'
import { UpdateProfile }    from '../../application/use-cases/UpdateProfile'
import { HttpStatus }       from '../../domain/enums/HttpStatus'
import { PrismaUserRepository }    from '../../infrastructure/repositories/PrismaUserRepository'
import { PrismaAddressRepository } from '../../infrastructure/repositories/PrismaAddressRepository'

const userRepo    = new PrismaUserRepository()
const addressRepo = new PrismaAddressRepository()

const createProfile = new CreateProfile(userRepo)
const getProfile    = new GetProfile(userRepo, addressRepo)
const updateProfile = new UpdateProfile(userRepo)

export class UserController {
  // GET /users/me  — logged in user gets their own profile
  static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId
      const result = await getProfile.execute(userId)
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // GET /users/:id  — get any user profile by ID
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await getProfile.execute(req.params.id)
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // PATCH /users/me  — update own profile
  static async updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId
      const result = await updateProfile.execute(userId, req.body)
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // POST /internal/users  — called by Auth Service after register
  static async createProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { data } = req.body
      const result = await createProfile.execute(data)
      res.status(HttpStatus.CREATED).json({ success: true, data: result })
    } catch (err) { next(err) }
  }
}
