import mongoose from "mongoose";
import {
  SkillEmbeddingCollectionName,
  SkillGroupEmbeddingCollectionName,
  OccupationEmbeddingCollectionName,
  OccupationGroupEmbeddingCollectionName,
} from "../../src/embeddings/entityEmbeddings/entityEmbeddingModel";
import { EntityEmbeddingIdPath } from "../../src/embeddings/entityEmbeddings/entityEmbedding.types";
import { IMigration, IMigrationResult } from "./migration.types";

/**
 * Adds a `language` field to every entity embedding document and rebuilds the unique index to include it.
 *
 * Before this migration, one embedding covered (model, entity, embeddingService, sourceField).
 * After it, embeddings are per-language: (model, entity, embeddingService, sourceField, language).
 *
 * All pre-migration embeddings were generated from the English (fallback) label text, so they receive
 * `language: "en"` during the up migration.
 */

const FALLBACK_LANGUAGE = "en";
const BATCH_SIZE = 500;

type CollectionSpec = {
  collectionName: string;
  entityIdPath: EntityEmbeddingIdPath;
};

const EMBEDDING_COLLECTIONS: CollectionSpec[] = [
  { collectionName: SkillEmbeddingCollectionName, entityIdPath: EntityEmbeddingIdPath.skillId },
  { collectionName: SkillGroupEmbeddingCollectionName, entityIdPath: EntityEmbeddingIdPath.skillGroupId },
  { collectionName: OccupationEmbeddingCollectionName, entityIdPath: EntityEmbeddingIdPath.occupationId },
  {
    collectionName: OccupationGroupEmbeddingCollectionName,
    entityIdPath: EntityEmbeddingIdPath.occupationGroupId,
  },
];

/**
 * Adds `language: "en"` to every document that does not yet have a `language` field.
 * Idempotent: documents that already carry `language` are skipped by the `$exists: false` filter.
 */
async function addLanguageField(
  connection: mongoose.Connection,
  collectionName: string
): Promise<IMigrationResult> {
  const collection = connection.db.collection(collectionName);
  let matched = 0;
  let modified = 0;

  const cursor = collection.find({ language: { $exists: false } }, { projection: { _id: 1 } });
  let batch: Parameters<typeof collection.bulkWrite>[0] = [];

  const flushBatch = async () => {
    if (batch.length === 0) return;
    const batchSize = batch.length;
    try {
      const result = await collection.bulkWrite(batch, { ordered: false });
      modified += result.modifiedCount ?? 0;
    } catch (error: unknown) {
      const writtenCount = (error as { modifiedCount?: number })?.modifiedCount ?? 0;
      modified += writtenCount;
      console.error(`0006-entity-embeddings-language: batch of ${batchSize} failed for '${collectionName}'.`, error);
    } finally {
      batch = [];
    }
  };

  for await (const doc of cursor) {
    matched++;
    batch.push({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: { language: FALLBACK_LANGUAGE } },
      },
    });
    if (batch.length >= BATCH_SIZE) {
      await flushBatch();
    }
  }
  await flushBatch();

  return { matched, modified };
}

/**
 * Removes the `language` field from every document that has one.
 * Idempotent: documents without the field are skipped.
 */
async function removeLanguageField(
  connection: mongoose.Connection,
  collectionName: string
): Promise<IMigrationResult> {
  const collection = connection.db.collection(collectionName);
  let matched = 0;
  let modified = 0;

  const cursor = collection.find({ language: { $exists: true } }, { projection: { _id: 1 } });
  let batch: Parameters<typeof collection.bulkWrite>[0] = [];

  const flushBatch = async () => {
    if (batch.length === 0) return;
    const batchSize = batch.length;
    try {
      const result = await collection.bulkWrite(batch, { ordered: false });
      modified += result.modifiedCount ?? 0;
    } catch (error: unknown) {
      const writtenCount = (error as { modifiedCount?: number })?.modifiedCount ?? 0;
      modified += writtenCount;
      console.error(
        `0006-entity-embeddings-language (down): batch of ${batchSize} failed for '${collectionName}'.`,
        error
      );
    } finally {
      batch = [];
    }
  };

  for await (const doc of cursor) {
    matched++;
    batch.push({
      updateOne: {
        filter: { _id: doc._id },
        update: { $unset: { language: "" } },
      },
    });
    if (batch.length >= BATCH_SIZE) {
      await flushBatch();
    }
  }
  await flushBatch();

  return { matched, modified };
}

