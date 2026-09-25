import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'

// Extend Express Request so TypeScript knows about requestId
declare global {
  namespace Express {
    interface Request {
      requestId: string
    }
  }
}

/**
 * Middleware: Request ID
 *
 * If the upstream service (e.g. api-gateway) already attached an
 * `x-request-id` header, reuse it so the same ID traces across the
 * whole call chain.  Otherwise generate a fresh UUID v4.
 *
 * The resolved ID is:
 *   - stored on `req.requestId`          → available in every controller / middleware
 *   - echoed back as `x-request-id`      → visible in the response headers for clients
 */
export const requestId = (req: Request, res: Response, next: NextFunction): void => {
  const incoming = req.headers['x-request-id']

  // Accept only a non-empty string; ignore arrays or empty values
  const id =
    typeof incoming === 'string' && incoming.trim().length > 0
      ? incoming.trim()
      : uuidv4()

  req.requestId = id
  res.setHeader('x-request-id', id)

  next()
}
