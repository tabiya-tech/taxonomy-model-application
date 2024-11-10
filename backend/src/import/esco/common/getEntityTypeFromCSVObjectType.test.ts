// Suppress chatty console during the tests
import "_test_utilities/consoleMock";

import { ObjectTypes } from "esco/common/objectTypes";
import { CSVObjectTypes } from "esco/common/csvObjectTypes";
import {
  getEntityTypeFromCSVObjectType,
  getOccupationGroupTypeFromCSVObjectType,
} from "./getEntityTypeFromCSVObjectType";

describe("getOccupationTypeFromCSVObjectType", () => {
  test.each([
    [ObjectTypes.ESCOOccupation, CSVObjectTypes.ESCOOccupation],
    [ObjectTypes.LocalOccupation, CSVObjectTypes.LocalOccupation],
    [null, CSVObjectTypes.ISCOGroup],
    [null, CSVObjectTypes.LocalGroup],
    [null, CSVObjectTypes.SkillGroup],
    [null, CSVObjectTypes.Skill],
    [null, null],
    [null, "foo"],
  ])(`should return OccupationType: '%s' for value: '%s'`, (expectedObjectType, givenValue) => {
    // @ts-ignore
    expect(getEntityTypeFromCSVObjectType(givenValue)).toBe(expectedObjectType);
  });
});

describe("getOccupationGroupTypeFromCSVObjectType", () => {
  test.each([
    [ObjectTypes.ISCOGroup, CSVObjectTypes.ISCOGroup],
    [ObjectTypes.LocalGroup, CSVObjectTypes.LocalGroup],
    [null, CSVObjectTypes.ESCOOccupation],
    [null, CSVObjectTypes.LocalOccupation],
    [null, CSVObjectTypes.SkillGroup],
    [null, CSVObjectTypes.Skill],
    [null, null],
    [null, "foo"],
  ])(`should return OccupationGroupType: '%s' for value: '%s'`, (expectedObjectType, givenValue) => {
    // @ts-ignore
    expect(getOccupationGroupTypeFromCSVObjectType(givenValue)).toBe(expectedObjectType);
  });
});
