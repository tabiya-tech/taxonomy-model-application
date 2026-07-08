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
