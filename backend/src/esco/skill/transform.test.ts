import { ISkill, ISkillReference, ReuseLevel, SkillType } from "./skills.types";
import { ISkillGroupReference } from "esco/skillGroup/skillGroup.types";
import { getISkillMockData } from "./testDataHelper";
import SkillAPISpecs from "api-specifications/esco/skill";
import { transform, transformPaginated } from "./transform";
import { ObjectTypes, SignallingValueLabel } from "esco/common/objectTypes";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { randomUUID } from "node:crypto";
import { SkillToSkillRelationType } from "esco/skillToSkillRelation/skillToSkillRelation.types";
import {
  OccupationToSkillReferenceWithRelationType,
  OccupationToSkillRelationType,
} from "esco/occupationToSkillRelation/occupationToSkillRelation.types";
import { IOccupationReference } from "esco/occupations/occupationReference.types";
import { getTestSkillGroupCode } from "_test_utilities/mockSkillGroupCode";
import { getRandomString } from "_test_utilities/getMockRandomData";

describe("test the transformation of the ISkill -> ISkillResponse", () => {
  test("should transform a minimal ISkill to ISkillResponse", () => {
    // GIVEN a random ISkill with minimal fields
    const givenObject: ISkill = getISkillMockData();
    // AND some base path
    const givenBasePath = "https://some/root/path";

    // WHEN the transformation function is called
    const actual: SkillAPISpecs.Types.Response.ISkill = transform(givenObject, givenBasePath);

    // THEN expect the transformation function to return a ISkillResponse
    // that contains the input from the ISkill
    expect(actual).toEqual({
      id: givenObject.id,
      UUID: givenObject.UUID,
      UUIDHistory: givenObject.UUIDHistory,
      originUUID: givenObject.UUIDHistory[0],
      preferredLabel: givenObject.preferredLabel,
      originUri: givenObject.originUri,
      altLabels: givenObject.altLabels,
      definition: givenObject.definition,
      description: givenObject.description,
      scopeNote: givenObject.scopeNote,
      skillType: SkillAPISpecs.Enums.SkillType.SkillCompetence,
      reuseLevel: SkillAPISpecs.Enums.ReuseLevel.CrossSector,
      isLocalized: givenObject.isLocalized,
      modelId: givenObject.modelId,
      path: `${givenBasePath}/models/${givenObject.modelId}/skills/${givenObject.id}`,
      tabiyaPath: `${givenBasePath}/models/${givenObject.modelId}/skills/${givenObject.UUID}`,
      parent: null,
      children: [],
      requiresSkills: [],
      requiredBySkills: [],
      requiredByOccupations: [],
      createdAt: givenObject.createdAt.toISOString(),
      updatedAt: givenObject.updatedAt.toISOString(),
    });
  });

  test("should transform a fully populated ISkill to ISkillResponse", () => {
    // GIVEN a random ISkill with all fields populated
    const givenObject: ISkill = {
      ...getISkillMockData(),
      parents: [
        {
          id: getMockStringId(10),
          UUID: randomUUID(),
          preferredLabel: getRandomString(10),
          objectType: ObjectTypes.SkillGroup,
          code: getTestSkillGroupCode(),
        },
      ],
      children: [
        {
          id: getMockStringId(11),
          UUID: randomUUID(),
          preferredLabel: "Child Skill",
          objectType: ObjectTypes.Skill,
          isLocalized: true,
        },
      ],
      requiresSkills: [
        {
          id: getMockStringId(12),
          UUID: randomUUID(),
          preferredLabel: "Required Skill",
          objectType: ObjectTypes.Skill,
          relationType: SkillToSkillRelationType.ESSENTIAL,
          isLocalized: false,
        },
      ],
      requiredBySkills: [
        {
          id: getMockStringId(13),
          UUID: randomUUID(),
          preferredLabel: "Requiring Skill",
          objectType: ObjectTypes.Skill,
          relationType: SkillToSkillRelationType.OPTIONAL,
          isLocalized: true,
        },
      ],
      requiredByOccupations: [
        {
          id: getMockStringId(14),
          UUID: randomUUID(),
          preferredLabel: "Requiring Occupation",
          occupationType: ObjectTypes.ESCOOccupation,
          relationType: OccupationToSkillRelationType.ESSENTIAL,
          signallingValue: 0.5,
          signallingValueLabel: "medium",
          isLocalized: false,
        } as unknown as OccupationToSkillReferenceWithRelationType<IOccupationReference>,
        {
          id: getMockStringId(15),
          UUID: randomUUID(),
          preferredLabel: "Requiring Local Occupation",
          occupationType: ObjectTypes.LocalOccupation,
          relationType: null,
          signallingValue: 1.0,
          signallingValueLabel: "high",
          isLocalized: true,
        } as unknown as OccupationToSkillReferenceWithRelationType<IOccupationReference>,
        {
          id: getMockStringId(16),
          UUID: randomUUID(),
          preferredLabel: "Requiring Unknown Occupation",
          occupationType: "foo" as unknown as ObjectTypes,
          relationType: null,
          isLocalized: false,
        } as unknown as OccupationToSkillReferenceWithRelationType<IOccupationReference>,
      ],
    };
    const givenBasePath = "https://some/root/path";

    // WHEN the transformation function is called
    const actual: SkillAPISpecs.Types.Response.ISkill = transform(givenObject, givenBasePath);

    // THEN expect the transformation function to return a ISkillResponse with all relations mapped correctly
    expect(actual.parent).toEqual({
      id: givenObject.parents![0].id,
      UUID: givenObject.parents![0].UUID,
      preferredLabel: givenObject.parents![0].preferredLabel,
      objectType: SkillAPISpecs.Enums.Relations.Parents.ObjectTypes.SkillGroup,
      code: (givenObject.parents![0] as ISkillGroupReference).code,
    });
    expect(actual.children[0]).toEqual({
      id: givenObject.children![0].id,
      UUID: givenObject.children![0].UUID,
      preferredLabel: givenObject.children![0].preferredLabel,
      objectType: SkillAPISpecs.Enums.Relations.Children.ObjectTypes.Skill,
      isLocalized: true,
    });
    expect(actual.requiresSkills[0]).toEqual({
      id: givenObject.requiresSkills![0].id,
      UUID: givenObject.requiresSkills![0].UUID,
      preferredLabel: givenObject.requiresSkills![0].preferredLabel,
      objectType: SkillAPISpecs.Enums.ObjectTypes.Skill,
      relationType: SkillAPISpecs.Enums.SkillToSkillRelationType.ESSENTIAL,
      isLocalized: false,
    });
    expect(actual.requiredBySkills[0]).toEqual({
      id: givenObject.requiredBySkills![0].id,
      UUID: givenObject.requiredBySkills![0].UUID,
      preferredLabel: givenObject.requiredBySkills![0].preferredLabel,
      objectType: SkillAPISpecs.Enums.ObjectTypes.Skill,
      relationType: SkillAPISpecs.Enums.SkillToSkillRelationType.OPTIONAL,
      isLocalized: true,
    });
    expect(actual.requiredByOccupations[0]).toEqual({
      id: givenObject.requiredByOccupations![0].id,
      UUID: givenObject.requiredByOccupations![0].UUID,
      preferredLabel: givenObject.requiredByOccupations![0].preferredLabel,
      objectType: SkillAPISpecs.Enums.OccupationObjectTypes.ESCOOccupation,
      relationType: SkillAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL,
      signallingValue: 0.5,
      signallingValueLabel: SkillAPISpecs.Enums.SignallingValueLabel.MEDIUM,
      isLocalized: false,
    });
    expect(actual.requiredByOccupations[1]).toEqual({
      id: givenObject.requiredByOccupations![1].id,
      UUID: givenObject.requiredByOccupations![1].UUID,
      preferredLabel: givenObject.requiredByOccupations![1].preferredLabel,
      objectType: SkillAPISpecs.Enums.OccupationObjectTypes.LocalOccupation,
      relationType: null,
      signallingValue: 1.0,
      signallingValueLabel: SkillAPISpecs.Enums.SignallingValueLabel.HIGH,
      isLocalized: true,
    });
    expect(actual.requiredByOccupations[2]).toEqual({
      id: givenObject.requiredByOccupations![2].id,
      UUID: givenObject.requiredByOccupations![2].UUID,
      preferredLabel: givenObject.requiredByOccupations![2].preferredLabel,
      objectType: SkillAPISpecs.Enums.OccupationObjectTypes.ESCOOccupation,
      relationType: null,
      signallingValue: null,
      signallingValueLabel: null,
      isLocalized: false,
    });
  });
});

