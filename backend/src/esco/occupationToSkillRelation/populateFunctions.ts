import {
  IPopulatedOccupationToSkillRelationPairDoc,
  OccupationToSkillReferenceWithRelationType,
} from "./occupationToSkillRelation.types";
import { getOccupationReferenceWithRelationType } from "esco/occupations/occupationReference";
import { IOccupationReference } from "esco/occupations/occupationReference.types";
import { ISkillDoc, ISkillReference } from "esco/skill/skills.types";
import { getSkillReferenceWithRelationType } from "esco/skill/skillReference";
import mongoose from "mongoose";
import { IOccupationDoc } from "esco/occupations/occupation.types";

export function getRequiredByOccupationReference(
  doc: IPopulatedOccupationToSkillRelationPairDoc
): OccupationToSkillReferenceWithRelationType<IOccupationReference> | null {
  if (!doc.requiringOccupationId) return null;
  if (!doc.requiringOccupationId.modelId?.equals(doc.modelId)) {
    console.error(new Error(`RequiredBy occupation is not in the same model as the Required skill`));
    return null;
  }
  // @ts-ignore - we want to remove the modelId field because it is not part of the ISkillReference interface
  delete doc.requiringOccupationId.modelId;
  return getOccupationReferenceWithRelationType(doc.requiringOccupationId, doc.relationType);
}

export function getRequiresSkillReference(
  doc: IPopulatedOccupationToSkillRelationPairDoc
): OccupationToSkillReferenceWithRelationType<ISkillReference> | null {
  if (!doc.requiredSkillId) return null;
  if (!doc.requiredSkillId.modelId?.equals(doc.modelId)) {
    console.error(new Error(`Required Skill is not in the same model as the Requiring Occupation`));
    return null;
  }
  // @ts-ignore - we want to remove the modelId field because it is not part of the ISkillReference interface
  delete doc.requiredSkillId.modelId;
  return getSkillReferenceWithRelationType(
    doc.requiredSkillId,
    doc.relationType,
    doc.signallingValue,
    doc.signallingValueLabel
  ) as OccupationToSkillReferenceWithRelationType<ISkillReference>;
}

export function populateEmptyRequiresSkills(target: mongoose.Document<unknown, unknown, IOccupationDoc>) {
  // @ts-ignore
  target.requiresSkills = [];
}

export function populateEmptyRequiredByOccupations(target: mongoose.Document<unknown, unknown, ISkillDoc>) {
  // @ts-ignore
  target.requiredByOccupations = [];
}
