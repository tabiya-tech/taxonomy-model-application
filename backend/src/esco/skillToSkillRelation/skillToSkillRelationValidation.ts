import { ObjectTypes } from "esco/common/objectTypes";
import { IRelationshipSpec, isRelationPairValid } from "esco/common/relationValidation";
import { INewSkillToSkillPairSpec } from "./skillToSkillRelation.types";

function toRelationshipPairSpecFromSkillToSkillPairSpec(spec: INewSkillToSkillPairSpec): IRelationshipSpec {
  return {
    firstPartnerId: spec.requiringSkillId,
    firstPartnerType: ObjectTypes.Skill,
    secondPartnerId: spec.requiredSkillId,
    secondPartnerType: ObjectTypes.Skill,
  };
}

export function isNewSkillToSkillRelationPairSpecValid(
  spec: INewSkillToSkillPairSpec,
  existingIds: Map<string, ObjectTypes>
): boolean {
  const commonRelationshipSpec = toRelationshipPairSpecFromSkillToSkillPairSpec(spec);
  const validPairsForSkillToSkill = [{ firstPartnerType: ObjectTypes.Skill, secondPartnerType: ObjectTypes.Skill }];
  return isRelationPairValid(commonRelationshipSpec, existingIds, validPairsForSkillToSkill);
}
