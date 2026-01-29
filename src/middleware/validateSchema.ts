import { Request, Response, NextFunction } from 'express'
import { schemaValidator } from '../services/schemaValidator'
import { HttpError, HttpError400 } from '../errors/HttpError'
import { ValidationError } from 'express-validator'
import { logger } from '../logger'

export const validateSchema = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.body) {
      throw new HttpError(400, 'Schema is required')
    }

    const isValid = schemaValidator(req.body)

    if (!isValid && schemaValidator.errors) {
      for (const error of schemaValidator.errors) {
        logger.info(JSON.stringify(error, null, 2))
      }

      const validationError: ValidationError = {
        msg: 'Schema validation failed: ' + schemaValidator.errors,
        path: 'schemaDefinition',
        location: 'body',
        type: 'field',
      }

      throw new HttpError400(validationError)
    }
    next()
  } catch (error) {
    next(error)
  }
}
