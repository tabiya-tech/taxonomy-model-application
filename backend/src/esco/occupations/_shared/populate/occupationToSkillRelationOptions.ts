import { getRequiresSkillReference } from "esco/occupationToSkillRelation/populateFunctions";

import { OccupationModelPaths } from "../../model/occupation.model";
import { populateOccupationToSkillRelationRequiredSkill } from "esco/occupations/_shared/populate/occupationToSkillRequiredSkillOptions";

export const populateOccupationRequiresSkillsOptions = {
  path: OccupationModelPaths.requiresSkills,
  populate: populateOccupationToSkillRelationRequiredSkill,
  transform: getRequiresSkillReference,
};
