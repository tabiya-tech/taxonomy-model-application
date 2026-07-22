import {
  INewOccupationGroupSpecWithoutImportId,
  IOccupationGroup,
  ModelForOccupationGroupValidationErrorCode,
  IOccupationGroupChild,
  IOccupationGroupReference,
} from "esco/occupationGroup/_shared/OccupationGroup.types";
import { ObjectTypes } from "esco/common/objectTypes";
import { IModelInfoReference } from "modelInfo/modelInfo.types";
import { EmbeddableField } from "embeddings/service/types";

export class OccupationGroupModelValidationError extends Error {
  constructor(public code: ModelForOccupationGroupValidationErrorCode) {
    super();
  }
}

export interface FindPaginatedFilter {
  root?: boolean;
}

/**
 * A single entry of an occupation group's model history: the occupation group's reference (as it appeared
 * in that model) together with a lightweight reference to the model it belonged to.
 */
export interface IOccupationGroupHistoryEntry {
  entity: IOccupationGroupReference;
  model: IModelInfoReference;
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
   * Searches the OccupationGroups of a model by a free-text value on the given searchFields.
   *
   * Uses vector (embeddings) similarity ranked by relevance when the model is released and its embeddings have
   * been generated, and a case-insensitive regex match otherwise. The returned nextCursor is already encoded (its
   * shape depends on the strategy) and should be passed back verbatim as the `cursor` argument to fetch the next
   * page.
   *
   * @param {string} modelId - The modelId of the OccupationGroups.
   * @param {string} searchValue - The free-text value to search for.
   * @param {EmbeddableField[]} searchFields - The fields to search the value on.
   * @param {string | undefined} cursor - The opaque pagination cursor from a previous page, if any.
   * @param {number} limit - The maximum number of OccupationGroups to return.
   * @return {Promise<{ items: IOccupationGroup[]; nextCursor: string | null }>} - The page of OccupationGroups
   * (ordered by relevance for vector search) and the encoded cursor of the next page, if any.
   */
  searchPaginated(
    modelId: string,
    searchValue: string,
    searchFields: EmbeddableField[],
    cursor: string | undefined,
    limit: number
  ): Promise<{ items: IOccupationGroup[]; nextCursor: string | null }>;

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
