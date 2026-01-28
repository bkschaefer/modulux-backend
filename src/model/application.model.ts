import { Schema, model } from "mongoose";
import { IApplicationSchema } from "../types/application.types";

export const applicationModelName = "sys_Application";

const schema = new Schema<IApplicationSchema>({
  url: {type: String, required: true},
  secret: {type: String, required: true},
}, 
{
  timestamps: true
});

export const ApplicationModel = model(applicationModelName, schema);
