import { ObjectTypes, ReferenceWithModelId } from "esco/common/objectTypes";
import { ISkillGroupDoc, ISkillGroupReferenceDoc } from "./skillGroup.types";

export function getSkillGroupReferenceWithModelId(
  skillGroup: ISkillGroupDoc
): ReferenceWithModelId<ISkillGroupReferenceDoc> {
  return {
    modelId: skillGroup.modelId,
    id: skillGroup.id,
    objectType: ObjectTypes.SkillGroup,
    UUID: skillGroup.UUID,
    code: skillGroup.code,
    preferredLabel: skillGroup.preferredLabel,
  };
}
