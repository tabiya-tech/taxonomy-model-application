import { ISkill, ISkillReference, ModelForSkillValidationErrorCode } from "./skills.types";
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
   * @return {Promise<(ISkill | ISkillGroup)[]>} - A Promise that resolves to the parent Skills or SkillGroups.
   */
  getParents(modelId: string, skillId: string): Promise<(ISkill | ISkillGroup)[]>;

  /**
   * Finds the child Skills or SkillGroups of a Skill.
   *
   * @param {string} modelId - The modelId of the Skill.
   * @param {string} skillId - The ID of the Skill.
   * @return {Promise<(ISkill | ISkillGroup)[]>} - A Promise that resolves to the child Skills or SkillGroups.
   */
  getChildren(modelId: string, skillId: string): Promise<(ISkill | ISkillGroup)[]>;

  /**
   * Finds the occupations that require a Skill with relationship metadata.
   *
   * @param {string} modelId - The modelId of the Skill.
   * @param {string} skillId - The ID of the Skill.
   * @return {Promise<OccupationToSkillReferenceWithRelationType<IOccupationReference>[]>} - A Promise that resolves to the occupations that require the Skill.
   */
  getOccupations(
    modelId: string,
    skillId: string
  ): Promise<OccupationToSkillReferenceWithRelationType<IOccupationReference>[]>;

  /**
   * Finds the related skills of a Skill with relationship metadata.
   *
   * @param {string} modelId - The modelId of the Skill.
   * @param {string} skillId - The ID of the Skill.
   * @return {Promise<SkillToSkillReferenceWithRelationType<ISkillReference>[]>} - A Promise that resolves to the related skills.
   */
  getRelatedSkills(modelId: string, skillId: string): Promise<SkillToSkillReferenceWithRelationType<ISkillReference>[]>;
}
