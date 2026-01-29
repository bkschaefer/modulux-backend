import { NextFunction, Request, Response } from 'express'
import { JsonWebTokenError, verify } from 'jsonwebtoken'

import { env } from '../env'
import { HttpError } from '../errors/HttpError'
import { ApplicationModel } from '../model/application.model'
import { apiKeyExists } from '../services/application.service'
import { log } from 'winston'
import { logger } from '../logger'

declare global {
  namespace Express {
    export interface Request {
      userId?: string
      exp?: number
      apiKey?: string
    }
  }
}

export async function requiresAuthentication(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const apiKey = req.headers['x-api-key']
  if (apiKey) {
    const keyIsValid = await apiKeyExists(apiKey as string)
    if (keyIsValid) {
      req.apiKey = apiKey as string
      return next()
    }
  }

  if (!req.cookies) {
    return next(new HttpError(401))
  }

  const jwtString = req.cookies['access_token']
  if (!jwtString) {
    return next(new HttpError(401))
  }

  try {
    const payload = verify(jwtString, env.JWT_SECRET)
    if (typeof payload === 'object') {
      req.userId = payload.sub
      req.exp = payload.exp
      next()
    } else {
      throw new JsonWebTokenError('Invalid token')
    }
  } catch (err) {
    res.clearCookie('access_token')
    next(new HttpError(401))
  }
}
