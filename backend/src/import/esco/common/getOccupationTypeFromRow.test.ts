import { getOccupationTypeFromRow } from "./getOccupationTypeFromRow";
import { OccupationType } from "esco/common/objectTypes";
import { IOccupationRow } from "import/esco/occupations/occupationsParser";
import { ILocalizedOccupationRow } from "import/esco/localizedOccupations/localizedOccupationsParser";

describe("getOccupationTypeFromRow", () => {
  test("should return ESCO for occupation type ESCO", () => {
    // GIVEN a row with the occupation type 'ESCO'
    const row = { OCCUPATIONTYPE: "ESCO" };

    // WHEN getting the occupation type from the row
    const result = getOccupationTypeFromRow(row as IOccupationRow);

    // THEN the result should be OccupationType.ESCO
    expect(result).toBe(OccupationType.ESCO);
  });

  test("should return LOCAL for occupation type LOCAL", () => {
    // GIVEN a row with the occupation type 'LOCAL'
    const row = { OCCUPATIONTYPE: "LOCAL" };

    // WHEN getting the occupation type from the row
    const result = getOccupationTypeFromRow(row as ILocalizedOccupationRow);

    // THEN the result should be OccupationType.LOCAL
    expect(result).toBe(OccupationType.LOCAL);
  });

  test("should return LOCALIZED for occupation type LOCALIZED", () => {
    // GIVEN a row with the occupation type 'LOCALIZED'
    const row = { OCCUPATIONTYPE: "LOCALIZED" };

    // WHEN getting the occupation type from the row
    const result = getOccupationTypeFromRow(row as IOccupationRow);

    // THEN the result should be OccupationType.LOCALIZED
    expect(result).toBe(OccupationType.LOCALIZED);
  });

  test("should return null for unrecognized occupation types", () => {
    // GIVEN a row with an unrecognized occupation type
    const row = { OCCUPATIONTYPE: "FOO" };

    // WHEN getting the occupation type from the row
    const result = getOccupationTypeFromRow(row as ILocalizedOccupationRow);

    // THEN the result should be null
    expect(result).toBeNull();
  });
});
