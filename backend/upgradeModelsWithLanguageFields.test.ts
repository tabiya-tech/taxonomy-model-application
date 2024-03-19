import { Collection, Document, MongoClient } from "mongodb";
import {upgradeModelsWithLanguageAndOriginalModelFields} from "./upgradeModelsWithLanguageFields";

describe("upgradeModelsWithLanguageAndOriginalModelFields", () => {
  let collection: Collection<Document>;

  beforeAll(async () => {
    const client = new MongoClient(process.env.MONGODB_URI as string);
    collection = await client.db("test").createCollection("ModelInfo");
  });

  beforeEach(async () => {
    await collection.deleteMany({});
  });

  test("should add the fields 'language' and originalModel to the modelInfo", async () => {
    // GIVEN a collection with some number of documents
    const docs = [];
    for (let i = 0; i < 10; i++) {
      docs.push({ foo: "bar" });
    }
    await collection.insertMany(docs);

    // WHEN upgradeModelsWithLanguageAndOriginalModelFields is called with the collection
    await upgradeModelsWithLanguageAndOriginalModelFields(collection);

    // THEN expect all documents in the collection to have the properties 'language' and 'originalModel' set correctly
    const documents = await collection.find({}).toArray();
    documents.forEach((document) => {
      expect(document).toEqual(expect.objectContaining({
        language: "english",
        originalModel: null,
      }))
    });
  });
});
