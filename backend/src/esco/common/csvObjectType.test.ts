import { ObjectTypes, SignallingValueLabel } from "esco/common/objectTypes";
import {
  CSVObjectTypes,
  getObjectTypeFromCSVObjectType,
  getCSVTypeFromObjectType,
  CSVRelationType,
  getSkillToSkillRelationTypeFromCSVRelationType,
  getCSVRelationTypeFromSkillToSkillRelationType,
  CSVReuseLevel,
  getCSVTypeFromReuseLevel,
  getReuseLevelFromCSVReuseLevel,
  getCSVTypeFromSkillType,
  CSVSkillType,
  getSkillTypeFromCSVSkillType,
  getOccupationToSkillRelationTypeFromCSVRelationType,
  getCSVRelationTypeFromOccupationToSkillRelationType,
  getCSVSignalingValueLabelFromSignallingValueLabel,
  CSVSignallingValueLabel,
  getCSVSignalingValueFromSignallingValue,
} from "esco/common/csvObjectTypes";
import { ReuseLevel, SkillType } from "esco/skill/skills.types";
import { SkillToSkillRelationType } from "esco/skillToSkillRelation/skillToSkillRelation.types";
import { OccupationToSkillRelationType } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";

describe("getObjectTypeFromCSVObjectType", () => {
  test.each([
    [ObjectTypes.ISCOGroup, CSVObjectTypes.ISCOGroup],
    [ObjectTypes.ESCOOccupation, CSVObjectTypes.ESCOOccupation],
    [ObjectTypes.LocalOccupation, CSVObjectTypes.LocalOccupation],
    [ObjectTypes.SkillGroup, CSVObjectTypes.SkillGroup],
    [ObjectTypes.Skill, CSVObjectTypes.Skill],
    [null, "foo"],
    [null, null],
    [null, undefined],
  ])(
    `should return ObjectType: '%s' for CSVObjectType: '%s'`,
    (expectedObjectType: ObjectTypes | null, givenCSVObjectType: string | null | undefined) => {
      // GIVEN a CSVObjectType
      // THEN the ObjectType should be returned
      expect(getObjectTypeFromCSVObjectType(givenCSVObjectType as string)).toBe(expectedObjectType);
      // irrespective of the case
      expect(getObjectTypeFromCSVObjectType(givenCSVObjectType?.toUpperCase() as string)).toBe(expectedObjectType);
    }
  );
});
describe("getCSVTypeFromObjectObjectType", () => {
  test.each([
    [CSVObjectTypes.ISCOGroup, ObjectTypes.ISCOGroup],
    [CSVObjectTypes.ESCOOccupation, ObjectTypes.ESCOOccupation],
    [CSVObjectTypes.LocalOccupation, ObjectTypes.LocalOccupation],
    [CSVObjectTypes.SkillGroup, ObjectTypes.SkillGroup],
    [CSVObjectTypes.Skill, ObjectTypes.Skill],
    [null, "foo"],
    [null, null],
    [null, undefined],
  ])(
    `should return CSVObjectType: '%s' for ObjectType: '%s'`,
    (expectedCSVObjectType: CSVObjectTypes | null, givenObjectType: string | null | undefined) => {
      // GIVEN an ObjectType
      // THEN the CSVObjectType should be returned
      expect(getCSVTypeFromObjectType(givenObjectType as string)).toBe(expectedCSVObjectType);
      // irrespective of the case
      expect(getCSVTypeFromObjectType(givenObjectType?.toUpperCase() as string)).toBe(expectedCSVObjectType);
    }
  );
});
describe("getSkillToSkillRelationTypeFromCSVRelationType", () => {
  test.each([
    [SkillToSkillRelationType.ESSENTIAL, CSVRelationType.Essential],
    [SkillToSkillRelationType.OPTIONAL, CSVRelationType.Optional],
    [null, "foo"],
    [null, null],
    [null, undefined],
  ])(
    `should return RelationType: '%s' for CSVRelationType: '%s'`,
    (expectedRelationType: SkillToSkillRelationType | null, givenCSVRelationType: string | null | undefined) => {
      // GIVEN a CSVRelationType
      // THEN the RelationType should be returned
      expect(getSkillToSkillRelationTypeFromCSVRelationType(givenCSVRelationType as string)).toBe(expectedRelationType);
      // irrespective of the case
      expect(getSkillToSkillRelationTypeFromCSVRelationType(givenCSVRelationType?.toUpperCase() as string)).toBe(
        expectedRelationType
      );
    }
  );
});

