import { model, Schema } from 'mongoose'
import {
  IInviteMethods,
  IInviteSchema,
  TInviteModel,
} from '../types/invite.types'

export const InviteModelName = 'sys_Invite'

const schema = new Schema<IInviteSchema, TInviteModel, IInviteMethods>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    inviteToken: {
      type: String,
      required: true,
      unique: true,
    },
    expireDate: {
      type: Date,
      required: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

schema.method('toResourceObject', function toResourceObject() {
  return {
    email: this.email,
    inviteToken: this.inviteToken,
    expireDate: this.expireDate,
    isUsed: this.isUsed,
  }
})

export const InviteModel = model(InviteModelName, schema)
