import { Collection, Document } from "mongodb";

export async function upgradeModelsWithLanguageAndOriginalModelFields(collection: Collection<Document>) {
  const documents = await collection.find({}).toArray();
  for (const document of documents) {
    document.language = "english";
    document.originalModel = null;
    await collection.updateOne({ _id: document._id }, { $set: document });
  }
}