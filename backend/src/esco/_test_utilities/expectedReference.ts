import { IISCOGroup, IISCOGroupReference } from "esco/iscoGroup/ISCOGroup.types";
import { ObjectTypes } from "esco/common/objectTypes";
import { IOccupation, IOccupationReference } from "esco/occupation/occupation.types";

/**
 *  Create an expected ISCOGroup reference from a given ISCOGroup
 * @param givenISCOGroup
 */
export function expectedISCOGroupReference(givenISCOGroup: IISCOGroup): IISCOGroupReference {
  return {
    id: givenISCOGroup.id,
    UUID: givenISCOGroup.UUID,
    objectType: ObjectTypes.ISCOGroup,
    code: givenISCOGroup.code,
    preferredLabel: givenISCOGroup.preferredLabel,
  };
}

/**
 *  Create an expected IOccupation reference from a given IOccupation
 * @param givenOccupation
 */
export function expectedOccupationReference(givenOccupation: IOccupation): IOccupationReference {
  return {
    id: givenOccupation.id,
    UUID: givenOccupation.UUID,
    objectType: ObjectTypes.Occupation,
    code: givenOccupation.code,
    ISCOGroupCode: givenOccupation.ISCOGroupCode,
    preferredLabel: givenOccupation.preferredLabel,
  };
}
