import { ObjectTypes, ReferenceWithModelId } from "esco/common/objectTypes";
import { ISkillDoc, ISkillReferenceDoc } from "./skills.types";

export function getSkillReferenceWithModelId(doc: ISkillDoc): ReferenceWithModelId<ISkillReferenceDoc> {
  return {
    modelId: doc.modelId,
    id: doc.id,
    objectType: ObjectTypes.Skill,
    UUID: doc.UUID,
    preferredLabel: doc.preferredLabel,
  };
}

export function getSkillReference(doc: ISkillDoc): ISkillReferenceDoc {
  return {
    id: doc.id,
    objectType: ObjectTypes.Skill,
    UUID: doc.UUID,
    preferredLabel: doc.preferredLabel,
  };
}
