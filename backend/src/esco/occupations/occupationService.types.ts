import { INewOccupationSpec, IOccupation } from "./occupation.types";

export enum ModalForOccupationValidationErrorCode {
  FAILED_TO_FETCH_FROM_DB,
  MODEL_NOT_FOUND_BY_ID,
  MODEL_IS_RELEASED,
}

export class OccupationModelValidationError extends Error {
  constructor(public code: ModalForOccupationValidationErrorCode) {
    super();
  }
}

export interface IOccupationService {
  /**
   * Creates a new Occupation entry.
   *
   * @param {INewOccupationSpec} newOccupationSpec - The specification for the new Occupation entry.
   * @return {Promise<IOccupation>} - A Promise that resolves to the newly created Occupation entry.
   * Rejects with an error if the Occupation entry cannot be created due to reasons other than validation.
   */
  create(newOccupationSpec: INewOccupationSpec): Promise<IOccupation>;

  /**
   * Finds an Occupation entry by its ID.
   *
   * @param {string} id - The unique ID of the Occupation entry.
   * @return {Promise<IOccupation|null>} - A Promise that resolves to the found Occupation entry or null if not found.
   * Rejects with an error if the operation fails.
   */
  findById(id: string): Promise<IOccupation | null>;

  /**
   * Returns paginated Occupations. The Occupations are transformed to objects (via .lean()), however
   * in the current version they are not populated with parents or children. This will be implemented in a future version.
   * @param {string} modelId - The modelId of the Occupations.
   * @param {object} cursor - The cursor for pagination.
   * @param {number} limit - The maximum number of Occupations to return.
   * @param {boolean} [desc] - Whether to sort the results in descending order. Default is true.
   * @return {Promise<{items: IOccupation[], nextCursor: {_id: string, createdAt: Date} | null}>} - An array of IOccupations and the next cursor (if any)
   * Rejects with an error if the operation fails.
   */
  findPaginated(
    modelId: string,
    cursor: { id: string; createdAt: Date } | undefined,
    limit: number,
    desc?: boolean
  ): Promise<{ items: IOccupation[]; nextCursor: { _id: string; createdAt: Date } | null }>;

  /**
   * Validates that a model exists and is not released for occupation creation
   * @param {string} modelId - The model ID to validate
   * @return {Promise<ModalForOccupationValidationErrorCode | null>} - Returns null if valid, otherwise the error code
   */
  validateModelForOccupation(modelId: string): Promise<ModalForOccupationValidationErrorCode | null>;
}
