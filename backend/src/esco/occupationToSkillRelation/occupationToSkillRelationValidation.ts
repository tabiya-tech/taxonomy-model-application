import { ObjectTypes } from "esco/common/objectTypes";
import { IRelationshipSpec, isRelationPairValid } from "esco/common/relationValidation";
import { INewOccupationToSkillPairSpec } from "./occupationToSkillRelation.types";
function toRelationPairSpecFromOccupationToSkillPairSpec(spec: INewOccupationToSkillPairSpec): IRelationshipSpec {
  return {
    firstPartnerId: spec.requiringOccupationId,
    firstPartnerType: spec.requiringOccupationType,
    secondPartnerId: spec.requiredSkillId,
    secondPartnerType: ObjectTypes.Skill,
  };
}

export function isNewOccupationToSkillRelationPairSpecValid(
  spec: INewOccupationToSkillPairSpec,
  existingIds: Map<string, ObjectTypes[]>
): boolean {
  const commonRelationSpec = toRelationPairSpecFromOccupationToSkillPairSpec(spec);
  const validPairsForOccupationToSkill = [
    { firstPartnerType: ObjectTypes.ESCOOccupation, secondPartnerType: ObjectTypes.Skill },
    { firstPartnerType: ObjectTypes.LocalOccupation, secondPartnerType: ObjectTypes.Skill },
  ];
  return isRelationPairValid(commonRelationSpec, existingIds, validPairsForOccupationToSkill);
}
