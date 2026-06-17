import { ISkill } from "esco/skill/_shared/skill.types";
import { ISkillGroup } from "esco/skillGroup/_shared/skillGroup.types";
import { SkillHierarchyChildType, SkillHierarchyParentType } from "esco/skillHierarchy/skillHierarchy.types";

export enum ParentForSkillValidationErrorCode {
  SKILL_NOT_FOUND,
  PARENT_NOT_FOUND,
  PARENT_CHILD_CODE_INCONSISTENT,
  DB_FAILED_TO_CREATE_SKILL_PARENT,
}

export class SkillParentValidationError extends Error {
  constructor(public code: ParentForSkillValidationErrorCode) {
    super();
  }
}

export interface ISkillHierarchyService {
  /**
   * Sets the parent for a given child.
   *
   * @param {string} modelId - The ID of the model.
   * @param {string} childId - The ID of the child.
   * @param {SkillHierarchyChildType} childType - The ObjectType of the child.
   * @param {string} parentId - The ID of the parent.
   * @param {SkillHierarchyParentType} parentType - The ObjectType of the parent.
   * @returns {Promise<ISkill | ISkillGroup>} A promise that resolves to the child with its parents populated.
   */
  setParent(
    modelId: string,
    childId: string,
    childType: SkillHierarchyChildType,
    parentId: string,
    parentType: SkillHierarchyParentType
  ): Promise<ISkill | ISkillGroup>;
}
