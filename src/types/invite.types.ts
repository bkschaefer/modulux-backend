import type { Model } from "mongoose";

export interface IInviteSchema {
  email: string;
  inviteToken: string;
  expireDate: Date;
  isUsed: boolean;
}

export type TInviteRessource = Pick<
  IInviteSchema,
  "email" | "inviteToken" | "expireDate" | "isUsed"
> & { id: string };

export interface IInviteMethods {
    toResourceObject(): TInviteRessource;
}

export type TInviteModel = Model<IInviteSchema, {}, IInviteMethods>;
