import { Schema, model, Model } from "mongoose";
import { TCollectionResource, TEntryResource, TField, IFieldArray, ICompositeField } from "../types/collection.types";
import mongoose from 'mongoose'
import { logger } from "../logger";
import { ServerError } from "../errors/ServerError";
import { HttpError400 } from "../errors/HttpError";


interface ICollectionSchema {
  name: string;
  title: string;
  schemaJSON: string;
}

const collectionSchema = new Schema<ICollectionSchema>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  title: {
    type: String,
    required: true,
    unique: true,
  },
  schemaJSON: {
    type: String,
    required: true,
  }
});

interface IEntrySchema {
  [key: string]: any;
}

// Helper function to get the dynamic entry model for a collection
export function getEntryModel(collectionName: string): Model<any> {
  const modelName = `${collectionName}`;

  // Return existing model if already registered
  if (mongoose.models[modelName]) {
    return mongoose.model(modelName);
  }
  // Create new model if it doesn't exist  
  const entrySchema = new Schema({}, {
    strict: false,  minimize: false
  });

  entrySchema.set('toObject', {
    versionKey: false,
  });

  return mongoose.model(modelName, entrySchema);
}

// Pre-save hook to create a new collection when a schema is created
collectionSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const EntryModel = getEntryModel(this.name);
      logger.info(`Created new entry collection for schema '${this.name}'`);
    } catch (error: any) {
      logger.error(`Failed to create entry collection for schema '${this.name}': ${error.message}`);
      throw new ServerError(`Failed to create entry collection: ${error.message}`);
    }
  }
  next();
});

// Pre-delete hook to drop the entries collection when a schema is deleted
collectionSchema.pre('deleteOne', { document: true }, async function (next) {
  try {
    const EntryModel = getEntryModel(this.name);
    await EntryModel.collection.drop();
    logger.info(`Dropped entry collection for schema '${this.name}'`);
  } catch (error: any) {
    // Only throw error if it's not a "collection doesn't exist" error
    if (error.code !== 26) { // MongoDB error code 26: namespace not found
      logger.error(`Failed to drop entry collection for schema '${this.name}': ${error.message}`);
      throw new ServerError(`Failed to drop entry collection: ${error.message}`);
    }
  }
  next();
});

function getFieldPath(fieldName: string, parentPath: string): string {
  return parentPath ? `${parentPath}.${fieldName}` : fieldName
}

async function deleteField(fieldName: string, parentPath: string, EntryModel: mongoose.Model<IEntrySchema>) {
  const fieldPath = getFieldPath(fieldName, parentPath);
  return await EntryModel.updateMany(
    { [fieldPath.split('.$[]')[0]]: { $exists: true } },
    { $unset: { [fieldPath]: "" } }   
  );
}

async function renameField(oldToNewKey: Record<string, any>, parentPath: string, EntryModel: mongoose.Model<IEntrySchema>) {
  const oldKey = Object.keys(oldToNewKey)[0]
  const newKey = Object.values(oldToNewKey)[0]

  if (!parentPath.includes('[]')) {
    const oldFieldPath = getFieldPath(oldKey, parentPath);
    const newFieldPath = getFieldPath(newKey, parentPath);
    return await EntryModel.updateMany(
      { $rename: { [oldFieldPath]: newFieldPath } }
    );
  } else {
    const entries = await EntryModel.find({});
    for (const entry of entries) {
      const updatedDoc = entry.toObject();
      const target = updatedDoc[parentPath.split('.')[0]];
      updatedDoc[target] = target.map((item: any) => {
        return Object.entries(item).reduce((acc: any, [key, value]) => {
          if (key === oldKey) {
            acc[newKey] = value;
            return acc
          }
          acc[key] = value;
          return acc;
        }, {} as Record<string, any>)
      });
      await EntryModel.updateOne({ _id: entry._id }, { $set: updatedDoc });
    }
    return
  }
}

async function updateEntries(oldFields: TField[], queryFields: TField[], EntryModel: mongoose.Model<IEntrySchema>, parentPath: string = "") {
  const oldFieldNames = oldFields.map(field => field.name);
  const queryFieldNames = queryFields.map(field => field.name);

  if (queryFields.length > oldFields.length) return;
  if (queryFields.length < oldFields.length) {
    const fieldToDelete = oldFieldNames.find((name) => !queryFieldNames.includes(name));
    return deleteField(fieldToDelete!, parentPath, EntryModel);
  }
  if (queryFields.length === oldFields.length && JSON.stringify(oldFieldNames) !== JSON.stringify(queryFieldNames)) {
    const oldToNewKey = oldFieldNames.reduce((acc, oldFieldName, index) => {
      if (oldFieldName !== queryFieldNames[index]) {
        acc[oldFieldName] = queryFieldNames[index];
      }
      return acc;
    }, {} as Record<string, string>);
    return renameField(oldToNewKey, parentPath, EntryModel);
  }

  queryFields.forEach(async (field, index) => {
    if (field.fieldType === 'CompositeField') {
      const oldCompositeFields = (oldFields[index] as ICompositeField).fields;
      const queryCompositeFields = (field as ICompositeField).fields;
      if (oldCompositeFields) return await updateEntries(oldCompositeFields, queryCompositeFields, EntryModel, field.name);
    }
    if (field.fieldType === 'FieldArray' && (field as IFieldArray).field?.fieldType === 'CompositeField') {
      const queryCompositeFields = ((field as IFieldArray).field as ICompositeField).fields
      const oldCompositeFields = ((oldFields[index] as IFieldArray).field as ICompositeField)?.fields;
      if(oldCompositeFields) return await updateEntries(oldCompositeFields, queryCompositeFields, EntryModel, `${field.name}.$[]`);
    }
    if (field.fieldType === 'FieldArray' && (!field.field)) {
      await deleteField(field.name, "", EntryModel);
    }
  })
}


 collectionSchema.pre('updateOne', async function (next) {
  try {
    const collection = await this.model.findOne(this.getQuery());
    if (!collection) {
      throw new HttpError400({
        path: "collectionName",
        msg: "Collection not found"
      });
    }

    const oldSchemaFields = (JSON.parse(collection.schemaJSON)).fields;
    const querySchemaFields = (JSON.parse((this.getUpdate() as ICollectionSchema).schemaJSON)).fields;
    const EntryModel = getEntryModel(collection.name);

    await updateEntries(oldSchemaFields, querySchemaFields, EntryModel);

    logger.info(`Updated all entries for schema '${collection.name}'`);
  } catch (error: any) {
    logger.error(`Failed to update entries for schema: ${error.message}`);
    throw new ServerError(`Failed to update entries: ${error.message}`);
  }
  next();
});

export const Collection = model('sys_Schema', collectionSchema);







