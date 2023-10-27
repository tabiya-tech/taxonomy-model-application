import { ObjectTypes, ReferenceWithRelationType, RelationType } from "esco/common/objectTypes";
import { ISkillDoc, ISkillReferenceDoc } from "./skills.types";
import mongoose from "mongoose";

type _Document<T> = mongoose.Document<unknown, undefined, T> & T;
export type SkillDocument = _Document<ISkillDoc>;

export function getSkillDocReference(skill: SkillDocument): ISkillReferenceDoc {
  return {
    modelId: skill.modelId,
    id: skill.id,
    objectType: ObjectTypes.Skill,
    UUID: skill.UUID,
    preferredLabel: skill.preferredLabel,
  };
}

export function getSkillDocReferenceWithRelationType(
  skill: ISkillReferenceDoc,
  relationType: RelationType
): ReferenceWithRelationType<ISkillReferenceDoc> {
  return {
    ...skill,
    relationType: relationType,
  };
}
