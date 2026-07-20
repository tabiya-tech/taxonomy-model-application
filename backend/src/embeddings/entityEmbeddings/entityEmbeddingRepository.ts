import mongoose from "mongoose";
import {
  EntityEmbeddingIdPath,
  IEntityEmbedding,
  IEntityEmbeddingDoc,
  INewEntityEmbeddingSpec,
  IVectorSearchHit,
  IVectorSearchParams,
} from "./entityEmbedding.types";
import { EMBEDDING_VECTOR_PATH } from "./vectorSearchIndex.constant";

export interface IEntityEmbeddingRepository<
  Doc extends IEntityEmbeddingDoc = IEntityEmbeddingDoc,
  Entity extends IEntityEmbedding = IEntityEmbedding,
> {
  readonly Model: mongoose.Model<Doc>;

  /**
   * The database path under which the id of the embedded entity is stored (e.g. skillId).
   */
  readonly entityIdPath: EntityEmbeddingIdPath;

  /**
   * Creates or updates the embedding of the given entity for the given embedding service and source field.
   *
   * @param {INewEntityEmbeddingSpec} spec - The specification of the embedding to upsert.
   * @return {Promise<Entity>} - A Promise that resolves to the upserted embedding.
   * Rejects with an error if the embedding cannot be upserted.
   */
  upsert(spec: INewEntityEmbeddingSpec): Promise<Entity>;

  /**
   * Finds all the embeddings of the given entity for the given embedding service.
   *
   * @param {string} modelId - The unique ID of the model the entity belongs to.
   * @param {string} entityId - The unique ID of the entity.
   * @param {string} embeddingServiceId - The unique ID of the embedding service.
   * @return {Promise<Entity[]>} - A Promise that resolves to the found embeddings (one per source field).
   * Rejects with an error if the operation fails.
   */
  findByEntity(modelId: string, entityId: string, embeddingServiceId: string): Promise<Entity[]>;

  /**
   * Runs a vector (embeddings) similarity search over the collection and returns the matched entities,
   * ranked by relevance (best first), deduplicated so that each entity appears at most once (with its
   * best-scoring source field).
   *
   * Requires an Atlas Vector Search index (see scripts/createVectorSearchIndex.ts) to exist on the
   * collection; it therefore only works against a real Atlas deployment.
   *
   * @param {IVectorSearchParams} params - The parameters of the search.
   * @return {Promise<IVectorSearchHit[]>} - A Promise that resolves to the ranked hits.
   * Rejects with an error if the operation fails.
   */
  vectorSearch(params: IVectorSearchParams): Promise<IVectorSearchHit[]>;
}

export class EntityEmbeddingRepository<
  Doc extends IEntityEmbeddingDoc = IEntityEmbeddingDoc,
  Entity extends IEntityEmbedding = IEntityEmbedding,
> implements IEntityEmbeddingRepository<Doc, Entity>
{
  public readonly Model: mongoose.Model<Doc>;
  public readonly entityIdPath: EntityEmbeddingIdPath & keyof Doc;

  constructor(model: mongoose.Model<Doc>, entityIdPath: EntityEmbeddingIdPath & keyof Doc) {
    this.Model = model;
    this.entityIdPath = entityIdPath;
  }

  /**
   * Normalizes a document to the repository's return shape,
   * where the entity-specific id path (e.g. skillId) is exposed as `entityId`.
   */
  private toEntityEmbedding(doc: mongoose.HydratedDocument<Doc>): Entity {
    const object = doc.toObject();
    const { [this.entityIdPath]: entityId, ...rest } = object;
    return {
      ...rest,
      entityId: `${entityId}`,
    } as unknown as Entity;
  }

  async upsert(spec: INewEntityEmbeddingSpec): Promise<Entity> {
    try {
      const { entityId, modelId, embeddingServiceId, sourceField, ...mutableFields } = spec;
      const doc = await this.Model.findOneAndUpdate(
        {
          modelId: { $eq: modelId },
          [this.entityIdPath]: { $eq: entityId },
          embeddingServiceId: { $eq: embeddingServiceId },
          sourceField: { $eq: sourceField },
        },
        { $set: { ...mutableFields } },
        { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
      ).exec();
      return this.toEntityEmbedding(doc);
    } catch (e: unknown) {
      const err = new Error("EntityEmbeddingRepository.upsert: upsert failed", { cause: e });
      console.error(err);
      throw err;
    }
  }

  async findByEntity(modelId: string, entityId: string, embeddingServiceId: string): Promise<Entity[]> {
    try {
      const docs = await this.Model.find({
        modelId: { $eq: modelId },
        [this.entityIdPath]: { $eq: entityId },
        embeddingServiceId: { $eq: embeddingServiceId },
      }).exec();
      return docs.map((doc) => this.toEntityEmbedding(doc));
    } catch (e: unknown) {
      const err = new Error("EntityEmbeddingRepository.findByEntity: findByEntity failed", { cause: e });
      console.error(err);
      throw err;
    }
  }

  async vectorSearch(params: IVectorSearchParams): Promise<IVectorSearchHit[]> {
    try {
      const numFields = Math.max(params.searchFields.length, 1);
      // The number of distinct (higher-ranked) entities we ultimately need to have available.
      const need = params.offset + params.limit;
      // Each entity has at most one embedding document per source field, so to reach `need` distinct entities
      // we over-fetch up to need * numFields embedding documents (the searchTopK).
      const searchTopK = Math.max(need * numFields, 1);
      // Atlas recommends numCandidates to be well above the requested limit for good recall; keep it bounded.
      const numCandidates = Math.min(Math.max(searchTopK * 10, 100), 10_000);

      // $vectorSearch is an Atlas Search stage that mongoose 7's PipelineStage type does not yet know about,
      // hence the cast. It must be the first stage of the pipeline.
      const pipeline = [
        {
          $vectorSearch: {
            index: params.indexName,
            path: EMBEDDING_VECTOR_PATH,
            queryVector: params.queryVector,
            numCandidates,
            limit: searchTopK,
            filter: {
              modelId: new mongoose.Types.ObjectId(params.modelId),
              embeddingServiceId: { $eq: params.embeddingServiceId },
              sourceField: { $in: params.searchFields },
            },
          },
        },
        { $addFields: { _vectorSearchScore: { $meta: "vectorSearchScore" } } },
        // An entity can match on several of its source fields; keep one row per entity with its best score.
        { $group: { _id: `$${this.entityIdPath}`, score: { $max: "$_vectorSearchScore" } } },
        { $sort: { score: -1, _id: 1 } },
        { $skip: params.offset },
        { $limit: params.limit },
      ] as unknown as mongoose.PipelineStage[];

      const results = await this.Model.aggregate(pipeline).exec();

      return results.map((result) => ({ entityId: `${result._id}`, score: result.score as number }));
    } catch (e: unknown) {
      const err = new Error("EntityEmbeddingRepository.vectorSearch: vectorSearch failed", { cause: e });
      console.error(err);
      throw err;
    }
  }
}
