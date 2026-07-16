import mongoose from "mongoose";
import {
  EntityEmbeddingIdPath,
  IEntityEmbedding,
  IEntityEmbeddingDoc,
  INewEntityEmbeddingSpec,
} from "./entityEmbedding.types";

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
}