/**
 * Drops the old unique index (without language) and creates the new one (with language).
 * If the old index does not exist (already dropped by a previous run), this is a no-op for the drop step.
 * If the new index already exists, the createIndex call is a no-op.
 */
async function rebuildIndexUp(connection: mongoose.Connection, spec: CollectionSpec): Promise<void> {
  const collection = connection.db.collection(spec.collectionName);
  const oldIndexName = `modelId_1_${spec.entityIdPath}_1_embeddingServiceId_1_sourceField_1`;
  const newIndexName = `modelId_1_${spec.entityIdPath}_1_embeddingServiceId_1_sourceField_1_language_1`;

  try {
    await collection.dropIndex(oldIndexName);
  } catch (e: unknown) {
    const err = e as { code?: number; codeName?: string };
    // 27 = IndexNotFound — idempotent: the old index was already dropped
    if (err?.code !== 27 && err?.codeName !== "IndexNotFound") {
      throw e;
    }
  }

  try {
    await collection.createIndex(
      { modelId: 1, [spec.entityIdPath]: 1, embeddingServiceId: 1, sourceField: 1, language: 1 },
      { unique: true, name: newIndexName }
    );
  } catch (e: unknown) {
    const err = e as { code?: number; codeName?: string; message?: string };
    // 86 = IndexKeySpecsConflict, 68 = IndexAlreadyExists
    if (
      err?.code !== 86 &&
      err?.code !== 68 &&
      err?.codeName !== "IndexKeySpecsConflict" &&
      err?.codeName !== "IndexAlreadyExists" &&
      !/already exists/i.test(err?.message ?? "")
    ) {
      throw e;
    }
  }
}

/**
 * Drops the new unique index (with language) and re-creates the old one (without language).
 */
async function rebuildIndexDown(connection: mongoose.Connection, spec: CollectionSpec): Promise<void> {
  const collection = connection.db.collection(spec.collectionName);
  const newIndexName = `modelId_1_${spec.entityIdPath}_1_embeddingServiceId_1_sourceField_1_language_1`;
  const oldIndexName = `modelId_1_${spec.entityIdPath}_1_embeddingServiceId_1_sourceField_1`;

  try {
    await collection.dropIndex(newIndexName);
  } catch (e: unknown) {
    const err = e as { code?: number; codeName?: string };
    if (err?.code !== 27 && err?.codeName !== "IndexNotFound") {
      throw e;
    }
  }

  try {
    await collection.createIndex(
      { modelId: 1, [spec.entityIdPath]: 1, embeddingServiceId: 1, sourceField: 1 },
      { unique: true, name: oldIndexName }
    );
  } catch (e: unknown) {
    const err = e as { code?: number; codeName?: string; message?: string };
    if (
      err?.code !== 86 &&
      err?.code !== 68 &&
      err?.codeName !== "IndexKeySpecsConflict" &&
      err?.codeName !== "IndexAlreadyExists" &&
      !/already exists/i.test(err?.message ?? "")
    ) {
      throw e;
    }
  }
}

const migration: IMigration = {
  name: "0006-entity-embeddings-language",
  description:
    "Adds a `language: 'en'` field to all entity embedding documents and rebuilds the unique index to include language. " +
    "Down removes the field and restores the original four-field index.",

  async up(connection: mongoose.Connection): Promise<IMigrationResult> {
    let totalMatched = 0;
    let totalModified = 0;

    for (const spec of EMBEDDING_COLLECTIONS) {
      const result = await addLanguageField(connection, spec.collectionName);
      totalMatched += result.matched;
      totalModified += result.modified;
      await rebuildIndexUp(connection, spec);
      console.info(
        `0006-entity-embeddings-language: '${spec.collectionName}' — added language to ${result.modified}/${result.matched} document(s); index rebuilt.`
      );
    }

    return { matched: totalMatched, modified: totalModified };
  },

  async down(connection: mongoose.Connection): Promise<IMigrationResult> {
    let totalMatched = 0;
    let totalModified = 0;

    for (const spec of EMBEDDING_COLLECTIONS) {
      const result = await removeLanguageField(connection, spec.collectionName);
      totalMatched += result.matched;
      totalModified += result.modified;
      await rebuildIndexDown(connection, spec);
      console.info(
        `0006-entity-embeddings-language (down): '${spec.collectionName}' — removed language from ${result.modified}/${result.matched} document(s); index restored.`
      );
    }

    return { matched: totalMatched, modified: totalModified };
  },
};

export default migration;
