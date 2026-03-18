import { Request, Response, NextFunction } from 'express'

// Protects /internal/* routes from being called by the public internet
// Only other services that know the shared INTERNAL_SECRET can call these
export const verifyInternalSecret = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const secret = req.headers['x-internal-secret']

  if (!secret || secret !== process.env.INTERNAL_SECRET) {
    res.status(403).json({ success: false, message: 'Forbidden' })
    return
  }
  next()
}
