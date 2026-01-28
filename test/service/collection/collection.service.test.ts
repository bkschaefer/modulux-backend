import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { Collection } from "../../../src/model/collection.model";
import {
  createCollection,
  deleteCollection,
  getAllCollectionNames,
  getCollection,
  updateCollection,
} from "../../../src/services/collection-services/collection.services";
import { HttpError400 } from "../../../src/errors/HttpError";

describe("Collection Service Integration Tests", () => {
  let mongoServer: MongoMemoryServer;

  const baseSchema = {
    name: "testCollection",
    title: "Test Collection",
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

  test("Create a new collection", async () => {
    const result = await createCollection(baseSchema);
    expect(result).toEqual(baseSchema);

    const savedCollection = await Collection.findOne({ name: baseSchema.name });
    expect(savedCollection).toBeTruthy();
  });

  test("Fail to create collection with existing name", async () => {
    await createCollection(baseSchema);

    await expect(createCollection(baseSchema)).rejects.toThrow(HttpError400);
  });

  test("Retrieve all collection names", async () => {
    await createCollection(baseSchema);
    await createCollection({
      ...baseSchema,
      name: "anotherCollection",
      title: "Another Collection",
    });

    const names = await getAllCollectionNames();
    expect(names).toHaveLength(2);
    expect(names.map((c) => c.name)).toEqual(
      expect.arrayContaining(["testcollection", "anothercollection"]),
    );
  });

  test("Retrieve existing collection", async () => {
    await createCollection(baseSchema);

    const result = await getCollection("testCollection");
    expect(result.schema.name).toBe("testCollection");
    expect(result.entries).toEqual([]);
  });

  test("Fail to retrieve non-existent collection", async () => {
    await expect(getCollection("nonexistent")).rejects.toThrow(HttpError400);
  });

  test("Delete existing collection", async () => {
    await createCollection(baseSchema);

    await deleteCollection("testCollection");

    const deletedCollection = await Collection.findOne({
      name: "testCollection",
    });
    expect(deletedCollection).toBeNull();
  });

  test("Fail to delete non-existent collection", async () => {
    await expect(deleteCollection("nonexistent")).rejects.toThrow(HttpError400);
  });

  test("Update existing collection", async () => {
    await createCollection(baseSchema);

    const updatedSchema = {
      ...baseSchema,
      title: "Updated Collection",
    };

    const result = await updateCollection("testCollection", updatedSchema);
    expect(result.title).toBe("Updated Collection");

    const savedCollection = await Collection.findOne({
      name: "testCollection",
    });
    const parsedSchema = JSON.parse(savedCollection!.schemaJSON);
    expect(parsedSchema.title).toBe("Updated Collection");
  });

  test("Fail to update non-existent collection", async () => {
    await expect(updateCollection("nonexistent", baseSchema)).rejects.toThrow(
      HttpError400,
    );
  });
});
