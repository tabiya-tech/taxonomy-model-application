import { IPopulatedSkillToSkillRelationPairDoc } from "./skillToSkillRelation.types";
import { ReferenceWithRelationType } from "esco/common/objectTypes";
import { ISkillReference } from "esco/skill/skills.types";
import { getSkillReferenceWithRelationType } from "esco/skill/skillReference";

export function getSkillRequiresSkillsReference(
  doc: IPopulatedSkillToSkillRelationPairDoc
): ReferenceWithRelationType<ISkillReference> | null {
  if (!doc.requiredSkillId) return null;
  if (!doc.requiredSkillId.modelId?.equals(doc.modelId)) {
    console.error(`Required skill is not in the same model as the Requiring skill`);
    return null;
  }
  // @ts-ignore - we want to remove the modelId field because it is not part of the ISkillReference interface
  delete doc.requiredSkillId.modelId;
  return getSkillReferenceWithRelationType(doc.requiredSkillId, doc.relationType);
}

export function getSkillRequiredBySkillsReference(
  doc: IPopulatedSkillToSkillRelationPairDoc
): ReferenceWithRelationType<ISkillReference> | null {
  if (!doc.requiringSkillId) return null;
  if (!doc.requiringSkillId.modelId?.equals(doc.modelId)) {
    console.error(`Requiring skill is not in the same model as the Required skill`);
    return null;
  }
  // @ts-ignore - we want to remove the modelId field because it is not part of the ISkillReference interface
  delete doc.requiringSkillId.modelId;
  return getSkillReferenceWithRelationType(doc.requiringSkillId, doc.relationType);
}
