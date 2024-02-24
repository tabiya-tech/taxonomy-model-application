import { getRequiresSkillReference } from "esco/occupationToSkillRelation/populateFunctions";

import { OccupationModelPaths } from "./occupationModel";
import { populateOccupationToSkillRelationRequiredSkill } from "esco/occupations/populateOccupationToSkillRequiredSkillOptions";

export const populateOccupationRequiresSkillsOptions = {
  path: OccupationModelPaths.requiresSkills,
  populate: populateOccupationToSkillRelationRequiredSkill,
  transform: getRequiresSkillReference,
};
