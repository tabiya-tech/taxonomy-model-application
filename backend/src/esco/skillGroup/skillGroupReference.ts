import { ObjectTypes } from "esco/common/objectTypes";
import { ISkillGroupDoc, ISkillGroupReferenceDoc } from "./skillGroup.types";
import mongoose from "mongoose";

export function getSkillGroupDocReferenceWithModelId(
  skillGroup: mongoose.Document<unknown, undefined, ISkillGroupDoc> & ISkillGroupDoc
): ISkillGroupReferenceDoc {
  return {
    modelId: skillGroup.modelId,
    id: skillGroup.id,
    objectType: ObjectTypes.SkillGroup,
    UUID: skillGroup.UUID,
    code: skillGroup.code,
    preferredLabel: skillGroup.preferredLabel,
  };
}
