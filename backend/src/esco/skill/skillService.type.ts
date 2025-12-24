import { ISkill, ModelForSkillValidationErrorCode } from "./skills.types";

export interface ISkillService {
  /**
   * Finds a Skill by its ID.
   *
   * @param {string} id - The unique ID of the Skill.
   * @return {Promise<ISkill | null>} - A Promise that resolves to the found Skill or null if not found.
   */
  findById(id: string): Promise<ISkill | null>;

  /**
   * Finds Skills with pagination.
   *
   * @param {string} modelId - The modelId of the Skills.
   * @param {{ id: string; createdAt: Date } | undefined} cursor - The cursor for pagination.
   * @param {number} limit - The maximum number of Skills to return.
   * @param {boolean} desc - Whether to sort in descending order (default: true).
   * @return {Promise<{ items: ISkill[]; nextCursor: { _id: string; createdAt: Date } | null }>} - A Promise that resolves to paginated Skills.
   */
  findPaginated(
    modelId: string,
    cursor: { id: string; createdAt: Date } | undefined,
    limit: number,
    desc?: boolean
  ): Promise<{ items: ISkill[]; nextCursor: { _id: string; createdAt: Date } | null }>;
  /**
   * Validates that a model exists and is not released for skill creation
   * @param {string} modelId - The model ID to validate
   * @return {Promise<ModelForSkillValidationErrorCode | null>} - Returns null if valid, otherwise the error code
   */
  validateModelForSkill(modelId: string): Promise<ModelForSkillValidationErrorCode | null>;
}
