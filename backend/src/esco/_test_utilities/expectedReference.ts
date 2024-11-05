import { IOccupationGroup, IOccupationGroupReference } from "esco/occupationGroup/OccupationGroup.types";
import { ObjectTypes } from "esco/common/objectTypes";
import { IOccupation } from "esco/occupations/occupation.types";
import { IOccupationReference } from "esco/occupations/occupationReference.types";
import { ISkill, ISkillReference } from "esco/skill/skills.types";
import { ISkillGroup, ISkillGroupReference } from "esco/skillGroup/skillGroup.types";
import {
  OccupationToSkillRelationType,
  OccupationToSkillReferenceWithRelationType,
} from "esco/occupationToSkillRelation/occupationToSkillRelation.types";
import {
  SkillToSkillReferenceWithRelationType,
  SkillToSkillRelationType,
} from "esco/skillToSkillRelation/skillToSkillRelation.types";

/**
 *  Create an expected OccupationGroup reference from a given OccupationGroup
 * @param givenOccupationGroup
 */
export function expectedOccupationGroupReference(givenOccupationGroup: IOccupationGroup): IOccupationGroupReference {
  return {
    id: givenOccupationGroup.id,
    UUID: givenOccupationGroup.UUID,
    objectType: ObjectTypes.OccupationGroup,
    code: givenOccupationGroup.code,
    preferredLabel: givenOccupationGroup.preferredLabel,
  };
}

/**
 *  Create an expected IOccupation reference from a given IOccupation
 * @param givenOccupation
 */
export function expectedOccupationReference(givenOccupation: IOccupation): IOccupationReference {
  return {
    id: givenOccupation.id,
    UUID: givenOccupation.UUID,
    code: givenOccupation.code,
    occupationGroupCode: givenOccupation.occupationGroupCode,
    preferredLabel: givenOccupation.preferredLabel,
    occupationType: givenOccupation.occupationType,
    isLocalized: givenOccupation.isLocalized,
  };
}

/**
 * Create an expected Related Occupation Reference from a given IOccupation and relationType
 * @param givenOccupation
 * @param relationType
 */
export function expectedRelatedOccupationReference(
  givenOccupation: IOccupation,
  relationType: OccupationToSkillRelationType
): OccupationToSkillReferenceWithRelationType<IOccupationReference> {
  return {
    ...expectedOccupationReference(givenOccupation),
    relationType,
  };
}

/**
 *  Create an expected ISkill reference from a given ISkill
 * @param givenSkill
 */
export function expectedSkillReference(givenSkill: ISkill): ISkillReference {
  return {
    id: givenSkill.id,
    UUID: givenSkill.UUID,
    objectType: ObjectTypes.Skill,
    preferredLabel: givenSkill.preferredLabel,
    isLocalized: givenSkill.isLocalized,
  };
}

/**
 *  Create an expected Related ISkill reference from a given ISkill and relationType
 * @param givenSkill
 * @param relationType
 */
export function expectedRelatedSkillReference(
  givenSkill: ISkill,
  relationType: SkillToSkillRelationType | OccupationToSkillRelationType
):
  | SkillToSkillReferenceWithRelationType<ISkillReference>
  | OccupationToSkillReferenceWithRelationType<ISkillReference> {
  return {
    ...expectedSkillReference(givenSkill),
    relationType,
  } as
    | SkillToSkillReferenceWithRelationType<ISkillReference>
    | OccupationToSkillReferenceWithRelationType<ISkillReference>;
}

/**
 *  Create an expected SkillGroup reference from a given SkillGroup
 * @param givenSkillGroup
 */
export function expectedSkillGroupReference(givenSkillGroup: ISkillGroup): ISkillGroupReference {
  return {
    objectType: ObjectTypes.SkillGroup,
    id: givenSkillGroup.id,
    UUID: givenSkillGroup.UUID,
    code: givenSkillGroup.code,
    preferredLabel: givenSkillGroup.preferredLabel,
  };
}
