import { IPopulatedSkillToSkillRelationPairDoc } from "./skillToSkillRelation.types";
import { ReferenceWithRelationType } from "esco/common/objectTypes";
import { ISkillReference } from "esco/skill/skills.types";
import { getSkillDocReferenceWithRelationType } from "esco/skill/skillReference";

export function getSkillRequiresSkillsReference(
  doc: IPopulatedSkillToSkillRelationPairDoc
): ReferenceWithRelationType<ISkillReference> | null {
  if (!doc.requiredSkillId) return null;
  if (!doc.requiredSkillId.modelId?.equals(doc.modelId)) {
    console.error(`Required skill is not in the same model as the Requiring skill`);
    return null;
  }
  const referenceWithRelationType = getSkillDocReferenceWithRelationType(doc.requiredSkillId, doc.relationType);

  // @ts-ignore - we want to remove the modelId field because it is not part of the ReferenceWithRelationType<ISkillReference> interface
  delete doc.requiredSkillId.modelId;
  // @ts-ignore - we want to remove the modelId field because it is not part of the ReferenceWithRelationType<ISkillReference> interface
  delete referenceWithRelationType.modelId;
  return referenceWithRelationType;
}

export function getSkillRequiredBySkillsReference(
  doc: IPopulatedSkillToSkillRelationPairDoc
): ReferenceWithRelationType<ISkillReference> | null {
  if (!doc.requiringSkillId) return null;
  if (!doc.requiringSkillId.modelId?.equals(doc.modelId)) {
    console.error(`Requiring skill is not in the same model as the Required skill`);
    return null;
  }
  const referenceWithRelationType = getSkillDocReferenceWithRelationType(doc.requiringSkillId, doc.relationType);

  // @ts-ignore - we want to remove the modelId field because it is not part of the ReferenceWithRelationType<ISkillReference> interface
  delete doc.requiringSkillId.modelId;
  // @ts-ignore - we want to remove the modelId field because it is not part of the ReferenceWithRelationType<ISkillReference> interface
  delete referenceWithRelationType.modelId;
  return referenceWithRelationType;
}
