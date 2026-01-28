import { HttpError } from "../errors/HttpError";
import { MulterS3File } from "../services/dataStorage.service";
import { Request as ExpressRequest, Response, NextFunction } from "express";
import multer from "multer";
import { S3Client } from "@aws-sdk/client-s3";
import multerS3 from "multer-s3";
import { isSlateObject } from "../helper/isSlateObject";

import { env } from "../env";
import { logger } from "../logger";
import { matchedData } from "express-validator";

interface RequestWithFiles extends ExpressRequest {
  files?: {
    [fieldname: string]: Express.Multer.File[];
  };
}

const s3 = new S3Client({
  region: env.AWS_BUCKET_REGION!,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: env.AWS_BUCKET_NAME!,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const uuid = crypto.randomUUID();
      const extension = file.originalname.split(".").pop();
      cb(null, `${uuid}.${extension}`);
    },
  }),
});

export const parseRequestBody = (
  req: ExpressRequest,
  res: Response,
  next: NextFunction,
) => parseRequestBodyMiddlewear(req as RequestWithFiles, res, next);

export const parseRequestBodyMiddlewear = async (
  req: RequestWithFiles,
  res: Response,
  next: NextFunction,
) => {
  try {
    req.body = Object.entries(req.body).reduce(
      (body: Record<string, any>, [key, value]: [string, any]) => {
        const parsedValue = JSON.parse(value);

        if (isSlateObject(parsedValue)) {
          body[key] = JSON.stringify(parsedValue);
          return body;
        }
        body[key] = parsedValue;
        return body;
      },
      {},
    );

    if (!req.files || Object.keys(req.files).length === 0) {
      return next();
    }

    const groupedFiles: Record<string, MulterS3File[]> = {};
    for (const fileArray of Object.values(req.files)) {
      const files = Array.isArray(fileArray) ? fileArray : [fileArray];

      for (const file of files) {
        if (!groupedFiles[file.fieldname]) {
          groupedFiles[file.fieldname] = [];
        }
        groupedFiles[file.fieldname].push(file as MulterS3File);
      }
    }

    //in req body ->
    for (const fieldName of Object.keys(groupedFiles)) {
      const existingImages = Array.isArray(req.body[fieldName])
        ? req.body[fieldName]
        : [];
      const newImages = (req.body[fieldName] = groupedFiles[fieldName].map(
        (file) => ({
          originalName: file.originalname,
          key: file.key,
          size: file.size,
        }),
      ));

      req.body[fieldName] = [...existingImages, ...newImages];
      logger.debug("Processed field images", { fieldName, count: req.body[fieldName].length });
    }

    next();
  } catch (err: unknown) {
    next(err);
  }
};
