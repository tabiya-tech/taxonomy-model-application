import { OccupationType } from "esco/common/objectTypes";

export function getOccupationTypeFromRow<T>(row: T) {
  // @ts-ignore
  switch (row.OCCUPATIONTYPE.toUpperCase()) {
    case "ESCO":
      return OccupationType.ESCO;
    case "LOCAL":
      return OccupationType.LOCAL;
    case "LOCALIZED":
      return OccupationType.LOCALIZED;
    default:
      return null;
  }
}
