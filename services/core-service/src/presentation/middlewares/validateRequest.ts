import { Request, Response, NextFunction } from 'express'
import { ZodTypeAny } from 'zod'
import { HttpStatus } from '@domain/enums/HttpStatus'

type Source = 'body' | 'query' | 'params'

export interface ValidationSchemas {
  body?:   ZodTypeAny
  query?:  ZodTypeAny
  params?: ZodTypeAny
}

/**
 * Validates body / query / params against Zod schemas.
 * On failure responds: { success: false, errors: { field: message } }
 * On success writes coerced values back to req.body / req.query / req.params.
 */
export const validateRequest = (schemas: ValidationSchemas) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const errors: Record<string, string> = {}

    const validate = (source: Source): void => {
      const schema = schemas[source]
      if (!schema) return

      const result = schema.safeParse(req[source])
      if (result.success) {
        (req as any)[source] = result.data
        return
      }

      for (const issue of result.error.issues) {
        const field = issue.path.join('.') || source
        if (!errors[field]) errors[field] = issue.message
      }
    }

    validate('body')
    validate('query')
    validate('params')

    if (Object.keys(errors).length > 0) {
      res.status(HttpStatus.BAD_REQUEST).json({ success: false, errors })
      return
    }

    next()
  }
