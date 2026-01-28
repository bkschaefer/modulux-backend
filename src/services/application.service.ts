import crypto from "crypto";
import { HttpError400 } from "../errors/HttpError";
import { ApplicationModel } from "../model/application.model";
import { IApplicationSchema } from "../types/application.types";

export async function createApplication(
  resource: Pick<IApplicationSchema, "url">
): Promise<IApplicationSchema> {
  const { url } = resource;

  const possibleApp = await ApplicationModel.find({url}).exec();
  if (possibleApp.length > 0) {
    throw new HttpError400({
      msg: "Application with this URL already exists",
      path: "url",
    });
  }

  const secret = crypto.randomBytes(32).toString("hex");

  const newApp = await ApplicationModel.create({
    url,
    secret,
  });

  return newApp.toObject();
}

export async function getAllApplications(): Promise<IApplicationSchema[]> {
  return ApplicationModel.find().exec();
}

export async function deleteApplication(id: string) {
  await ApplicationModel.findByIdAndDelete(id).exec();
}

export async function apiKeyExists(apiKey: string): Promise<boolean> {
  const apps = await ApplicationModel.find({secret: apiKey}).exec();
  return apps.length > 0;
}