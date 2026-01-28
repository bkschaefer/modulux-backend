import { MongoMemoryServer } from "mongodb-memory-server";
import { HttpError400 } from "../../../src/errors/HttpError";
import { ServerError } from "../../../src/errors/ServerError";
import { logger } from "../../../src/logger";
import { Collection } from "../../../src/model/collection.model";
import {
  getCollectionSchema,
  updateSchemaFieldSettings,
} from "../../../src/services/collection-services/collection.schema.services";
import mongoose from "mongoose";
import {
  createCollection,
  deleteCollection,
  updateCollection,
} from "../../../src/services/collection-services/collection.services";

describe("Collection Schema Service Integration Tests", () => {
  let mongoServer: MongoMemoryServer;

  const baseSchema = {
    name: "testSchema",
    title: "Test Schema",
    fields: [
      {
        name: "testField",
        label: "Test Field",
        fieldType: "TextField",
        required: true,
      },
    ],
  };

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Collection.deleteMany({});
  });

  test("Retrieve existing schema", async () => {
    await createCollection(baseSchema);

    const result = await getCollectionSchema("testSchema");
    expect(result.name).toBe("testSchema");
    expect(result.fields).toHaveLength(1);
  });

  test("Fail to retrieve non-existent schema", async () => {
    await expect(getCollectionSchema("nonexistent")).rejects.toThrow(
      HttpError400,
    );
  });

  test("Delete existing schema", async () => {
    await createCollection(baseSchema);

    await deleteCollection("testSchema");

    const deletedSchema = await Collection.findOne({
      name: "testSchema",
    });
    expect(deletedSchema).toBeNull();
  });

  test("Fail to delete non-existent schema", async () => {
    await expect(deleteCollection("nonexistent")).rejects.toThrow(HttpError400);
  });

  test("update Schema field settings", async () => {
    await createCollection(baseSchema);
  
    const newSettings = {
      dataTable: {
        visible: false,
        columnWidth: 200,
      },
    };
  
    await updateSchemaFieldSettings("testSchema", "testField", newSettings);
  
    const updatedSchema = await getCollectionSchema("testSchema");
    const updatedField = updatedSchema.fields.find(
      (field) => field.name === "testField"
    );
  
    expect(updatedField!.settings.dataTable.visible).toBe(false);
    expect(updatedField!.settings.dataTable.columnWidth).toBe(200);
  });
  
  test("Fail to update Schema field settings", async () => {
    await createCollection(baseSchema);
  
    const invalidSettings = {
      dataTable: {
        visible: true,
        columnWidth: 150,
      },
    };
  
    await expect(
      updateSchemaFieldSettings("testSchema", "nonexistentField", invalidSettings)
    ).rejects.toThrow(HttpError400);
  
    await expect(
      updateSchemaFieldSettings("nonexistentSchema", "testField", invalidSettings)
    ).rejects.toThrow(HttpError400);
  });
  
});
