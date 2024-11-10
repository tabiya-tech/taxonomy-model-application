import { ObjectTypes } from "esco/common/objectTypes";
import { getObjectTypeFromCSVObjectType } from "esco/common/csvObjectTypes";

export function getEntityTypeFromCSVObjectType(
  value: string
): ObjectTypes.ESCOOccupation | ObjectTypes.LocalOccupation | null {
  const objectType = getObjectTypeFromCSVObjectType(value);
  switch (objectType) {
    case ObjectTypes.ESCOOccupation:
    case ObjectTypes.LocalOccupation:
      return objectType;
    default:
      return null;
  }
}

export function getOccupationGroupTypeFromCSVObjectType(
  value: string
): ObjectTypes.ISCOGroup | ObjectTypes.LocalGroup | null {
  const objectType = getObjectTypeFromCSVObjectType(value);
  switch (objectType) {
    case ObjectTypes.ISCOGroup:
    case ObjectTypes.LocalGroup:
      return objectType;
    default:
      return null;
  }
}
