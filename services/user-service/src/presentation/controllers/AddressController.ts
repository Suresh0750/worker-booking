import { Request, Response, NextFunction } from 'express'
import { AddAddress }       from '../../application/use-cases/AddAddress'
import { UpdateAddress, SetPrimaryAddress, DeleteAddress } from '../../application/use-cases/AddressUseCases'
import { PrismaUserRepository }    from '../../infrastructure/repositories/PrismaUserRepository'
import { PrismaAddressRepository } from '../../infrastructure/repositories/PrismaAddressRepository'

const userRepo    = new PrismaUserRepository()
const addressRepo = new PrismaAddressRepository()

const addAddress        = new AddAddress(addressRepo, userRepo)
const updateAddress     = new UpdateAddress(addressRepo)
const setPrimaryAddress = new SetPrimaryAddress(addressRepo)
const deleteAddress     = new DeleteAddress(addressRepo)

export class AddressController {
  // GET /users/me/addresses
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId   = (req as any).userId
      const addresses = await addressRepo.findByUserId(userId)
      res.status(200).json({ success: true, data: addresses })
    } catch (err) { next(err) }
  }

  // POST /users/me/addresses
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId
      const result = await addAddress.execute(userId, req.body)
      res.status(201).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // PATCH /users/me/addresses/:id
  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId
      const result = await updateAddress.execute(req.params.id, userId, req.body)
      res.status(200).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // PATCH /users/me/addresses/:id/primary
  static async setPrimary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId
      await setPrimaryAddress.execute(req.params.id, userId)
      res.status(200).json({ success: true, message: 'Primary address updated' })
    } catch (err) { next(err) }
  }

  // DELETE /users/me/addresses/:id
  static async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId
      await deleteAddress.execute(req.params.id, userId)
      res.status(200).json({ success: true, message: 'Address deleted' })
    } catch (err) { next(err) }
  }
}
