import { ISkill } from "esco/skill/_shared/skill.types";
import { SkillToSkillReferenceWithRelationType } from "./skillToSkillRelation.types";

export enum SkillToSkillRelationValidationErrorCode {
  SKILL_NOT_FOUND = "SKILL_NOT_FOUND",
  RELATED_SKILL_NOT_FOUND = "RELATED_SKILL_NOT_FOUND",
  RELATION_TYPE_NOT_SUPPORTED = "RELATION_TYPE_NOT_SUPPORTED",
  RELATION_CODE_INCONSISTENT = "RELATION_CODE_INCONSISTENT",
  DB_FAILED_TO_CREATE_RELATION = "DB_FAILED_TO_CREATE_RELATION",
}

export class SkillToSkillRelationValidationError extends Error {
  public readonly code: SkillToSkillRelationValidationErrorCode;

  constructor(code: SkillToSkillRelationValidationErrorCode, message?: string) {
    super(message ?? code);
    this.name = "SkillToSkillRelationValidationError";
    this.code = code;
  }
}

export interface ISkillToSkillRelationService {
  /**
   * Adds a related skill to a skill.
   *
   * @param modelId - The ID of the model.
   * @param requiringSkillId - The ID of the skill that requires the other skill.
   * @param requiredSkillId - The ID of the required skill.
   * @param relationType - The type of relation (e.g., essential, optional).
   * @returns A promise that resolves to the populated related skill.
   * @throws {SkillToSkillRelationValidationError} If validation fails or DB operation fails.
   */
  addRelatedSkill(
    modelId: string,
    requiringSkillId: string,
    requiredSkillId: string,
    relationType: string
  ): Promise<SkillToSkillReferenceWithRelationType<ISkill>>;
}
