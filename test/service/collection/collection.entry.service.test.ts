import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { Collection, getEntryModel } from "../../../src/model/collection.model";
const {ObjectId} = require('mongodb')
import { HttpError400 } from "../../../src/errors/HttpError";
import { ServerError } from "../../../src/errors/ServerError";
import {
  addEntryToCollection,
  deleteEntriesFromCollection,
  getCollectionEntry,
  updateCollectionEntry,
} from "../../../src/services/collection-services/collection.entry.services";
import { getCollection } from "../../../src/services/collection-services/collection.services";

describe("Collection Entry Service Integration Tests", () => {
  let mongoServer: MongoMemoryServer;

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
    await Collection.create({
      name: "testCollection",
      title: "Test Collection",
      entries: [],
      schemaJSON: JSON.stringify({
        name: "testCollection",
        fields: [
          { name: "field1", fieldType: "TextField", required: true },
          { name: "imageField", fieldType: "ImageField", required: false },
        ],
      }),
    });
  });

  afterEach(async () => {
    const EntryModel = getEntryModel("testCollection");
    await EntryModel.deleteMany({});
  });

  test("Fail to retrieve non-existent entry", async () => {
    await expect(
      getCollectionEntry("testCollection", "nonexistentId"),
    ).rejects.toThrow();
  });

  test("Add entry to collection", async () => {
    const newEntry = { field1: "new value" };

    const addedEntry = await addEntryToCollection("testCollection", newEntry);
    expect(addedEntry.field1).toBe("new value");

    const collection = await Collection.findOne({ name: "testCollection" });
    expect(collection).toBeDefined();

    const EntryModel = getEntryModel("testCollection");
    const entries = await EntryModel.find();
    expect(entries.length).toBe(1);
  });

  test("Fail to add entry to non-existent collection", async () => {
    await expect(
      addEntryToCollection("nonexistentCollection", { field1: "value" }),
    ).rejects.toThrow();
  });

  test("Update collection entry", async () => {
    const firstEntry = { field1: "first value" };
    const addedEntry = await addEntryToCollection("testCollection", firstEntry);

    const newEntry = { field1: "new value" };
    const updatedEntry = await updateCollectionEntry(
      "testCollection",
      addedEntry._id!.toString(),
      newEntry,
    );

    expect(updatedEntry).toEqual(
      expect.objectContaining({
        _id: addedEntry._id,
        field1: "new value",
      }),
    );
  });

  test("Fail to update non-existent entry", async () => {
    await expect(
      updateCollectionEntry("testCollection", new ObjectId("6792955e3e9d16e59f94f526"), {
        field1: "updated value",
      }),
    ).rejects.toThrow();
  });

  test("Delete entries from collection", async () => {
    const entry1 = await addEntryToCollection("testCollection", {
      field1: "value1",
    });
    const entry2 = await addEntryToCollection("testCollection", {
      field1: "value2",
    });
  
    await deleteEntriesFromCollection("testCollection", [entry1._id!.toString()]);
  
    const EntryModel = getEntryModel("testCollection");
    const remainingEntries = await EntryModel.find();
  
    expect(remainingEntries.length).toBe(1);
    expect(remainingEntries[0]._id!.toString()).toBe(entry2._id!.toString());
  });

  test("Fail to delete non-existent entry", async () => {
    await expect(
      deleteEntriesFromCollection("testCollection", [new ObjectId("6792955e3e9d16e59f94f526")]),
    ).rejects.toThrow();
  });
});
