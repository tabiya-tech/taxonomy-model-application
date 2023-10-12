import { ObjectTypes, ReferenceWithModelId, ReferenceWithRelationType, RelationType } from "esco/common/objectTypes";
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

export function getSkillReferenceWithRelationType(
  doc: ISkillDoc,
  relationType: RelationType
): ReferenceWithRelationType<ISkillReferenceDoc> {
  return {
    modelId: doc.modelId,
    id: doc.id,
    objectType: ObjectTypes.Skill,
    UUID: doc.UUID,
    preferredLabel: doc.preferredLabel,
    relationType: relationType,
  };
}
