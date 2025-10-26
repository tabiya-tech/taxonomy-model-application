import { ObjectTypes, SignallingValueLabel } from "esco/common/objectTypes";
import { ISkillDoc, ISkillReference, ISkillReferenceDoc } from "./skills.types";
import mongoose from "mongoose";
import {
  SkillToSkillReferenceWithRelationType,
  SkillToSkillRelationType,
} from "esco/skillToSkillRelation/skillToSkillRelation.types";
import {
  OccupationToSkillReferenceWithRelationType,
  OccupationToSkillRelationType,
} from "esco/occupationToSkillRelation/occupationToSkillRelation.types";

type _Document<T> = mongoose.Document<unknown, undefined, T> & T;
export type SkillDocument = _Document<ISkillDoc>;

export function getSkillDocReference(skill: SkillDocument): ISkillReferenceDoc {
  return {
    modelId: skill.modelId,
    id: skill.id,
    objectType: ObjectTypes.Skill,
    UUID: skill.UUID,
    preferredLabel: skill.preferredLabel,
    isLocalized: skill.isLocalized,
  };
}

export function getSkillReferenceWithRelationType(
  skill: ISkillReference,
  relationType: SkillToSkillRelationType | OccupationToSkillRelationType,
  signallingValue?: number | null,
  signallingValueLabel?: SignallingValueLabel
):
  | SkillToSkillReferenceWithRelationType<ISkillReference>
  | OccupationToSkillReferenceWithRelationType<ISkillReference> {
  return {
    ...skill,
    relationType: relationType,
    signallingValue: signallingValue ?? null,
    signallingValueLabel: signallingValueLabel ?? SignallingValueLabel.NONE,
  };
}
