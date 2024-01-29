import { randomUUID } from "crypto";
import { Collection, Document, MongoClient } from "mongodb";
import { upgradeModelsUUIDHistory } from "./upgradeModels";

describe("upgradeModelsUUIDHistory", () => {
  let collection: Collection<Document>;

  beforeAll(async () => {
    const client = new MongoClient(process.env.MONGODB_URI as string);
    collection = await client.db("test").createCollection("test");
  });

  beforeEach(async () => {
    await collection.deleteMany({});
  });

  test("should insert the model UUID as the first element of the UUIDHistory", async () => {
    // GIVEN a collection with some number of documents without UUIDHistories
    const docs = [];
    for (let i = 0; i < 10; i++) {
      docs.push({ UUID: randomUUID() });
    }
    await collection.insertMany(docs);

    // WHEN upgradeModelsUUIDHistory is called with the collection
    await upgradeModelsUUIDHistory(collection);

    // THEN expect all documents in the collection to have a UUIDHistory property
    const documents = await collection.find({}).toArray();
    documents.forEach((document) => {
      expect(document.UUIDHistory).toEqual([document.UUID]);
    });
  });

  test("should not modify the UUIDHistory if it already exists", async () => {
    // GIVEN a collection with some number of documents with UUIDs
    const docs = [];
    for (let i = 0; i < 10; i++) {
      docs.push({ UUID: randomUUID(), UUIDHistory: [randomUUID()] });
    }
    await collection.insertMany(docs);

    // WHEN upgradeModelsUUIDHistory is called with the collection
    await upgradeModelsUUIDHistory(collection);

    // THEN expect all documents in the collection to have a UUIDHistory property
    const documents = await collection.find({}).toArray();
    documents.forEach((document) => {
      expect(document.UUIDHistory).toEqual(document.UUIDHistory);
    });
  });
});
