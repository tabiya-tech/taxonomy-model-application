import { ObjectTypes, ReferenceWithRelationType, RelationType } from "esco/common/objectTypes";
import { ISkillDoc, ISkillReferenceDoc } from "./skills.types";
import mongoose from "mongoose";

export function getSkillReferenceWithModelId(
  doc: mongoose.Document<unknown, undefined, ISkillDoc> & ISkillDoc
): ISkillReferenceDoc {
  return {
    modelId: doc.modelId,
    id: doc.id,
    objectType: ObjectTypes.Skill,
    UUID: doc.UUID,
    preferredLabel: doc.preferredLabel,
  };
}

export function getSkillReferenceWithRelationType(
  doc: ISkillReferenceDoc,
  relationType: RelationType
): ReferenceWithRelationType<ISkillReferenceDoc> {
  return {
    ...doc,
    relationType: relationType,
  };
}
