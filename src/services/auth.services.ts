import * as jwt from 'jsonwebtoken'
import { UserModel } from '../model/user.model'
import { TUserResource } from '../types/user.types'
import { env } from '../env'

export async function login(
  password: string,
  email?: string,
  userName?: string,
): Promise<[string, number] | false> {
  if (!email && !userName) {
    throw Error('There have to be a Username or password')
  }
  let user = email
    ? await UserModel.findOne({ email }).exec()
    : await UserModel.findOne({ userName }).exec()

  if (user === null) {
    return false
  }

  const isPasswordCorrect = await user.isCorrectPassword(password)
  if (!isPasswordCorrect) {
    return false
  }

  const exp = Math.floor(Date.now() / 1000 + env.JWT_EXP)
  const jwtString = jwt.sign(
    {
      sub: user.id,
      admin: user.admin,
      roles: user.roles,
      exp,
    },
    env.JWT_SECRET,
  )

  return [jwtString, exp]
}

export async function renewToken(userId: string) {
  const user = await UserModel.findById(userId).exec()
  if (user === null) {
    return false
  }

  const exp = Math.floor(Date.now() / 1000 + env.JWT_EXP)
  const jwtString = jwt.sign(
    {
      sub: user.id,
      admin: user.admin,
      roles: user.roles,
      exp,
    },
    env.JWT_SECRET,
  )

  return [jwtString, exp]
}
