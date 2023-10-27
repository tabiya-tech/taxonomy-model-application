import { ObjectTypes } from "esco/common/objectTypes";
import { ISkillGroupDoc, ISkillGroupReferenceDoc } from "./skillGroup.types";
import mongoose from "mongoose";

type _Document<T> = mongoose.Document<unknown, undefined, T> & T;
export type SkillGroupDocument = _Document<ISkillGroupDoc>;

export function getSkillGroupDocReference(skillGroup: SkillGroupDocument): ISkillGroupReferenceDoc {
  return {
    modelId: skillGroup.modelId,
    id: skillGroup.id,
    objectType: ObjectTypes.SkillGroup,
    UUID: skillGroup.UUID,
    code: skillGroup.code,
    preferredLabel: skillGroup.preferredLabel,
  };
}
