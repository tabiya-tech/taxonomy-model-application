import {ObjectTypes, ReferenceWithModelId} from "esco/common/objectTypes";
import {IISCOGroupDoc, IISCOGroupReferenceDoc} from "./ISCOGroup.types";

export function getISCOGroupReferenceWithModelId(iscoGroup: IISCOGroupDoc): ReferenceWithModelId<IISCOGroupReferenceDoc> {
  return {
    modelId: iscoGroup.modelId,
    id: iscoGroup.id,
    objectType: ObjectTypes.ISCOGroup,
    UUID: iscoGroup.UUID,
    code: iscoGroup.code,
    preferredLabel: iscoGroup.preferredLabel
  };
}