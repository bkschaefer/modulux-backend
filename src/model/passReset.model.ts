import { model, Schema } from "mongoose";
import { IPassResetMethods, IPassResetSchema, TPassResetModel } from "../types/passReset.types";

export const PassResetModelName = "sys_Reset";

const schema = new Schema<IPassResetSchema, TPassResetModel, IPassResetMethods>(
  {
    userID: {
      type: String,
      required: true,
    },
    resetToken: {
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
);

schema.method("toResourceObject", function toResourceObject() {
  return {
    userID: this.userID,
    resetToken: this.resetToken,
    expireDate: this.expireDate,
    isUsed: this.isUsed,
  };
});

export const PassResetModel = model(PassResetModelName, schema);
