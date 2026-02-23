import { ISkill, ModelForSkillValidationErrorCode } from "./skills.types";
import { ISkillGroup } from "esco/skillGroup/skillGroup.types";
import { IOccupationReference } from "esco/occupations/occupationReference.types";
import { SkillToSkillReferenceWithRelationType } from "esco/skillToSkillRelation/skillToSkillRelation.types";
import { OccupationToSkillReferenceWithRelationType } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";

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
  /**
   * Finds the parent Skills or SkillGroups of a Skill.
   *
   * @param {string} modelId - The modelId of the Skill.
   * @param {string} skillId - The ID of the Skill.
   * @param {number} limit - The maximum number of items to return.
   * @param {string} [cursor] - The cursor for pagination.
   * @return {Promise<{ items: (ISkill | ISkillGroup)[]; nextCursor: { _id: string; createdAt: Date } | null }>} - A Promise that resolves to the parent Skills or SkillGroups.
   */
  getParents(
    modelId: string,
    skillId: string,
    limit: number,
    cursor?: string
  ): Promise<{ items: (ISkill | ISkillGroup)[]; nextCursor: { _id: string; createdAt: Date } | null }>;

  /**
   * Finds the child Skills or SkillGroups of a Skill.
   *
   * @param {string} modelId - The modelId of the Skill.
   * @param {string} skillId - The ID of the Skill.
   * @param {number} limit - The maximum number of items to return.
   * @param {string} [cursor] - The cursor for pagination.
   * @return {Promise<{ items: (ISkill | ISkillGroup)[]; nextCursor: { _id: string; createdAt: Date } | null }>} - A Promise that resolves to paginated child Skills or SkillGroups.
   */
  getChildren(
    modelId: string,
    skillId: string,
    limit: number,
    cursor?: string
  ): Promise<{ items: (ISkill | ISkillGroup)[]; nextCursor: { _id: string; createdAt: Date } | null }>;

  /**
   * Finds the occupations that require a Skill with relationship metadata.
   *
   * @param {string} modelId - The modelId of the Skill.
   * @param {string} skillId - The ID of the Skill.
   * @param {number} limit - The maximum number of items to return.
   * @param {string} [cursor] - The cursor for pagination.
   * @return {Promise<{ items: OccupationToSkillReferenceWithRelationType<IOccupationReference>[]; nextCursor: { _id: string; createdAt: Date } | null }>} - A Promise that resolves to paginated occupations.
   */
  getOccupations(
    modelId: string,
    skillId: string,
    limit: number,
    cursor?: string
  ): Promise<{
    items: OccupationToSkillReferenceWithRelationType<IOccupationReference>[];
    nextCursor: { _id: string; createdAt: Date } | null;
  }>;

  /**
   * Finds the related skills of a Skill with relationship metadata.
   *
   * @param {string} modelId - The modelId of the Skill.
   * @param {string} skillId - The ID of the Skill.
   * @param {number} limit - The maximum number of items to return.
   * @param {string} [cursor] - The cursor for pagination.
   * @return {Promise<{ items: SkillToSkillReferenceWithRelationType<ISkill>[]; nextCursor: { _id: string; createdAt: Date } | null }>} - A Promise that resolves to paginated related skills.
   */
  getRelatedSkills(
    modelId: string,
    skillId: string,
    limit: number,
    cursor?: string
  ): Promise<{
    items: SkillToSkillReferenceWithRelationType<ISkill>[];
    nextCursor: { _id: string; createdAt: Date } | null;
  }>;
}
