import { ISkillWithRelation } from "esco/occupations/_shared/occupation.types";
import { SignallingValueLabel } from "esco/common/objectTypes";
import { OccupationToSkillRelationType } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";

export enum SkillForOccupationValidationErrorCode {
  OCCUPATION_NOT_FOUND,
  SKILL_NOT_FOUND,
  INVALID_RELATION_TYPE,
  INVALID_SIGNALLING_VALUE_LABEL,
  MUTUALLY_EXCLUSIVE_VALUES,
  DB_FAILED_TO_CREATE_OCCUPATION_SKILL_RELATION,
}

export class OccupationSkillValidationError extends Error {
  constructor(public code: SkillForOccupationValidationErrorCode) {
    super();
  }
}

export interface IOccupationToSkillRelationService {
  /**
   * Adds a skill requirement to an occupation.
   *
   * @param {string} modelId - The modelId of the taxonomy model.
   * @param {string} requiringOccupationId - The ID of the occupation.
   * @param {string} requiredSkillId - The ID of the required skill.
   * @param {OccupationToSkillRelationType} relationType - The relationship type.
   * @param {SignallingValueLabel} signallingValueLabel - The signalling value label.
   * @param {number | null} signallingValue - The signalling value.
   * @return {Promise<ISkillWithRelation>} - A Promise that resolves to the added skill with relationship metadata.
   */
  addSkill(
    modelId: string,
    requiringOccupationId: string,
    requiredSkillId: string,
    relationType: OccupationToSkillRelationType,
    signallingValueLabel: SignallingValueLabel,
    signallingValue: number | null
  ): Promise<ISkillWithRelation>;
}