describe("test the transformation of the ISkill[] -> ISkillResponse[]", () => {
  test("should transform the ISkill[] to ISkillResponse[]", () => {
    // GIVEN an array of random ISkill
    const givenObjects: ISkill[] = [getISkillMockData(1), getISkillMockData(2)];

    // AND some base path
    const givenBasePath = "https://some/root/path";
    // AND some limit and cursor
    const limit = 2;
    const cursor = "some-cursor";

    // WHEN the transformation function is called
    const actual = transformPaginated(givenObjects, givenBasePath, limit, cursor);

    // THEN expect the transformation function to return a ISkillResponse[]
    expect(actual.data).toHaveLength(2);
    expect(actual.nextCursor).toEqual(cursor);
    expect(actual.limit).toEqual(limit);
  });
});

describe("Detailed mapping tests", () => {
  const basePath = "https://some/root/path";

  describe("mapSkillType", () => {
    const testCases = [
      { input: "skill/competence", expected: SkillAPISpecs.Enums.SkillType.SkillCompetence },
      { input: "knowledge", expected: SkillAPISpecs.Enums.SkillType.Knowledge },
      { input: "language", expected: SkillAPISpecs.Enums.SkillType.Language },
      { input: "attitude", expected: SkillAPISpecs.Enums.SkillType.Attitude },
      { input: "foo", expected: SkillAPISpecs.Enums.SkillType.None },
    ];

    test.each(testCases)("should map $input to $expected", ({ input, expected }) => {
      const givenObject = getISkillMockData();
      givenObject.skillType = input as SkillType;
      const actual = transform(givenObject, basePath);
      expect(actual.skillType).toBe(expected);
    });
  });

  describe("mapReuseLevel", () => {
    const testCases = [
      { input: "sector-specific", expected: SkillAPISpecs.Enums.ReuseLevel.SectorSpecific },
      { input: "occupation-specific", expected: SkillAPISpecs.Enums.ReuseLevel.OccupationSpecific },
      { input: "cross-sector", expected: SkillAPISpecs.Enums.ReuseLevel.CrossSector },
      { input: "transversal", expected: SkillAPISpecs.Enums.ReuseLevel.Transversal },
      { input: "foo", expected: SkillAPISpecs.Enums.ReuseLevel.None },
    ];

    test.each(testCases)("should map $input to $expected", ({ input, expected }) => {
      const givenObject = getISkillMockData();
      givenObject.reuseLevel = input as ReuseLevel;
      const actual = transform(givenObject, basePath);
      expect(actual.reuseLevel).toBe(expected);
    });
  });

  describe("mapParent", () => {
    test("should map Skill parent correctly", () => {
      const givenObject = getISkillMockData();
      givenObject.parents = [
        {
          id: getMockStringId(1),
          UUID: randomUUID(),
          preferredLabel: "Parent Skill",
          objectType: ObjectTypes.Skill,
          isLocalized: false,
        },
      ];
      const actual = transform(givenObject, basePath);
      expect(actual.parent!.objectType).toBe(SkillAPISpecs.Enums.Relations.Parents.ObjectTypes.Skill);
    });

    test("should map SkillGroup parent correctly", () => {
      const givenObject = getISkillMockData();
      const givenCode = getTestSkillGroupCode();
      givenObject.parents = [
        {
          id: getMockStringId(1),
          UUID: randomUUID(),
          preferredLabel: getRandomString(10),
          objectType: ObjectTypes.SkillGroup,
          code: givenCode,
        },
      ];
      const actual = transform(givenObject, basePath);
      expect(actual.parent!.objectType).toBe(SkillAPISpecs.Enums.Relations.Parents.ObjectTypes.SkillGroup);
      expect(actual.parent?.code).toBe(givenCode);
    });

    test("should handle null parent", () => {
      const givenObject = getISkillMockData();
      givenObject.parents = [null as unknown as ISkillReference];
      const actual = transform(givenObject, basePath);
      expect(actual.parent).toBeNull();
    });
  });

  describe("mapChild", () => {
    test("should map child correctly when isLocalized is missing", () => {
      const givenObject = getISkillMockData();
      givenObject.children = [
        {
          id: getMockStringId(1),
          UUID: randomUUID(),
          preferredLabel: "Child Skill",
          objectType: ObjectTypes.Skill,
        } as unknown as ISkillGroupReference,
      ];
      const actual = transform(givenObject, basePath);
      expect(actual.children[0]).not.toHaveProperty("isLocalized");
    });
  });

  describe("mapSkillToSkillRelationType", () => {
    test("should map unknown relation type to ESSENTIAL", () => {
      const givenObject = getISkillMockData();
      givenObject.requiresSkills = [
        {
          id: getMockStringId(12),
          UUID: randomUUID(),
          preferredLabel: "Required Skill",
          objectType: ObjectTypes.Skill,
          relationType: "foo" as SkillToSkillRelationType,
          isLocalized: false,
        },
      ];
      const actual = transform(givenObject, basePath);
      expect(actual.requiresSkills[0].relationType).toBe(SkillAPISpecs.Enums.SkillToSkillRelationType.ESSENTIAL);
    });
  });

  describe("mapOccupationToSkillRelationType", () => {
    test("should map optional and none correctly", () => {
      const givenObject = getISkillMockData();
      givenObject.requiredByOccupations = [
        {
          id: getMockStringId(14),
          UUID: randomUUID(),
          preferredLabel: "Requiring Occupation 1",
          occupationType: ObjectTypes.ESCOOccupation,
          relationType: "optional",
          isLocalized: false,
        } as unknown as OccupationToSkillReferenceWithRelationType<IOccupationReference>,
        {
          id: getMockStringId(15),
          UUID: randomUUID(),
          preferredLabel: "Requiring Occupation 2",
          occupationType: ObjectTypes.ESCOOccupation,
          relationType: "foo" as OccupationToSkillRelationType,
          isLocalized: false,
        } as unknown as OccupationToSkillReferenceWithRelationType<IOccupationReference>,
      ];
      const actual = transform(givenObject, basePath);
      expect(actual.requiredByOccupations[0].relationType).toBe(
        SkillAPISpecs.Enums.OccupationToSkillRelationType.OPTIONAL
      );
      expect(actual.requiredByOccupations[1].relationType).toBe(SkillAPISpecs.Enums.OccupationToSkillRelationType.NONE);
    });

    test("should handle missing relationType and signalling fields", () => {
      const givenObject = getISkillMockData();
      givenObject.requiredByOccupations = [
        {
          id: getMockStringId(14),
          UUID: randomUUID(),
          preferredLabel: "Requiring Occupation",
          occupationType: ObjectTypes.ESCOOccupation,
          isLocalized: false,
        } as unknown as OccupationToSkillReferenceWithRelationType<IOccupationReference>,
      ];
      const actual = transform(givenObject, basePath);
      expect(actual.requiredByOccupations[0].relationType).toBeNull();
      expect(actual.requiredByOccupations[0].signallingValue).toBeNull();
      expect(actual.requiredByOccupations[0].signallingValueLabel).toBeNull();
    });
  });

  describe("mapSignallingValueLabel", () => {
    const testCases = [
      { input: "low", expected: SkillAPISpecs.Enums.SignallingValueLabel.LOW },
      { input: "medium", expected: SkillAPISpecs.Enums.SignallingValueLabel.MEDIUM },
      { input: "high", expected: SkillAPISpecs.Enums.SignallingValueLabel.HIGH },
      { input: "foo", expected: SkillAPISpecs.Enums.SignallingValueLabel.NONE },
    ];

    test.each(testCases)("should map $input to $expected", ({ input, expected }) => {
      const givenObject = getISkillMockData();
      givenObject.requiredByOccupations = [
        {
          id: getMockStringId(14),
          UUID: randomUUID(),
          preferredLabel: "Requiring Occupation",
          occupationType: ObjectTypes.ESCOOccupation,
          signallingValueLabel: input as SignallingValueLabel,
          isLocalized: false,
        } as unknown as OccupationToSkillReferenceWithRelationType<IOccupationReference>,
      ];
      const actual = transform(givenObject, basePath);
      expect(actual.requiredByOccupations[0].signallingValueLabel).toBe(expected);
    });
  });
});

describe("test the transformation of originUUID field", () => {
  test("should set originUUID to the last UUID in UUIDHistory when UUIDHistory has items", () => {
    const givenObject = getISkillMockData();
    const firstUUID = randomUUID();
    const secondUUID = randomUUID();
    const thirdUUID = randomUUID();
    givenObject.UUIDHistory = [firstUUID, secondUUID, thirdUUID];

    const actual = transform(givenObject, "https://some/root/path");

    expect(actual.originUUID).toBe(thirdUUID);
  });

  test("should set originUUID to empty string when UUIDHistory is empty", () => {
    const givenObject = getISkillMockData();
    givenObject.UUIDHistory = [];
    const actual = transform(givenObject, "https://some/root/path");
    expect(actual.originUUID).toBe("");
  });
});
