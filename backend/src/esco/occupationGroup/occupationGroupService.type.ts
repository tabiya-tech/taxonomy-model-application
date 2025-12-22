import {
  INewOccupationGroupSpecWithoutImportId,
  IOccupationGroup,
  ModelForOccupationGroupValidationErrorCode,
  IOccupationGroupChild,
} from "./OccupationGroup.types";

export class OccupationGroupModelValidationError extends Error {
  constructor(public code: ModelForOccupationGroupValidationErrorCode) {
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
   * @return {Promise<{items: IOccupationGroup[], nextCursor: {_id: string, createdAt: Date} | null}>} - An array of IOccupationGroups and the next cursor (if any)
   * Rejects with an error if the operation fails.
   */
  findPaginated(
    modelId: string,
    cursor: { id: string; createdAt: Date } | undefined,
    limit: number,
    desc?: boolean
  ): Promise<{ items: IOccupationGroup[]; nextCursor: { _id: string; createdAt: Date } | null }>;

  /**
   * Validates that a model exists and is not released for occupation group creation
   * @param {string} modelId - The model ID to validate
   * @return {Promise<ModelForOccupationGroupValidationErrorCode | null>} - Returns null if valid, otherwise the error code
   */
  validateModelForOccupationGroup(modelId: string): Promise<ModelForOccupationGroupValidationErrorCode | null>;
}