describe("getOccupationToSkillRelationTypeFromCSVRelationType", () => {
  test.each([
    [OccupationToSkillRelationType.NONE, CSVRelationType.None],
    [OccupationToSkillRelationType.ESSENTIAL, CSVRelationType.Essential],
    [OccupationToSkillRelationType.OPTIONAL, CSVRelationType.Optional],
    [null, "foo"],
    [null, null],
    [null, undefined],
  ])(
    `should return RelationType: '%s' for CSVRelationType: '%s'`,
    (expectedRelationType: OccupationToSkillRelationType | null, givenCSVRelationType: string | null | undefined) => {
      // GIVEN a CSVRelationType
      // THEN the RelationType should be returned
      expect(getOccupationToSkillRelationTypeFromCSVRelationType(givenCSVRelationType as string)).toBe(
        expectedRelationType
      );
      // irrespective of the case
      expect(getOccupationToSkillRelationTypeFromCSVRelationType(givenCSVRelationType?.toUpperCase() as string)).toBe(
        expectedRelationType
      );
    }
  );
});

describe("getCSVRelationTypeFromSkillToSkillRelationType", () => {
  test.each([
    [CSVRelationType.Essential, SkillToSkillRelationType.ESSENTIAL],
    [CSVRelationType.Optional, SkillToSkillRelationType.OPTIONAL],
    [null, "foo"],
    [null, null],
    [null, undefined],
  ])(
    `should return CSVRelationType: '%s' for RelationType: '%s'`,
    (expectedCSVRelationType: CSVRelationType | null, givenRelationType: string | null | undefined) => {
      // GIVEN a RelationType
      // THEN the CSVRelationType should be returned
      expect(getCSVRelationTypeFromSkillToSkillRelationType(givenRelationType as string)).toBe(expectedCSVRelationType);
      // irrespective of the case
      expect(getCSVRelationTypeFromSkillToSkillRelationType(givenRelationType?.toUpperCase() as string)).toBe(
        expectedCSVRelationType
      );
    }
  );
});

