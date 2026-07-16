import mongoose from "mongoose";
import { ISetEntityEmbeddingStatusSpec, ISetModelEntitiesEmbeddingStatusSpec } from "./entityEmbedding.types";

/**
 * Shared implementation of IEmbeddableEntityRepository.setEntityEmbeddingStatus.
 *
 * Only the entity repositories (skill, skill group, occupation, occupation group) may call this helper
 * with their own model — services must go through the repository methods, as only repositories are
 * responsible for accessing the mongoose models.
 */
export async function setEntityEmbeddingStatus<T>(
  entityModel: mongoose.Model<T>,
  spec: ISetEntityEmbeddingStatusSpec
): Promise<void> {
  await entityModel
    .updateOne(
      { _id: { $eq: spec.entityId }, modelId: { $eq: spec.modelId } } as mongoose.FilterQuery<T>,
      {
        $set: { [`embeddingStatus.${spec.embeddingServiceId}`]: spec.status },
      } as mongoose.UpdateQuery<T>
    )
    .exec();
}

/**
 * Shared implementation of IEmbeddableEntityRepository.setModelEntitiesEmbeddingStatus.
 *
 * Only the entity repositories (skill, skill group, occupation, occupation group) may call this helper
 * with their own model — services must go through the repository methods, as only repositories are
 * responsible for accessing the mongoose models.
 */
export async function setModelEntitiesEmbeddingStatus<T>(
  entityModel: mongoose.Model<T>,
  spec: ISetModelEntitiesEmbeddingStatusSpec
): Promise<void> {
  await entityModel
    .updateMany(
      { modelId: { $eq: spec.modelId } } as mongoose.FilterQuery<T>,
      {
        $set: { [`embeddingStatus.${spec.embeddingServiceId}`]: spec.status },
      } as mongoose.UpdateQuery<T>
    )
    .exec();
}
