import { ObjectTypes, RelationType } from "esco/common/objectTypes";
import {
  CSVObjectTypes,
  getObjectTypeFromCSVObjectType,
  getCSVTypeFromObjectType,
  CSVRelationType,
  getRelationTypeFromCSVRelationType,
  getCSVRelationTypeFromRelationType,
  CSVReuseLevel,
  getCSVTypeFromReuseLevel,
  getReuseLevelFromCSVReuseLevel,
  getCSVTypeFromSkillType,
  CSVSkillType,
  getSkillTypeFromCSVSkillType,
} from "esco/common/csvObjectTypes";
import { ReuseLevel, SkillType } from "esco/skill/skills.types";

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
      expect(getObjectTypeFromCSVObjectType(givenCSVObjectType?.toUpperCase()  as string)).toBe(expectedObjectType);
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
describe("getRelationTypeFromCSVRelationType", () => {
  test.each([
    [RelationType.ESSENTIAL, CSVRelationType.Essential],
    [RelationType.OPTIONAL, CSVRelationType.Optional],
    [null, "foo"],
    [null, null],
    [null, undefined],
  ])(
    `should return RelationType: '%s' for CSVRelationType: '%s'`,
    (expectedRelationType: RelationType | null, givenCSVRelationType: string | null | undefined) => {
      // GIVEN a CSVRelationType
      // THEN the RelationType should be returned
      expect(getRelationTypeFromCSVRelationType(givenCSVRelationType as string)).toBe(expectedRelationType);
      // irrespective of the case
      expect(getRelationTypeFromCSVRelationType(givenCSVRelationType?.toUpperCase() as string)).toBe(expectedRelationType);
    }
  );
});
describe("getCSVRelationTypeFromRelationType", () => {
  test.each([
    [CSVRelationType.Essential, RelationType.ESSENTIAL],
    [CSVRelationType.Optional, RelationType.OPTIONAL],
    [null, "foo"],
    [null, null],
    [null, undefined],
  ])(
    `should return CSVRelationType: '%s' for RelationType: '%s'`,
    (expectedCSVRelationType: CSVRelationType | null, givenRelationType: string | null | undefined) => {
      // GIVEN a RelationType
      // THEN the CSVRelationType should be returned
      expect(getCSVRelationTypeFromRelationType(givenRelationType as string)).toBe(expectedCSVRelationType);
      // irrespective of the case
      expect(getCSVRelationTypeFromRelationType(givenRelationType?.toUpperCase() as string)).toBe(expectedCSVRelationType);
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