describe("getCSVRelationTypeFromOccupationToSkillRelationType", () => {
  test.each([
    [CSVRelationType.None, OccupationToSkillRelationType.NONE],
    [CSVRelationType.Essential, OccupationToSkillRelationType.ESSENTIAL],
    [CSVRelationType.Optional, OccupationToSkillRelationType.OPTIONAL],
    [null, "foo"],
    [null, null],
    [null, undefined],
  ])(
    `should return CSVRelationType: '%s' for RelationType: '%s'`,
    (expectedCSVRelationType: CSVRelationType | null, givenRelationType: string | null | undefined) => {
      // GIVEN a RelationType
      // THEN the CSVRelationType should be returned
      expect(getCSVRelationTypeFromOccupationToSkillRelationType(givenRelationType as string)).toBe(
        expectedCSVRelationType
      );
      // irrespective of the case
      expect(getCSVRelationTypeFromOccupationToSkillRelationType(givenRelationType?.toUpperCase() as string)).toBe(
        expectedCSVRelationType
      );
    }
  );
});
describe("getSignallingValueLabelFromCSVSignallingValueLabel", () => {
  test.each([
    [SignallingValueLabel.LOW, CSVSignallingValueLabel.LOW],
    [SignallingValueLabel.HIGH, CSVSignallingValueLabel.HIGH],
    [SignallingValueLabel.MEDIUM, CSVSignallingValueLabel.MEDIUM],
    [SignallingValueLabel.NONE, CSVSignallingValueLabel.NONE],
    ["", CSVSignallingValueLabel.NONE],
    ["foo", null],
    [null, null],
    [undefined, null],
  ])(
    `should return SignallingValueLabel: '%s' for CSVSignallingValueLabel: '%s'`,
    (
      givenSignallingValueLabel: SignallingValueLabel | null | string | undefined,
      expectedCSVSignallingValueLabel: string | null | undefined
    ) => {
      // GIVEN a CSVSignallingValue
      // THEN the SignallingValue should be returned
      expect(getCSVSignalingValueLabelFromSignallingValueLabel(givenSignallingValueLabel as string)).toBe(
        expectedCSVSignallingValueLabel
      );
      // irrespective of the case (upper case)
      expect(
        getCSVSignalingValueLabelFromSignallingValueLabel(givenSignallingValueLabel?.toUpperCase() as string)
      ).toBe(expectedCSVSignallingValueLabel);

      // and lower case
      expect(
        getCSVSignalingValueLabelFromSignallingValueLabel(givenSignallingValueLabel?.toLowerCase() as string)
      ).toBe(expectedCSVSignallingValueLabel);
    }
  );
});
describe("getSignallingValueFromCSVSignallingValue", () => {
  const randomNumber = Math.floor(Math.random() * 10000);
  test.each([
    [0, "0"],
    [1, "1"],
    [10000, "10000"],
    [null, ""],
    [undefined, ""],
    [randomNumber, randomNumber.toString()],
  ])(
    `for Signalling value: '%s', it should return CSV Signalling value: '%s'`,
    (givenSignallingValue: number | null | undefined, expectedCSVSignallingValue: string | number) => {
      // GIVEN a SignallingValue
      // THEN the CSVSignallingValue should be returned
      expect(getCSVSignalingValueFromSignallingValue(givenSignallingValue as number)).toBe(expectedCSVSignallingValue);
    }
  );
});
describe("getCSVTypeFromReuseLevel", () => {
  test.each([
    [CSVReuseLevel.SectorSpecific, ReuseLevel.SectorSpecific],
    [CSVReuseLevel.OccupationSpecific, ReuseLevel.OccupationSpecific],
    [CSVReuseLevel.CrossSector, ReuseLevel.CrossSector],
    [CSVReuseLevel.Transversal, ReuseLevel.Transversal],
    [CSVReuseLevel.None, ReuseLevel.None],
    [null, "foo"],
    [null, null],
    [null, undefined],
  ])(
    `should return CSVReuseLevel: '%s' for RelationType: '%s'`,
    (expectedCSVReuseLevel: CSVReuseLevel | null, givenReuseLevel: string | null | undefined) => {
      // GIVEN a ReuseLevel
      // THEN the CSVReuseLevel should be returned
      expect(getCSVTypeFromReuseLevel(givenReuseLevel as string)).toBe(expectedCSVReuseLevel);
      // irrespective of the case
      expect(getCSVTypeFromReuseLevel(givenReuseLevel?.toUpperCase() as string)).toBe(expectedCSVReuseLevel);
    }
  );
});
describe("getReuseLevelFromCSVReuseLevel", () => {
  test.each([
    [ReuseLevel.SectorSpecific, CSVReuseLevel.SectorSpecific],
    [ReuseLevel.OccupationSpecific, CSVReuseLevel.OccupationSpecific],
    [ReuseLevel.CrossSector, CSVReuseLevel.CrossSector],
    [ReuseLevel.Transversal, CSVReuseLevel.Transversal],
    [ReuseLevel.None, CSVReuseLevel.None],
    [null, "foo"],
    [null, null],
    [null, undefined],
  ])(
    `should return RelationType: '%s' for CSVRelationType: '%s'`,
    (expectedReuseLevel: ReuseLevel | null, givenCSVReuseLevel: string | null | undefined) => {
      // GIVEN a CSVReuseLevel
      // THEN the ReuseLevel should be returned
      expect(getReuseLevelFromCSVReuseLevel(givenCSVReuseLevel as string)).toBe(expectedReuseLevel);
      // irrespective of the case
      expect(getReuseLevelFromCSVReuseLevel(givenCSVReuseLevel?.toUpperCase() as string)).toBe(expectedReuseLevel);
    }
  );
});
describe("getCSVTypeFromSkillType", () => {
  test.each([
    [CSVSkillType.Knowledge, SkillType.Knowledge],
    [CSVSkillType.Language, SkillType.Language],
    [CSVSkillType.Attitude, SkillType.Attitude],
    [CSVSkillType.SkillCompetence, SkillType.SkillCompetence],
    [CSVSkillType.None, CSVSkillType.None],
    [null, "foo"],
    [null, null],
    [null, undefined],
  ])(
    `should return CSVSkillType: '%s' for SkillType: '%s'`,
    (expectedCSVSkillType: CSVSkillType | null, givenSkillType: string | null | undefined) => {
      // GIVEN a SkillType
      // THEN the CSVSkillType should be returned
      expect(getCSVTypeFromSkillType(givenSkillType as string)).toBe(expectedCSVSkillType);
      // irrespective of the case
      expect(getCSVTypeFromSkillType(givenSkillType?.toUpperCase() as string)).toBe(expectedCSVSkillType);
    }
  );
});
describe("getSkillTypeFromCSVSkillType", () => {
  test.each([
    [SkillType.Knowledge, CSVSkillType.Knowledge],
    [SkillType.Language, CSVSkillType.Language],
    [SkillType.Attitude, CSVSkillType.Attitude],
    [SkillType.SkillCompetence, CSVSkillType.SkillCompetence],
    [SkillType.None, CSVSkillType.None],
    [null, "foo"],
    [null, null],
    [null, undefined],
  ])(
    `should return SkillType: '%s' for CSVSkillType: '%s'`,
    (expectedSkillType: SkillType | null, givenCSVSkillType: string | null | undefined) => {
      // GIVEN a CSVSkillType
      // THEN the SkillType should be returned
      expect(getSkillTypeFromCSVSkillType(givenCSVSkillType as string)).toBe(expectedSkillType);
      // irrespective of the case
      expect(getSkillTypeFromCSVSkillType(givenCSVSkillType?.toUpperCase() as string)).toBe(expectedSkillType);
    }
  );
});
