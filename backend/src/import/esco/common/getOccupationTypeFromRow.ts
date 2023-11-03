import { OccupationType } from "esco/common/objectTypes";
import { ILocalizedOccupationRow } from "import/esco/localizedOccupations/localizedOccupationsParser";
import { IOccupationRow } from "import/esco/occupations/occupationsParser";

export const getOccupationTypeFromRow = (row: IOccupationRow | ILocalizedOccupationRow) => {
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
};
