import { ObjectTypes } from "esco/common/objectTypes";
import { getObjectTypeFromCSVObjectType } from "esco/common/csvObjectTypes";

export function getOccupationTypeFromCSVObjectType(
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
