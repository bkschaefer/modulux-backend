import { Model, Schema, model } from 'mongoose'
import { logger } from '../logger'
import * as bcrypt from 'bcryptjs'
import { IUserMethods, IUserSchema, TUserModel } from '../types/user.types'
import { Role } from '../types/permission.types'

export const userModelName = 'sys_User'

const schema = new Schema<IUserSchema, TUserModel, IUserMethods>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
      unique: true,
    },
    admin: {
      type: Boolean,
      required: true,
      default: false,
    },
    verified: {
      type: Boolean,
      required: true,
      default: false,
    },
    roles: [
      {
        type: String,
        enum: Object.values(Role),
        default: [Role.CONTENT_EDITOR],
      },
    ],
  },
  {
    timestamps: true,
  },
)

schema.method('toResourceObject', function toResourceObject() {
  return {
    id: this.id,
    verified: this.verified,
    admin: this.admin,
    email: this.email,
    userName: this.userName,
    roles: this.roles,
  }
})

schema.method('isCorrectPassword', async function (password: string) {
  if (Number.isNaN(bcrypt.getRounds(this.get('password')))) {
    throw new Error('Password has not yet been hashed')
  }

  return bcrypt.compare(password, this.get('password'))
})

schema.pre('save', async function () {
  if (this.isModified('password')) {
    const hashedPassword = await bcrypt.hash(this.password, 10)
    this.password = hashedPassword
  }
})

schema.pre('updateOne', async function () {
  const update = this.getUpdate()
  if (update !== null && 'password' in update) {
    const password = this.get('password')
    this.set('password', await bcrypt.hash(password, 10))
  }
})

export const UserModel = model(userModelName, schema)

UserModel.createIndexes()
  .then(() => {
    logger.info('Successful created indexes for UserModel.')
  })
  .catch((err) => {
    logger.error(
      `Failed to create indexes for UserModel. Error: ${err.message}`,
    )
  })
