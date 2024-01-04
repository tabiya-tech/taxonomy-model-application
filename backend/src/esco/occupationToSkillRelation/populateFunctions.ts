import { ReferenceWithRelationType } from "esco/common/objectTypes";
import { IPopulatedOccupationToSkillRelationPairDoc } from "./occupationToSkillRelation.types";
import { getOccupationReferenceWithRelationType } from "esco/occupation/occupationReference";
import { IOccupationDoc, IOccupationReference } from "esco/occupation/occupation.types";
import { ISkillDoc, ISkillReference } from "esco/skill/skills.types";
import { getSkillReferenceWithRelationType } from "esco/skill/skillReference";
import mongoose from "mongoose";

export function getSkillRequiredByOccupationReference(
  doc: IPopulatedOccupationToSkillRelationPairDoc
): ReferenceWithRelationType<IOccupationReference> | null {
  if (!doc.requiringOccupationId) return null;
  if (!doc.requiringOccupationId.modelId?.equals(doc.modelId)) {
    console.error(`RequiredBy occupation is not in the same model as the Required skill`);
    return null;
  }
  // @ts-ignore - we want to remove the modelId field because it is not part of the ISkillReference interface
  delete doc.requiringOccupationId.modelId;
  return getOccupationReferenceWithRelationType(doc.requiringOccupationId, doc.relationType);
}

export function getOccupationRequiresSkillReference(
  doc: IPopulatedOccupationToSkillRelationPairDoc
): ReferenceWithRelationType<ISkillReference> | null {
  if (!doc.requiredSkillId) return null;
  if (!doc.requiredSkillId.modelId?.equals(doc.modelId)) {
    console.error(`Required Skill is not in the same model as the Requiring Occupation`);
    return null;
  }
  // @ts-ignore - we want to remove the modelId field because it is not part of the ISkillReference interface
  delete doc.requiredSkillId.modelId;
  return getSkillReferenceWithRelationType(doc.requiredSkillId, doc.relationType);
}

export function populateEmptyRequiresSkills(
  target: mongoose.Document<unknown, unknown, IOccupationDoc>
) {
  // @ts-ignore
  target.requiresSkills = [];
}

export function populateEmptyRequiredByOccupations(target: mongoose.Document<unknown, unknown, ISkillDoc>) {
  // @ts-ignore
  target.requiredByOccupations = [];
}
