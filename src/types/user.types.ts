import type { Model } from 'mongoose'
import { Role } from './permission.types'

export interface IUserSchema {
  email: string
  password: string
  userName: string
  verified: boolean
  admin: boolean
  roles: Role[]
  createtAt: Date
  updatetAt: Date
}

export type TUserResource = Pick<
  IUserSchema,
  'email' | 'verified' | 'admin' | 'userName' | 'roles'
> & { id: string }

export interface IUserMethods {
  toResourceObject(): TUserResource
  isCorrectPassword(password: string): Promise<boolean>
}

export type TUserModel = Model<IUserSchema, {}, IUserMethods>
