import { Request, Response, NextFunction } from 'express'
import { Role } from '../types/permission.types'
import { getUser } from '../services/user-services/user.services'
import { HttpError } from '../errors/HttpError'

export const hasPermission = (collection: string) => [
  async (req: Request, res: Response, next: NextFunction) => {
    if (req.apiKey) {
      return next()
    }

    if (!req.userId) {
      return next(new HttpError(401, 'UserId from requesting user is required'))
    }

    try {
      const user = await getUser(req.userId)
      if (!user) {
        throw new HttpError(401, 'Unauthorized')
      }

      if (user.admin === true) {
        return next()
      }

      const permissionMap: Record<Role, string[]> = {
        [Role.ADMIN]: ['*'],
        [Role.USER_MANAGER]: ['invites', 'users'],
        [Role.SCHEMA_EDITOR]: ['schemas'],
        [Role.CONTENT_EDITOR]: ['collections'],
      }

      const hasAccess = user.roles.some((role) => {
        const allowedCollections = permissionMap[role] || []
        return (
          allowedCollections.includes('*') ||
          allowedCollections.includes(collection)
        )
      })

      if (!hasAccess) {
        throw new HttpError(
          403,
          'Forbidden. You do not have permission to access this collection.',
        )
      }

      next()
    } catch (err) {
      next(
        err instanceof HttpError
          ? err
          : new HttpError(500, 'Internal Server Error'),
      )
    }
  },
]
