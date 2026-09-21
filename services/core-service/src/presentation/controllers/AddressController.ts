import { Request, Response, NextFunction } from 'express'
import { HttpStatus } from '@domain/enums/HttpStatus'
import {
  addAddress,
  getAddresses,
  updateAddress,
  setPrimaryAddress,
  deleteAddress,
} from '@infrastructure/config/dependencies'

export class AddressController {

  // GET /users/me/addresses
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await getAddresses.execute((req as any).userId)
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // POST /users/me/addresses
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await addAddress.execute((req as any).userId, req.body)
      res.status(HttpStatus.CREATED).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // PATCH /users/me/addresses/:id
  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await updateAddress.execute(req.params.id, (req as any).userId, req.body)
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // PATCH /users/me/addresses/:id/primary
  static async setPrimary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await setPrimaryAddress.execute(req.params.id, (req as any).userId)
      res.status(HttpStatus.OK).json({ success: true, message: 'Primary address updated' })
    } catch (err) { next(err) }
  }

  // DELETE /users/me/addresses/:id
  static async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await deleteAddress.execute(req.params.id, (req as any).userId)
      res.status(HttpStatus.OK).json({ success: true, message: 'Address deleted' })
    } catch (err) { next(err) }
  }
}
