import { NextFunction, Request, Response } from 'express'
import { ZodTypeAny } from 'zod'
import { HttpStatus } from '../../domain/enums/HttpStatus'

type RequestSource = 'body' | 'query' | 'params'

export interface ValidationSchemas {
  body?:   ZodTypeAny
  query?:  ZodTypeAny
  params?: ZodTypeAny
}

export interface ValidationErrorResponse {
  success: false
  status:  HttpStatus
  errors:  Record<string, string>
}

/**
 * Express middleware factory that validates `body`, `query` and/or `params`
 * against the given Zod schemas. On failure responds with:
 *
 *   { success: false, status: 400, errors: { "<field>": "<message>" } }
 *
 * On success the parsed (and coerced) values are written back onto
 * `req.body` / `req.query` / `req.params`.
 */
export const validateRequest = (schemas: ValidationSchemas) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: Record<string, string> = {}

    const validateSource = (source: RequestSource): void => {
      const schema = schemas[source]
      if (!schema) return

      const result = schema.safeParse(req[source])
      if (result.success) {
        ;(req as any)[source] = result.data
        return
      }

      for (const issue of result.error.issues) {
        const field = issue.path.join('.') || source
        if (!errors[field]) errors[field] = issue.message
      }
    }

    validateSource('body')
    validateSource('query')
    validateSource('params')

    if (Object.keys(errors).length > 0) {
      const response: ValidationErrorResponse = {
        success: false,
        status:  HttpStatus.BAD_REQUEST,
        errors,
      }
      res.status(HttpStatus.BAD_REQUEST).json(response)
      return
    }

    next()
  }
}
