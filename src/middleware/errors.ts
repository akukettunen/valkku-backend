// errors.ts
import type { Request, Response, NextFunction } from 'express'

/** Throw this for expected/business errors */
export class AppError extends Error {
  status: number
  code: string
  constructor(message: string, status = 400, code = 'bad_request') {
    super(message)
    this.name = 'AppError'
    this.status = status
    this.code = code
  }
}

/** 404 handler (after routes) */
export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(new AppError('Not found', 404, 'not_found'))
}

/** Main error handler (last) */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  // Defaults
  let status = 500
  let code = 'internal_error'
  let message = 'Something went wrong'

  // AppError (your controlled errors)
  if (err instanceof AppError) {
    status = err.status
    code = err.code
    message = err.message
  }

  // JSON parse error from express.json()
  if (err instanceof SyntaxError && (err as any).type === 'entity.parse.failed') {
    status = 400
    code = 'invalid_json'
    message = 'Malformed JSON in request body'
  }

  // Zod (optional)
  if ((err as any)?.name === 'ZodError') {
    status = 422
    code = 'validation_error'
    message = 'Validation failed'
    return res.status(status).json({
      code,
      message,
      issues: (err as any).issues?.map((i: any) => ({
        path: i.path?.join('.') ?? '',
        message: i.message
      }))
    })
  }

  // jsonwebtoken (optional)
  if ((err as any)?.name === 'TokenExpiredError') {
    status = 401; code = 'token_expired'; message = 'Token expired'
  } else if ((err as any)?.name === 'JsonWebTokenError') {
    status = 401; code = 'invalid_token'; message = 'Invalid token'
  }

  // Log concise server-side
  if (process.env['NODE_ENV'] !== 'test') {
    // eslint-disable-next-line no-console
    console.error(`[${req.method} ${req.originalUrl}] ${status} ${code}:`, err)
  }

  res.status(status).json({ code, message })
  return;
}
