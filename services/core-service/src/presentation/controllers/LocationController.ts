import { Request, Response, NextFunction } from 'express'
import { HttpStatus } from '@domain/enums/HttpStatus'
import { getLocations } from '@infrastructure/config/dependencies'

export class LocationController {
  // GET /locations?searchKey=state|city|pincode&search=&state=&city=
  static async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = getLocations.execute(req.query as any)
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }
}