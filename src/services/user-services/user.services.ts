import { HttpError, HttpError400 } from '../../errors/HttpError'
import { ServerError } from '../../errors/ServerError'
import { sendEmail } from '../mail-services/sendMail'
import { logger } from '../../logger'
import { UserModel } from '../../model/user.model'
import { IUserSchema, TUserResource } from '../../types/user.types'
import { MAILIDENTIFIER } from '../mail-services/mailIdentifer.enum'
import { Role } from '../../types/permission.types'

type TCreateUserOptions = {
  password: string
  email: string
  userName: string
  roles?: Role[]
}

export async function createFirstUser({
  password,
  email,
  userName,
}: TCreateUserOptions) {
  try {
    const firstUser = await UserModel.findOne({ email }).exec()
    if (firstUser !== null) {
      logger.info(`Admin user with email "${email}" already exists.`)
      return firstUser.toResourceObject()
    }

    const newUser = await UserModel.create({
      verified: true,
      admin: true,
      password,
      email,
      userName,
      roles: [Role.ADMIN],
    })

    logger.info(`Successfully created admin user with email "${email}".`)
    return newUser.toResourceObject()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error(`Failed to create the first admin user: ${message}`, {
      email,
    })
    throw new Error(`Error creating the first admin user.`)
  }
}

export async function createUser({
  password,
  email,
  admin = true,
  userName,
  roles = [],
}: TCreateUserOptions & { admin: boolean }): Promise<TUserResource> {
  const existingUser = await UserModel.findOne({
    $or: [{ email }, { userName }],
  }).exec()

  if (existingUser) {
    const conflictField = existingUser.email === email ? 'email' : 'userName'
    throw new HttpError400({
      type: 'field',
      msg: `User with ${conflictField} "${existingUser[conflictField]}" already exists.`,
      location: 'body',
      path: 'username',
    })
  }

  // If user is admin, automatically add admin role if not already present
  let userRoles = [...roles]
  if (admin && !userRoles.includes(Role.ADMIN)) {
    userRoles.push(Role.ADMIN)
  }

  try {
    const newUser = await UserModel.create({
      verified: false,
      admin,
      password,
      email,
      userName,
      roles: userRoles,
    })
    await sendEmail({
      mailIdentifier: MAILIDENTIFIER.WELCOMEMAIL,
      reciverEmail: email,
      newUserName: userName,
    })
    logger.info(`Successfully created user with email "${email}".`)

    return newUser.toResourceObject()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    throw new ServerError(`Cant create user: ${email}. Error: ${message}`)
  }
}

export async function getUser(id: string): Promise<TUserResource> {
  const user = await UserModel.findById(id).exec()
  if (user === null) {
    throw new HttpError(404, `Can't find user with id: ${id}`)
  }

  return user.toResourceObject()
}

export async function queryUser(
  query: Partial<IUserSchema & { _id: string }>,
): Promise<TUserResource> {
  const user = await UserModel.findOne({ ...query }).exec()
  if (user === null) {
    throw new ServerError('Cant find user')
  }

  return user.toResourceObject()
}

export async function getAllUsers(): Promise<TUserResource[]> {
  try {
    const users = await UserModel.find({}).exec()
    let result = []
    for (const user of users) {
      result.push(user.toResourceObject())
    }
    return result
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    throw new ServerError(message)
  }
}

export async function updateUser(
  userID: string,
  username?: string,
  email?: string,
): Promise<TUserResource> {
  let updatingUser = await UserModel.findById(userID).exec()
  if (!updatingUser) {
    throw new HttpError(404, `Can't find user with id: ${userID}`)
  }
  if (username !== undefined) {
    updatingUser.userName = username
  }
  if (email !== undefined) {
    updatingUser.email = email
  }

  const savedUser = await updatingUser.save()

  return {
    id: savedUser.id,
    userName: savedUser.userName,
    email: savedUser.email,
    verified: savedUser.verified,
    admin: savedUser.admin,
    roles: savedUser.roles,
  }
}

export async function deleteUser(id: string): Promise<TUserResource> {
  const user = await UserModel.findById(id).exec()
  if (user === null) {
    throw new HttpError(404, `Can't find user with id: ${id}`)
  }

  const userResource = user.toResourceObject()
  if (userResource.admin) {
    throw new HttpError(403, 'You cannot delete admins')
  }

  try {
    await user.deleteOne()
    return userResource
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    throw new ServerError(`Error deleting user with id=${id}: ${message}`)
  }
}

export async function changePassword(
  id: string,
  newPassword: string,
  oldPassword: string,
) {
  const user = await UserModel.findById(id)
  if (!user) {
    throw new HttpError(404)
  }

  const isPasswortCorrect = await user.isCorrectPassword(oldPassword)
  if (!isPasswortCorrect) {
    throw new HttpError400({
      type: 'field',
      path: 'currentPassword',
      location: 'body',
      msg: 'Wrong password',
    })
  }

  try {
    await user.updateOne({ password: newPassword })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    throw new ServerError(message)
  }
}

export async function assignRoles(
  userId: string,
  roles: Role[],
): Promise<IUserSchema> {
  const user = await UserModel.findById(userId)
  if (!user) {
    throw new Error('User not found')
  }

  if (roles.includes(Role.ADMIN) && !user.admin) {
    user.admin = true
  } else if (!roles.includes(Role.ADMIN) && user.admin) {
    user.admin = false
  }

  user.roles = roles
  await user.save()

  return user
}
