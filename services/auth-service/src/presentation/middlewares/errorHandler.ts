import { Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'
import { HttpStatus } from '../../domain/enums/HttpStatus'
import { logger } from '../../infrastructure/config/logger'

export interface AppError extends Error {
  status?: number
}

function mapPrismaToHttp(err: unknown): AppError | null {
  if (err instanceof Prisma.PrismaClientInitializationError) {
    const e = new Error('Database is temporarily unavailable') as AppError
    e.status = HttpStatus.SERVICE_UNAVAILABLE
    return e
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P1001: can't reach server, P1017: server closed connection, P1000: auth failed at DB
    if (['P1000', 'P1001', 'P1017'].includes(err.code)) {
      const e = new Error('Database is temporarily unavailable') as AppError
      e.status = HttpStatus.SERVICE_UNAVAILABLE
      return e
    }
  }
  return null
}

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const mapped = mapPrismaToHttp(err)
  const appErr = (mapped ?? err) as AppError

  const status  = appErr.status ?? HttpStatus.INTERNAL_SERVER_ERROR
  const message = appErr.message ?? 'Internal server error'

  if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
    const stack = appErr instanceof Error ? appErr.stack : String(err)
    logger.error(`Unhandled error: ${stack}`)
  }

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' &&
      appErr instanceof Error && { stack: appErr.stack }),
  })
}

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(HttpStatus.NOT_FOUND).json({ success: false, message: `Route ${req.originalUrl} not found` })
}
