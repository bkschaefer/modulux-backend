import { v4 as uuidv4 } from "uuid";
import { HttpError, HttpError400 } from "../../errors/HttpError";
import { TInviteRessource } from "../../types/invite.types";
import { ServerError } from "../../errors/ServerError";
import { UserModel } from "../../model/user.model";
import { generateEmailInvite } from "../mail-services/htmlBodyGenerator";
import nodemailer from "nodemailer";
import { InviteModel } from "../../model/invite.model";
import { sendEmail } from "../mail-services/sendMail";
import { MAILIDENTIFIER } from "../mail-services/mailIdentifer.enum";

function generateRegistrationToken(): string {
  return uuidv4();
}

// Token expires after 2 days
function createExpiredate(): Date {
  const now = new Date();
  now.setDate(now.getDate() + 2);
  return now;
}

export async function createInvite(
  inviteEmail: string,
  inviterName: string,
): Promise<TInviteRessource> {
  const user = await UserModel.findOne({ email: inviteEmail }).exec();
  if (user) {
    throw new HttpError400({
      path: "email",
      msg: `User with email: ${inviteEmail} already exists`,
    });
  }

  try {
    const newInvite = new InviteModel({
      email: inviteEmail,
      inviteToken: generateRegistrationToken(),
      expireDate: createExpiredate(),
      isUsed: false,
    });
    await newInvite.save();
    await sendEmail({
      mailIdentifier: MAILIDENTIFIER.INVITEMAIL,
      reciverEmail: newInvite.email,
      inviteToken: newInvite.inviteToken,
      inviterName: inviterName,
    });
    return newInvite.toResourceObject();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    throw new ServerError(
      `Cant create Invite: ${inviteEmail}. Error: ${message}`,
    );
  }
}

export async function verifyInvite(token: string): Promise<TInviteRessource> {
  const invite = await InviteModel.findOne({ inviteToken: token }).exec();
  if (invite === null) {
    throw new HttpError(404, `Can't find invite with token: ${token}`);
  }
  if (invite.isUsed) {
    throw new HttpError(400, `The token has already been used`);
  }
  if (invite.expireDate < new Date()) {
    throw new HttpError(400, `The token has already expired`);
  }
  return invite.toResourceObject();
}

export async function invalidateInvite(token: string) {
  await InviteModel.updateOne({ inviteToken: token }, { isUsed: true }).exec();
}