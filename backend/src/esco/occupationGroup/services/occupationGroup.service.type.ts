import {
  INewOccupationGroupSpecWithoutImportId,
  IOccupationGroup,
  ModelForOccupationGroupValidationErrorCode,
  IOccupationGroupChild,
} from "esco/occupationGroup/_shared/OccupationGroup.types";
import { ObjectTypes } from "esco/common/objectTypes";
import { IModelInfo, IModelInfoReference } from "modelInfo/modelInfo.types";

export class OccupationGroupModelValidationError extends Error {
  constructor(public code: ModelForOccupationGroupValidationErrorCode) {
    super();
  }
}

export interface FindPaginatedFilter {
  root?: boolean;
}

/**
 * A single entry of an occupation group's model history: a full ModelInfo together with the resolved
 * details of that model's own UUIDHistory (used to build the modelHistory field of the response).
 */
export interface IOccupationGroupHistoryEntry {
  model: IModelInfo;
  modelHistoryDetails: IModelInfoReference[];
}

export enum SetOccupationGroupParentErrorCode {
  CHILD_NOT_FOUND,
  PARENT_NOT_FOUND,
  PARENT_CHILD_CODE_INCONSISTENT,
}

export class SetOccupationGroupParentError extends Error {
  constructor(public code: SetOccupationGroupParentErrorCode) {
    super();
  }
}

export interface IOccupationGroupService {
  /**
   * Creates a new OccupationGroup entry.
   *
   * @param {INewOccupationGroupSpecWithoutImportId} newOccupationGroupSpec - The specification for the new OccupationGroup entry.
   * @return {Promise<IOccupationGroup>} - A Promise that resolves to the newly created OccupationGroup entry.
   * Rejects with an error if the OccupationGroup entry cannot be created due to reasons other than validation.
   */
  create(newOccupationGroupSpec: INewOccupationGroupSpecWithoutImportId): Promise<IOccupationGroup>;

  /**
   * Finds an OccupationGroup entry by its ID.
   *
   * @param {string} id - The unique ID of the OccupationGroup entry.
   * @return {Promise<IOccupationGroup|null>} - A Promise that resolves to the found OccupationGroup entry or null if not found.
   * Rejects with an error if the operation fails.
   */
  findById(id: string): Promise<IOccupationGroup | null>;

  /**
   * Finds an OccupationGroup parent entry by its ID.
   *
   * @param {string} id - The unique ID of the OccupationGroup entry.
   * @return {Promise<IOccupationGroup|null>} - A Promise that resolves to the found OccupationGroup parent entry or null if not found.
   * Rejects with an error if the operation fails.
   */
  findParent(id: string): Promise<IOccupationGroup | null>;

  /**
   * Finds an OccupationGroup children entry by its ID.
   *
   * @param {string} id - The unique ID of the OccupationGroup entry.
   * @return {Promise<IOccupationGroupChild[]>} - A Promise that resolves to the found OccupationGroup children entry or [] if not found.
   * Rejects with an error if the operation fails.
   */
  findChildren(id: string): Promise<IOccupationGroupChild[]>;

  /**
   * Returns paginated OccupationGroups. The OccupationGroups are transformed to objects (via .lean()), however
   * in the current version they are not populated with parents or children. This will be implemented in a future version.
   * @param {string} modelId - The modelId of the OccupationGroups.
   * @param {object} cursor - The cursor for pagination.
   * @param {number} limit - The maximum number of OccupationGroups to return.
   * @param {boolean} [desc] - Whether to sort the results in descending order. Default is true.
   * @param {FindPaginatedFilter} [filter] - Optional filter to apply to the query.
   * @return {Promise<{items: IOccupationGroup[], nextCursor: {_id: string, createdAt: Date} | null}>} - An array of IOccupationGroups and the next cursor (if any)
   * Rejects with an error if the operation fails.
   */
  findPaginated(
    modelId: string,
    cursor: { id: string; createdAt: Date } | undefined,
    limit: number,
    desc?: boolean,
    filter?: FindPaginatedFilter
  ): Promise<{ items: IOccupationGroup[]; nextCursor: { _id: string; createdAt: Date } | null }>;

  /**
   * Validates that a model exists and is not released for occupation group creation
   * @param {string} modelId - The model ID to validate
   * @return {Promise<ModelForOccupationGroupValidationErrorCode | null>} - Returns null if valid, otherwise the error code
   */
  validateModelForOccupationGroup(modelId: string): Promise<ModelForOccupationGroupValidationErrorCode | null>;

  /**
   * Sets the parent for an occupation group by creating or updating a hierarchy entry.
   * Throws OccupationGroupModelValidationError if model is invalid.
   * Throws SetOccupationGroupParentError if child or parent is not found.
   *
   * @param params.childId - The ID of the child occupation group.
   * @param params.parentId - The ID of the parent occupation group.
   * @param params.parentType - The type of the parent occupation group.
   * @param params.modelId - The model ID.
   * @return {Promise<IOccupationGroup>} - A Promise that resolves to the parent occupation group.
   */
  setParent(params: {
    childId: string;
    parentId: string;
    parentType: ObjectTypes.ISCOGroup | ObjectTypes.LocalGroup;
    modelId: string;
  }): Promise<IOccupationGroup>;

  /**
   * Resolves the history of the models an OccupationGroup appeared in, based on its UUIDHistory.
   * For each UUID in the occupation group's UUIDHistory (newest first) that resolves to an existing occupation
   * group, returns the full model that occupation group belonged to, together with that model's own UUIDHistory
   * details. UUIDs that do not resolve to an existing occupation group are skipped, and each model appears once.
   *
   * @param {string} occupationGroupId - The ID of the OccupationGroup.
   * @return {Promise<IOccupationGroupHistoryEntry[] | null>} - The resolved history entries in UUIDHistory order,
   * or null if the OccupationGroup does not exist.
   */
  getHistory(occupationGroupId: string): Promise<IOccupationGroupHistoryEntry[] | null>;
}
