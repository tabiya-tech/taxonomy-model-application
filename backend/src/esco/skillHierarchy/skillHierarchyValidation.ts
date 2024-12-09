import { ObjectTypes } from "esco/common/objectTypes";
import { isRelationPairValid } from "esco/common/relationValidation";
import { toRelationshipPairSpec } from "esco/common/hierarchy";
import { INewSkillHierarchyPairSpec } from "./skillHierarchy.types";

/**
 * Check if the given skill hierarchy pair spec is valid in relation to the existing IDs and their types.
 * Checks that the pair refers to objects that exist in the database and that the types
 * of the objects are such that they can be related in the hierarchy.
 * For more information about the rules concerning occupation hierarchy relationships, see backend/taxonomy-hierarchy.md
 * @param spec - The skill hierarchy pair spec to validate.
 * @param existingIds - A map of existing IDs and their corresponding types.
 * @returns A boolean indicating if the spec is valid.
 * */
export function isNewSkillHierarchyPairSpecValid(
  spec: INewSkillHierarchyPairSpec,
  existingIds: Map<string, ObjectTypes[]>
): boolean {
  const relationshipSpec = toRelationshipPairSpec(spec);
  const validPairsForSkillHierarchy = [
    { firstPartnerType: ObjectTypes.SkillGroup, secondPartnerType: ObjectTypes.SkillGroup },
    { firstPartnerType: ObjectTypes.SkillGroup, secondPartnerType: ObjectTypes.Skill },
    { firstPartnerType: ObjectTypes.Skill, secondPartnerType: ObjectTypes.Skill },
  ];
  return isRelationPairValid(relationshipSpec, existingIds, validPairsForSkillHierarchy);
}
