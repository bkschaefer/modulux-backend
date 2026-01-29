import { Request, Response, NextFunction } from 'express'
import { verifyInvite } from '../services/user-services/registration.services'
import { HttpError } from '../errors/HttpError'
import { TInviteRessource } from '../types/invite.types'
import { body, matchedData, validationResult } from 'express-validator'

declare global {
  namespace Express {
    export interface Request {
      inviteToken?: string
      invite?: TInviteRessource
    }
  }
}

export const requiresInvite = [
  body('inviteToken').isString().isUUID(),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return next(new HttpError(401, 'Invite token is required'))
    }

    const { inviteToken } = matchedData(req)

    try {
      const invite = await verifyInvite(inviteToken)

      if (!invite) {
        throw new HttpError(401, 'Invite not found or invalid')
      }
      if (invite.isUsed) {
        throw new HttpError(401, 'Invite already used')
      }
      if (invite.expireDate < new Date()) {
        throw new HttpError(401, 'Invite expired')
      }
      if (invite.email && invite.email !== req.body.email) {
        throw new HttpError(401, 'Email does not match invite')
      }

      req.inviteToken = inviteToken
      req.invite = invite

      next()
    } catch (err) {
      next(new HttpError(401))
    }
  },
]
