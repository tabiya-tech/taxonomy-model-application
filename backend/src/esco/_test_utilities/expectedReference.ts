import { IISCOGroup, IISCOGroupReference } from "esco/iscoGroup/ISCOGroup.types";
import { ObjectTypes, ReferenceWithRelationType, RelationType } from "esco/common/objectTypes";
import { IOccupation, IOccupationReference } from "esco/occupation/occupation.types";
import { ISkill, ISkillReference } from "esco/skill/skills.types";
import { ISkillGroup, ISkillGroupReference } from "esco/skillGroup/skillGroup.types";

/**
 *  Create an expected ISCOGroup reference from a given ISCOGroup
 * @param givenISCOGroup
 */
export function expectedISCOGroupReference(givenISCOGroup: IISCOGroup): IISCOGroupReference {
  return {
    id: givenISCOGroup.id,
    UUID: givenISCOGroup.UUID,
    objectType: ObjectTypes.ISCOGroup,
    code: givenISCOGroup.code,
    preferredLabel: givenISCOGroup.preferredLabel,
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
    objectType: ObjectTypes.Occupation,
    code: givenOccupation.code,
    ISCOGroupCode: givenOccupation.ISCOGroupCode,
    preferredLabel: givenOccupation.preferredLabel,
    occupationType: givenOccupation.occupationType,
  };
}

/**
 * Create an expected Related Occupation Reference from a given IOccupation and relationType
 * @param givenOccupation
 * @param relationType
 */
export function expectedRelatedOccupationReference(
  givenOccupation: IOccupation,
  relationType: RelationType
): ReferenceWithRelationType<IOccupationReference> {
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
  };
}

/**
 *  Create an expected Related ISkill reference from a given ISkill and relationType
 * @param givenSkill
 * @param relationType
 */
export function expectedRelatedSkillReference(
  givenSkill: ISkill,
  relationType: RelationType
): ReferenceWithRelationType<ISkillReference> {
  return {
    ...expectedSkillReference(givenSkill),
    relationType,
  };
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
