import { Request, Response, NextFunction } from 'express'
import { HttpStatus } from '@domain/enums/HttpStatus'
import {
  addAddress,
  getAddresses,
  updateAddress,
  setPrimaryAddress,
  deleteAddress,
} from '@infrastructure/config/dependencies'
import { childLogger } from '@infrastructure/config/logger'

export class AddressController {

  // GET /users/me/addresses
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    const log = childLogger(req)
    const userId = (req as any).userId
    log.info('Get user addresses requested', { userId })
    try {
      const result = await getAddresses.execute(userId)
      log.info('User addresses fetched', { userId, count: result.length })
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // POST /users/me/addresses
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    const log = childLogger(req)
    const userId = (req as any).userId
    log.info('Create user address requested', { userId })
    try {
      const result = await addAddress.execute(userId, req.body)
      log.info('User address created', { userId, addressId: result.id })
      res.status(HttpStatus.CREATED).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // PATCH /users/me/addresses/:id
  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    const log = childLogger(req)
    const userId = (req as any).userId
    log.info('Update user address requested', { userId, addressId: req.params.id })
    try {
      const result = await updateAddress.execute(req.params.id, userId, req.body)
      log.info('User address updated', { userId, addressId: req.params.id })
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // PATCH /users/me/addresses/:id/primary
  static async setPrimary(req: Request, res: Response, next: NextFunction): Promise<void> {
    const log = childLogger(req)
    const userId = (req as any).userId
    log.info('Set primary address requested', { userId, addressId: req.params.id })
    try {
      await setPrimaryAddress.execute(req.params.id, userId)
      log.info('Primary address updated', { userId, addressId: req.params.id })
      res.status(HttpStatus.OK).json({ success: true, message: 'Primary address updated' })
    } catch (err) { next(err) }
  }

  // DELETE /users/me/addresses/:id
  static async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    const log = childLogger(req)
    const userId = (req as any).userId
    log.info('Delete user address requested', { userId, addressId: req.params.id })
    try {
      await deleteAddress.execute(req.params.id, userId)
      log.info('User address deleted', { userId, addressId: req.params.id })
      res.status(HttpStatus.OK).json({ success: true, message: 'Address deleted' })
    } catch (err) { next(err) }
  }
}
