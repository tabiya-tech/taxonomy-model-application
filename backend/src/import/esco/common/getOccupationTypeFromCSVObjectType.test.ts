// Suppress chatty console during the tests
import "_test_utilities/consoleMock";

import { ObjectTypes } from "esco/common/objectTypes";
import { CSVObjectTypes } from "esco/common/csvObjectTypes";
import { getOccupationTypeFromCSVObjectType } from "./getOccupationTypeFromCSVObjectType";

describe("getOccupationTypeFromCSVObjectType", () => {
  test.each([
    [ObjectTypes.ESCOOccupation, CSVObjectTypes.ESCOOccupation],
    [ObjectTypes.LocalOccupation, CSVObjectTypes.LocalOccupation],
    [null, CSVObjectTypes.OccupationGroup],
    [null, CSVObjectTypes.SkillGroup],
    [null, CSVObjectTypes.Skill],
    [null, null],
    [null, "foo"],
  ])(`should return OccupationType: '%s' for value: '%s'`, (expectedObjectType, givenValue) => {
    // @ts-ignore
    expect(getOccupationTypeFromCSVObjectType(givenValue)).toBe(expectedObjectType);
  });
});
