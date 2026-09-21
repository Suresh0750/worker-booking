import { Request, Response, NextFunction } from 'express'

type AsyncFn = (req: Request, res: Response, next: NextFunction) => Promise<void>

/** Wraps an async route handler and forwards any thrown error to next(). */
export const asyncHandler = (fn: AsyncFn) =>
  (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next)
  }
