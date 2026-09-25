import { getRequiresSkillReference } from "esco/occupationToSkillRelation/populateFunctions";

import { OccupationModelPaths } from "../../model/occupation.model";
import {
  makePopulateOccupationToSkillRelationRequiredSkill,
  populateOccupationToSkillRelationRequiredSkill,
} from "esco/occupations/_shared/populate/occupationToSkillRequiredSkillOptions";

export function makePopulateOccupationRequiresSkillsOptions(language: string) {
  return {
    path: OccupationModelPaths.requiresSkills,
    populate: makePopulateOccupationToSkillRelationRequiredSkill(language),
    transform: getRequiresSkillReference,
  };
}

// Backward-compatible factory for write paths.
export function populateOccupationRequiresSkillsOptions() {
  return {
    path: OccupationModelPaths.requiresSkills,
    populate: populateOccupationToSkillRelationRequiredSkill(),
    transform: getRequiresSkillReference,
  };
}
