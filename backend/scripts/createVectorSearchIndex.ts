import mongoose from "mongoose";
import { getNewConnection } from "../src/server/connection/newConnection";
import { getDbURI, readEnvironmentConfiguration, setConfiguration } from "../src/server/config/config";
import {
  SkillEmbeddingCollectionName,
  OccupationEmbeddingCollectionName,
  OccupationGroupEmbeddingCollectionName,
  SkillGroupEmbeddingCollectionName,
} from "../src/embeddings/entityEmbeddings/entityEmbeddingModel";
import {
  EMBEDDING_VECTOR_PATH,
  SkillsEmbeddingsVectorSearchIndexName,
  SkillGroupsEmbeddingsVectorSearchIndexName,
  OccupationGroupsEmbeddingsVectorSearchIndexName,
  OccupationsEmbeddingsVectorSearchIndexName,
} from "../src/embeddings/entityEmbeddings/vectorSearchIndex.constant";

type CollectionConfig = {
  collectionName: string;
  indexName: string;
};

const COLLECTIONS: CollectionConfig[] = [
  {
    collectionName: SkillEmbeddingCollectionName,
    indexName: SkillsEmbeddingsVectorSearchIndexName,
  },
  {
    collectionName: OccupationEmbeddingCollectionName,
    indexName: OccupationsEmbeddingsVectorSearchIndexName,
  },
  {
    collectionName: OccupationGroupEmbeddingCollectionName,
    indexName: OccupationGroupsEmbeddingsVectorSearchIndexName,
  },
  {
    collectionName: SkillGroupEmbeddingCollectionName,
    indexName: SkillGroupsEmbeddingsVectorSearchIndexName,
  },
];

/**
 * Returns true when the given error indicates the search index already exists (so creation is a no-op).
 */
export function isIndexAlreadyExistsError(error: unknown): boolean {
  const err = error as { code?: number; codeName?: string; message?: string };
  return (
    err?.code === 68 ||
    err?.codeName === "IndexAlreadyExists" ||
    /already exists|duplicate index/i.test(err?.message ?? "")
  );
}

/**
 * Creates the skills vector search index on the given connection. Idempotent: if the index already exists,
 * it logs and returns without error.
 */
export async function createSkillsVectorSearchIndex(
  connection: mongoose.Connection,
  collectionConfig: CollectionConfig
): Promise<void> {
  const numDimensions = 768;
  const definition = {
    fields: [
      { type: "vector", path: EMBEDDING_VECTOR_PATH, numDimensions, similarity: "cosine" },
      { type: "filter", path: "modelId" },
      { type: "filter", path: "embeddingServiceId" },
      { type: "filter", path: "sourceField" },
    ],
  };

  try {
    await connection.db.command({
      createSearchIndexes: collectionConfig.collectionName,
      indexes: [{ name: collectionConfig.indexName, type: "vectorSearch", definition }],
    });
    console.info(
      `Created vector search index '${collectionConfig.indexName}' on '${collectionConfig.collectionName}' ` +
        `(${numDimensions} dimensions, cosine similarity).`
    );
  } catch (error: unknown) {
    if (isIndexAlreadyExistsError(error)) {
      console.info(
        `Vector search index '${collectionConfig.indexName}' already exists on ` +
          `'${collectionConfig.collectionName}'. Nothing to do.`
      );
      return;
    }
    throw error;
  }
}

async function main(): Promise<void> {
  setConfiguration(readEnvironmentConfiguration());
  const connection = await getNewConnection(getDbURI());
  try {
    for (const collection of COLLECTIONS) {
      try {
        await createSkillsVectorSearchIndex(connection, collection);
      } catch (e) {
        console.error(`Failed to create vector search index for collection '${collection.collectionName}':`, e);
      }
    }
  } finally {
    await connection.close(false);
  }
}

// Only run when invoked directly (not when imported by a test).
if (require.main === module) {
  main()
    .then(() => {
      console.info("Vector search index creation completed.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Vector search index creation failed:", error);
      process.exit(1);
    });
}
