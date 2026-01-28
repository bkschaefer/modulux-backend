import { HttpError400 } from "../../errors/HttpError";
import { ServerError } from "../../errors/ServerError";
import { logger } from "../../logger";
import { Collection, getEntryModel } from "../../model/collection.model";
import { TSchemaResource, TCollectionResource, TImageObject } from "../../types/collection.types";
import { isImageField } from "../../helper/isImageField";
import { getURLs } from "../dataStorage.service";

export async function getAllCollectionNames() {
  try {
    const allNames = await Collection.find({}, { name: 1, title: 1, _id: 0 }).exec();
    logger.info(`All schema names and titles retrieved successfully.`);
    return allNames
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error(`Failed to load all schema names and titles: ${message}`);
    throw new ServerError(`Failed to load all schema names and titles: ${message}`);
  }
}

export async function createCollection(schema: TSchemaResource): Promise<TSchemaResource> {
  const isExist = await Collection.findOne({
    name: schema.name,
  }).exec();
  if (isExist) {
    throw new HttpError400({
      path: "collectioName",
      msg: `Collection with name '${schema.name}' already exists.`,
    });
  }

  try {
    const collection = await Collection.create({
      name: schema.name,
      title: schema.title,
      schemaJSON: JSON.stringify(schema)
    });
    logger.info(`Collection '${schema.name}' created successfully.`);
    return JSON.parse(collection.schemaJSON)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error(`Failed to create collection '${schema.name}': ${message}`);
    throw new ServerError(
      `Failed to create collection '${schema.name}': ${message}`,
    );
  }
}

export async function getCollection(
  collectionName: string,
): Promise<TCollectionResource> {
  const collection = await Collection.findOne({
    name: collectionName
  }).exec();
  
  if (!collection) {
    throw new HttpError400({
      path: "collectionName",
      msg: `Collection '${collectionName}' not found.`,
    });
  }

  // Get entries from the dynamic collection
  const EntryModel = getEntryModel(collectionName);
  const entries = await EntryModel.find({}).exec();
  

  logger.info(`entries.length == ${entries.length}`);

  const newEntries = [];
  for (const entry of entries) {
    let entryWithImageURLS = { ...entry.toObject() };
    for (const [key, value] of Object.entries(entry.toObject())) {
      if (isImageField(value)) {
        entryWithImageURLS[key] = await getURLs(value as TImageObject[]);
      } 
    }
    newEntries.push(entryWithImageURLS)
  }


  logger.info(`Collection '${collectionName}' retrieved successfully.`);
  logger.info(`newEntries.length == ${newEntries.length}`, newEntries);
  logger.info(collection.schemaJSON);
  return { 
    schema: JSON.parse(collection.schemaJSON), 
    entries: newEntries 
  };
}

export async function deleteCollection(
  collectionName: string,
): Promise<void> {
  const collection = await Collection.findOne({
    name: collectionName
  }).exec();
  
  if (!collection) {
    throw new HttpError400({
      path: "collectionName",
      msg: `Collection '${collectionName}' not found.`,
    });
  }

  try {
    await collection.deleteOne();
    logger.info(`Schema '${collectionName}' and its entries deleted successfully.`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error(`Failed to delete collection '${collectionName}': ${message}`);
    throw new ServerError(
      `Error deleting collection with name=${collectionName}: ${message}`,
    );
  }
}

export async function updateCollection(
  collectionName: string,
  schema: TSchemaResource
): Promise<TSchemaResource> {
  const collection = await Collection.findOne({ name: collectionName }).exec();
  if (!collection) {
    throw new HttpError400({
      path: "collectionName",
      msg: `Collection '${schema.name}' not found.`,
    });
  }
  try {
  await collection.updateOne({name: schema.name, title: schema.title, schemaJSON: JSON.stringify(schema)})
  logger.info(`Collection '${collection.name}' updated successfully.`);
  const updatedCollection = await Collection.findOne({ name: schema.name }).exec()
  return JSON.parse(updatedCollection!.schemaJSON)
  }
  catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error(`Failed to update Collection '${collection.name}': ${message}`);
    throw new ServerError(
      `Failed to update schema '${collection.name}': ${message}`,
    );
  }
}
