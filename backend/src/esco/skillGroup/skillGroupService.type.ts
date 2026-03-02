import { ISkillGroup, ISkillGroupChild, ModelForSkillGroupValidationErrorCode } from "./skillGroup.types";

export interface ISkillGroupService {
  /**
   * Finds an SkillGroup entry by its ID.
   *
   * @param {string} id - The unique ID of the SkillGroup entry.
   * @return {Promise<ISkillGroup|null>} - A Promise that resolves to the found SkillGroup entry or null if not found.
   * Rejects with an error if the operation fails.
   */
  findById(id: string): Promise<ISkillGroup | null>;

  /**
   * Returns paginated SkillGroups. The SkillGroups are transformed to objects (via .lean()), however
   * in the current version they are not populated with parents or children. This will be implemented in a future version.
   * @param {string} modelId - The modelId of the SkillGroups.
   * @param {object} cursor - The cursor for pagination.
   * @param {number} limit - The maximum number of SkillGroups to return.
   * @param {boolean} [desc] - Whether to sort the results in descending order. Default is true.
   * @return {Promise<{items: ISkillGroup[], nextCursor: {_id: string, createdAt: Date} | null}>} - An array of ISkillGroups and the next cursor (if any)
   * Rejects with an error if the operation fails.
   */
  findPaginated(
    modelId: string,
    cursor: { id: string; createdAt: Date } | undefined,
    limit: number,
    desc?: boolean
  ): Promise<{ items: ISkillGroup[]; nextCursor: { _id: string; createdAt: Date } | null }>;

  /**
   * Validates that a model exists and is not released for skill group creation
   * @param {string} modelId - The model ID to validate
   * @return {Promise<ModelForSkillGroupValidationErrorCode | null>} - Returns null if valid, otherwise the error code
   */
  validateModelForSkillGroup(modelId: string): Promise<ModelForSkillGroupValidationErrorCode | null>;

  /**
   * Finds an SkillGroup parents entry by its ID with pagination.
   *
   * @param {string} modelId - The model ID to filter hierarchy relations.
   * @param {string} id - The unique ID of the SkillGroup entry.
   * @param {number} limit - The maximum number of parents to return.
   * @param {string} [cursor] - Optional cursor (parentId) for pagination.
   * @return {Promise<{items: ISkillGroup[], nextCursor: {_id: string, createdAt: Date} | null}>} - Paginated parents.
   */
  findParents(
    modelId: string,
    id: string,
    limit: number,
    cursor?: string
  ): Promise<{ items: ISkillGroup[]; nextCursor: { _id: string; createdAt: Date } | null }>;

  /**
   * Finds an SkillGroup children entry by its ID with pagination.
   *
   * @param {string} modelId - The model ID to filter hierarchy relations.
   * @param {string} id - The unique ID of the SkillGroup entry.
   * @param {number} limit - The maximum number of children to return.
   * @param {string} [cursor] - Optional cursor (childId) for pagination.
   * @return {Promise<{items: ISkillGroupChild[], nextCursor: {_id: string, createdAt: Date} | null}>} - Paginated children.
   */
  findChildren(
    modelId: string,
    id: string,
    limit: number,
    cursor?: string
  ): Promise<{ items: ISkillGroupChild[]; nextCursor: { _id: string; createdAt: Date } | null }>;
}
