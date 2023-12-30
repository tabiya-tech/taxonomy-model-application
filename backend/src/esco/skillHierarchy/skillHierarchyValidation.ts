import { ObjectTypes } from "esco/common/objectTypes";
import { isRelationPairValid } from "esco/common/relationValidation";
import { toRelationshipPairSpec } from "esco/common/hierarchy";
import { INewSkillHierarchyPairSpec } from "./skillHierarchy.types";

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
