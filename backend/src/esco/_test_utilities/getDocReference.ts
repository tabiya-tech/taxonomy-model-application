import { ReferenceWithModelId } from "../common/objectTypes";
import { ISkillReferenceDoc } from "../skill/skills.types";
import { IOccupationReferenceDoc } from "../occupation/occupation.types";
import { IISCOGroupReferenceDoc } from "../iscoGroup/ISCOGroup.types";
import { ISkillGroupReferenceDoc } from "../skillGroup/skillGroup.types";

export function getDocReference<T>(
  getRefFn: (
    doc: T
  ) => ReferenceWithModelId<
    ISkillReferenceDoc | IOccupationReferenceDoc | IISCOGroupReferenceDoc | ISkillGroupReferenceDoc
  >,
  doc: T
) {
  const docRef = getRefFn(doc);
  // @ts-ignore
  delete docRef.modelId;
  return docRef;
}
