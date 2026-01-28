import { v4 as uuidv4 } from "uuid";
import { HttpError } from "../../errors/HttpError";
import { UserModel } from "../../model/user.model";
import { PassResetModel } from "../../model/passReset.model";
import { ServerError } from "../../errors/ServerError";
import { sendEmail } from "../mail-services/sendMail";
import { MAILIDENTIFIER } from "../mail-services/mailIdentifer.enum";
import { logger } from "../../logger";

function generateRegistrationToken(): string {
  return uuidv4();
}

// Token expires after 2 days
function createExpiredate(): Date {
  const now = new Date();
  now.setDate(now.getDate() + 2);
  return now;
}

export async function createPassReset(userNameOrEmail: string) {
  const user = await UserModel.findOne({
    $or: [{ email: userNameOrEmail }, { userName: userNameOrEmail }],
  });
  logger.info(`User found: ${user}`);
  if (!user) {
    throw new HttpError(
      404,
      `User not found with email or username: ${userNameOrEmail}`,
    );
  }
  try {
    const newReset = new PassResetModel({
      userID: user.id,
      resetToken: generateRegistrationToken(),
      expireDate: createExpiredate(),
      isUsed: false,
    });
    await newReset.save();
    await sendEmail({
      mailIdentifier: MAILIDENTIFIER.RESETPASSMAIL,
      reciverEmail: user.email,
      resetToken: newReset.resetToken,
    });
    return newReset.toResourceObject();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    throw new ServerError(message);
  }
}

export async function checkPassResetToken(
  resetToken: string,
): Promise<boolean> {
  const resetEntry = await PassResetModel.findOne({ resetToken }).exec();
  if (!resetEntry) {
    throw new HttpError(404, `Reset token not found: ${resetToken}`);
  }
  if (resetEntry.isUsed) {
    throw new HttpError(400, "The token has already been used");
  }
  if (resetEntry.expireDate < new Date()) {
    throw new HttpError(400, "The token has expired");
  }
  return true;
}

export async function changePassForgotten(
  resetToken: string,
  newPassword: string,
): Promise <Boolean> {
  const resetType = await PassResetModel.findOne({ resetToken }).exec();
  if (!resetType) {
    throw new HttpError(404, `Can't find reset with token: ${resetToken}`);
  }
  if (resetType.expireDate < new Date()) {
    throw new HttpError(400, `The token has already expired`);
  }
  if (resetType.isUsed) {
    throw new HttpError(400, `The token has already been used`);
  }

  const user = await UserModel.findById(resetType.userID);
  if (!user) {
    throw new HttpError(
      404,
      `Can't find changable user with id: ${resetType.userID}`,
    );
  }
  try {
    await user.updateOne({ password: newPassword });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    throw new ServerError(message);
  }
  await resetType.updateOne({ isUsed: false });
  return true;
}
