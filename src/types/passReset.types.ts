import type { Model } from "mongoose";

export interface IPassResetSchema {
  userID: string;
  resetToken: string;
  expireDate: Date;
  isUsed: boolean;
}

export type TPassResetResorce = Pick<
  IPassResetSchema,
  "userID" | "resetToken" | "expireDate" | "isUsed"
> & {
  id: string;
};

export interface IPassResetMethods {
  toResourceObject(): TPassResetResorce;
}

export type TPassResetModel = Model<IPassResetSchema, {}, IPassResetMethods>;
