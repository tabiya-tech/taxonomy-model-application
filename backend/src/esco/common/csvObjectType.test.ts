import { ObjectTypes, RelationType } from "esco/common/objectTypes";
import {
  CSVObjectTypes,
  getObjectTypeFromCSVObjectType,
  getCSVTypeFromObjectObjectType,
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
import { ReuseLevel, SkillType } from "../skill/skills.types";

describe("getObjectTypeFromCSVObjectType", () => {
  test.each([
    [ObjectTypes.ISCOGroup, CSVObjectTypes.ISCOGroup],
    [ObjectTypes.ESCOOccupation, CSVObjectTypes.ESCOOccupation],
    [ObjectTypes.LocalOccupation, CSVObjectTypes.LocalOccupation],
    [ObjectTypes.SkillGroup, CSVObjectTypes.SkillGroup],
    [ObjectTypes.Skill, CSVObjectTypes.Skill],
    [null, "foo"],
  ])(
    `should return ObjectType: '%s' for CSVObjectType: '%s'`,
    (expectedObjectType: ObjectTypes | null, givenCSVObjectType: string) => {
      // GIVEN a CSVType
      expect(getObjectTypeFromCSVObjectType(givenCSVObjectType)).toBe(expectedObjectType);
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
  ])(
    `should return CSVObjectType: '%s' for ObjectType: '%s'`,
    (expectedCSVObjectType: CSVObjectTypes | null, givenObjectType: string) => {
      // GIVEN an ObjectType
      expect(getCSVTypeFromObjectObjectType(givenObjectType)).toBe(expectedCSVObjectType);
    }
  );
});

describe("getRelationTypeFromCSVRelationType", () => {
  test.each([
    [RelationType.ESSENTIAL, CSVRelationType.Essential],
    [RelationType.OPTIONAL, CSVRelationType.Optional],
    [null, "foo"],
  ])(
    `should return RelationType: '%s' for CSVRelationType: '%s'`,
    (expectedRelationType: RelationType | null, givenCSVRelationType: string) => {
      // GIVEN a CSVRelationType
      expect(getRelationTypeFromCSVRelationType(givenCSVRelationType)).toBe(expectedRelationType);
    }
  );
});
describe("getCSVRelationTypeFromRelationType", () => {
  test.each([
    [CSVRelationType.Essential, RelationType.ESSENTIAL],
    [CSVRelationType.Optional, RelationType.OPTIONAL],
    [null, "foo"],
  ])(
    `should return CSVRelationType: '%s' for RelationType: '%s'`,
    (expectedCSVRelationType: CSVRelationType | null, givenRelationType: string) => {
      // GIVEN a RelationType
      expect(getCSVRelationTypeFromRelationType(givenRelationType)).toBe(expectedCSVRelationType);
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
  ])(
    `should return CSVReuseLevel: '%s' for RelationType: '%s'`,
    (expectedCSVReuseLevel: CSVReuseLevel | null, givenReuseLevel: string) => {
      // GIVEN a RelationType
      expect(getCSVTypeFromReuseLevel(givenReuseLevel)).toBe(expectedCSVReuseLevel);
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
  ])(
    `should return RelationType: '%s' for CSVRelationType: '%s'`,
    (expectedReuseLevel: ReuseLevel | null, givenCSVReuseLevel: string) => {
      // GIVEN a CSVRelationType
      expect(getReuseLevelFromCSVReuseLevel(givenCSVReuseLevel)).toBe(expectedReuseLevel);
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
  ])(
    `should return CSVSkillType: '%s' for SkillType: '%s'`,
    (expectedCSVSkillType: CSVSkillType | null, givenSkillType: string) => {
      // GIVEN a SkillType
      expect(getCSVTypeFromSkillType(givenSkillType)).toBe(expectedCSVSkillType);
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
  ])(
    `should return SkillType: '%s' for CSVSkillType: '%s'`,
    (expectedSkillType: SkillType | null, givenCSVSkillType: string) => {
      // GIVEN a CSVSkillType
      expect(getSkillTypeFromCSVSkillType(givenCSVSkillType)).toBe(expectedSkillType);
    }
  );
});
