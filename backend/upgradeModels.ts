import { Collection, Document } from "mongodb";

export async function upgradeModelsUUIDHistory(collection: Collection<Document>) {
  const documents = await collection.find({}).toArray();
  for (const document of documents) {
    if (document.UUIDHistory) continue;
    document.UUIDHistory = [document.UUID];
    await collection.updateOne({ _id: document._id }, { $set: document });
  }
}
