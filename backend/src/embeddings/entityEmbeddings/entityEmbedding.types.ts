import mongoose from "mongoose";
import { EmbeddableField } from "embeddings/service/types";

/**
 * The status of the embeddings generation of a single entity (skill, skill group, occupation or occupation group)
 * for a specific embedding service.
 * It is stored on the entity itself, under `embeddingStatus.<embeddingServiceId>`.
 */
export enum EntityEmbeddingStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  FAILED = "failed",
}

/**
 * The database paths under which the id of the embedded entity is stored,
 * one per entity embeddings collection.
 */
export enum EntityEmbeddingIdPath {
  skillId = "skillId",
  skillGroupId = "skillGroupId",
  occupationId = "occupationId",
  occupationGroupId = "occupationGroupId",
}

/**
 * The fields shared by all the entity embeddings collections (skillsEmbeddings, skillGroupsEmbeddings,
 * occupationsEmbeddings, occupationGroupsEmbeddings).
 *
 * Each collection additionally stores the id of the embedded entity under its own entity-specific path
 * (see the entity-specific doc interfaces below).
 */
export interface IEntityEmbeddingDoc {
  modelId: mongoose.Types.ObjectId;
  embeddingServiceId: string;
  sourceHash: string;
  sourceField: EmbeddableField;
  sourceText: string;
  vector: number[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Describes how a skill embedding is saved in the database (skillsEmbeddings collection).
 */
export interface ISkillEmbeddingDoc extends IEntityEmbeddingDoc {
  [EntityEmbeddingIdPath.skillId]: mongoose.Types.ObjectId;
}

/**
 * Describes how a skill group embedding is saved in the database (skillGroupsEmbeddings collection).
 */
export interface ISkillGroupEmbeddingDoc extends IEntityEmbeddingDoc {
  [EntityEmbeddingIdPath.skillGroupId]: mongoose.Types.ObjectId;
}

/**
 * Describes how an occupation embedding is saved in the database (occupationsEmbeddings collection).
 */
export interface IOccupationEmbeddingDoc extends IEntityEmbeddingDoc {
  [EntityEmbeddingIdPath.occupationId]: mongoose.Types.ObjectId;
}

/**
 * Describes how an occupation group embedding is saved in the database (occupationGroupsEmbeddings collection).
 */
export interface IOccupationGroupEmbeddingDoc extends IEntityEmbeddingDoc {
  [EntityEmbeddingIdPath.occupationGroupId]: mongoose.Types.ObjectId;
}

/**
 * Describes how an entity embedding is returned from the repository.
 * The entity-specific id path (e.g. skillId) is normalized to `entityId`.
 */
export interface IEntityEmbedding {
  id: string;
  modelId: string;
  entityId: string;
  embeddingServiceId: string;
  sourceHash: string;
  sourceField: EmbeddableField;
  sourceText: string;
  vector: number[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Describes how a new entity embedding is created or updated (upserted).
 */
export type INewEntityEmbeddingSpec = Omit<IEntityEmbedding, "id" | "createdAt" | "updatedAt">;

/**
 * Describes how the embedding status of a single entity is set for an embedding service.
 */
export interface ISetEntityEmbeddingStatusSpec {
  modelId: string;
  entityId: string;
  embeddingServiceId: string;
  status: EntityEmbeddingStatus;
}

/**
 * Describes how the embedding status of all the entities of a model is set for an embedding service.
 */
export type ISetModelEntitiesEmbeddingStatusSpec = Omit<ISetEntityEmbeddingStatusSpec, "entityId">;

/**
 * The embedding-status operations that every repository of an embeddable entity
 * (skill, skill group, occupation, occupation group) exposes.
 *
 * Only repositories are responsible for accessing the mongoose models,
 * so services must set the embedding statuses through these methods.
 */
export interface IEmbeddableEntityRepository {
  /**
   * Sets the embedding status of a single entity of the repository for the given embedding service,
   * under the `embeddingStatus.<embeddingServiceId>` path of the entity.
   *
   * @param {ISetEntityEmbeddingStatusSpec} spec - The specification of the status to set.
   * @return {Promise<void>} - A Promise that resolves when the status has been set.
   * Rejects with an error if the operation fails.
   */
  setEntityEmbeddingStatus(spec: ISetEntityEmbeddingStatusSpec): Promise<void>;

  /**
   * Sets the embedding status of all the entities of a model in the repository for the given embedding service,
   * under the `embeddingStatus.<embeddingServiceId>` path of each entity.
   *
   * @param {ISetModelEntitiesEmbeddingStatusSpec} spec - The specification of the status to set.
   * @return {Promise<void>} - A Promise that resolves when the statuses have been set.
   * Rejects with an error if the operation fails.
   */
  setModelEntitiesEmbeddingStatus(spec: ISetModelEntitiesEmbeddingStatusSpec): Promise<void>;
}
