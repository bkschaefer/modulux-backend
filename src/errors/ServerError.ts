import { logger } from '../logger'
import { HttpError } from './HttpError'

export class ServerError extends HttpError {
  constructor(_logMessage: string) {
    super(500, 'Something went wrong try again')
    logger.error(`ServerError: ${_logMessage}`)
  }
}
