import { IOccupationGroup } from "esco/occupationGroup/_shared/OccupationGroup.types";
import {
  INewOccupationSpecWithoutImportId,
  IOccupation,
  IPartialUpdateOccupationSpec,
  ISkillWithRelation,
  IUpdateOccupationSpec,
} from "../_shared/occupation.types";
import { IOccupationReference } from "esco/occupations/_shared/occupationReference.types";
import { IModelInfoReference } from "modelInfo/modelInfo.types";
import { EmbeddableField } from "embeddings/service/types";

export enum ModelForOccupationValidationErrorCode {
  FAILED_TO_FETCH_FROM_DB,
  MODEL_NOT_FOUND_BY_ID,
  MODEL_IS_RELEASED,
}

export class OccupationModelValidationError extends Error {
  constructor(public code: ModelForOccupationValidationErrorCode) {
    super();
  }
}

// Re-export for consumers that import ISkillWithRelation from here
export type { ISkillWithRelation };

/**
 * A single entry of an occupation's model history: the occupation's reference (as it appeared in that model)
 * together with a lightweight reference to the model it belonged to.
 */
export interface IOccupationHistoryEntry {
  entity: IOccupationReference;
  model: IModelInfoReference;
}

export interface IOccupationService {
  /**
   * Creates a new Occupation entry.
   */
  create(newOccupationSpec: INewOccupationSpecWithoutImportId): Promise<IOccupation>;

  /** Finds an Occupation entry by its ID. */
  findById(id: string): Promise<IOccupation | null>;

  findPaginated(
    modelId: string,
    cursor: { id: string; createdAt: Date } | undefined,
    limit: number,
    desc?: boolean
  ): Promise<{ items: IOccupation[]; nextCursor: { _id: string; createdAt: Date } | null }>;

  /**
   * Searches the Occupations of a model by a free-text value on the given searchFields.
   *
   * Uses vector (embeddings) similarity ranked by relevance when the model is released and its embeddings have
   * been generated, and a case-insensitive regex match otherwise. The returned nextCursor is already encoded (its
   * shape depends on the strategy) and should be passed back verbatim as the `cursor` argument to fetch the next
   * page.
   *
   * @param {string} modelId - The modelId of the Occupations.
   * @param {string} searchValue - The free-text value to search for.
   * @param {EmbeddableField[]} searchFields - The fields to search the value on.
   * @param {string | undefined} cursor - The opaque pagination cursor from a previous page, if any.
   * @param {number} limit - The maximum number of Occupations to return.
   * @return {Promise<{ items: IOccupation[]; nextCursor: string | null }>} - The page of Occupations (ordered by
   * relevance for vector search) and the encoded cursor of the next page, if any.
   */
  searchPaginated(
    modelId: string,
    searchValue: string,
    searchFields: EmbeddableField[],
    cursor: string | undefined,
    limit: number
  ): Promise<{ items: IOccupation[]; nextCursor: string | null }>;

  validateModelForOccupation(modelId: string): Promise<ModelForOccupationValidationErrorCode | null>;

  getParent(modelId: string, occupationId: string): Promise<IOccupation | IOccupationGroup | null>;

  getChildren(
    modelId: string,
    occupationId: string,
    cursor: string | undefined,
    limit: number
  ): Promise<{ items: IOccupation[]; nextCursor: { _id: string; createdAt: Date } | null }>;

  getSkills(
    modelId: string,
    occupationId: string,
    cursor: string | undefined,
    limit: number
  ): Promise<{ items: ISkillWithRelation[]; nextCursor: { _id: string; createdAt: Date } | null }>;

  /**
   * Fully replaces the mutable fields of an Occupation (PUT semantics).
   * Validates that the model exists and is not released before updating.
   */
  update(id: string, modelId: string, spec: IUpdateOccupationSpec): Promise<IOccupation | null>;

  /**
   * Partially updates an Occupation (PATCH semantics).
   */
  patch(id: string, modelId: string, spec: IPartialUpdateOccupationSpec): Promise<IOccupation | null>;

  /**
   * Resolves the history of the models an Occupation appeared in, based on its UUIDHistory.
   * For each UUID in the occupation's UUIDHistory (newest first) that resolves to an existing model,
   * returns the model reference and the occupation reference as it appeared in that model.
   * UUIDs that do not resolve to an existing model are skipped.
   */
  getHistory(occupationId: string): Promise<IOccupationHistoryEntry[] | null>;
}
