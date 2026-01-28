import type { Request, Response, NextFunction } from 'express'
import { HttpError400 } from '../errors/HttpError'
import { HttpError } from '../errors/HttpError'
import { ServerError } from '../errors/ServerError'
import { logger } from '../logger'

export function errorhandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (err instanceof HttpError400) {
    return res.status(400).json({
      errors: err.validationResult,
    })
  }

  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({
      error: err.intoMessage,
    })
  }
  if (err instanceof ServerError) {
    logger.error(`Error: ${err.message}`, err)
    return res.status(500).json({
      error: err.message,
    })
  }
  logger.error(err.message)
  return res.status(500).json({error: 'Internal Server Error'})
}
