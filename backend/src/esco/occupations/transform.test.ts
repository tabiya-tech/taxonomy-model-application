//mute chatty console
import "_test_utilities/consoleMock";
import { randomUUID } from "node:crypto";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { IOccupation } from "./occupation.types";
import { IOccupationReference } from "esco/occupations/occupationReference.types";
import { IOccupationGroupReference } from "esco/occupationGroup/OccupationGroup.types";
import { getRandomString } from "_test_utilities/getMockRandomData";
import OccupationAPISpecs from "api-specifications/esco/occupation";
import SkillAPISpecs from "api-specifications/esco/skill";
import { Routes } from "routes.constant";
import { ObjectTypes } from "esco/common/objectTypes";
import {
  getIOccupationMockData,
  getIOccupationMockDataWithOccupationChildren,
  getNewOccupationSpec,
  getIOccupationMockDataWithParentOccupation,
  getIOccupationMockDataWithParentOccupationGroup,
} from "./testDataHelper";
import { transform, transformPaginated, transformOccupationSkill, transformPaginatedSkills } from "./transform";
import * as skillTransformModule from "esco/skill/transform";

import { OccupationToSkillRelationType } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";
import { SignallingValueLabel } from "esco/common/objectTypes";
import { ISkillWithRelation } from "./occupationService.types";

describe("getNewOccupationSpec", () => {
  test("should return a valid occupation spec object", () => {
    const result = getNewOccupationSpec();

    expect(result).toHaveProperty("preferredLabel");
    expect(result).toHaveProperty("occupationType", ObjectTypes.ESCOOccupation);
    expect(result.UUIDHistory).toBeInstanceOf(Array);
    expect(result.UUIDHistory.length).toBeGreaterThan(0);
  });
});

describe("test the transformation of IOccupation -> IOccupationResponse", () => {
  test("should transform IOccupation to IOccupationResponse", () => {
    // GIVEN a random IOccupation
    const givenObject: IOccupation = getIOccupationMockData();
    // AND some base path
    const givenBasePath = "https://some/root/path";

    // WHEN the transformation function is called
    const actual: OccupationAPISpecs.Types.POST.Response.Payload = transform(givenObject, givenBasePath);

    // THEN expect the transformation function to return a IOccupationResponse
    // that contains the input from the IOccupation
    expect(actual).toEqual(
      expect.objectContaining({
        // core fields
        id: givenObject.id,
        UUID: givenObject.UUID,
        UUIDHistory: givenObject.UUIDHistory,
        originUUID: givenObject.UUIDHistory && givenObject.UUIDHistory.length > 0 ? givenObject.UUIDHistory.at(-1) : "",
        code: givenObject.code,
        occupationGroupCode: givenObject.occupationGroupCode,
        preferredLabel: givenObject.preferredLabel,
        originUri: givenObject.originUri,
        altLabels: givenObject.altLabels,
        definition: givenObject.definition,
        description: givenObject.description,
        regulatedProfessionNote: givenObject.regulatedProfessionNote,
        scopeNote: givenObject.scopeNote,
        occupationType:
          givenObject.occupationType === ObjectTypes.ESCOOccupation
            ? OccupationAPISpecs.Enums.OccupationType.ESCOOccupation
            : OccupationAPISpecs.Enums.OccupationType.LocalOccupation,
        modelId: givenObject.modelId,
        isLocalized: givenObject.isLocalized,
        // hierarchy and paths
        parent: null,
        children: [],
        requiresSkills: givenObject.requiresSkills.map((skillRef) => ({
          id: skillRef.id,
          UUID: skillRef.UUID,
          preferredLabel: skillRef.preferredLabel,
          isLocalized: skillRef.isLocalized,
          objectType: OccupationAPISpecs.Enums.Relations.RequiredSkills.ObjectTypes.Skill,
          relationType: skillRef.relationType,
          signallingValue: skillRef.signallingValue,
          signallingValueLabel: skillRef.signallingValueLabel,
        })),
        path: `${givenBasePath}${Routes.MODELS_ROUTE}/${givenObject.modelId}/occupations/${givenObject.id}`,
        tabiyaPath: `${givenBasePath}${Routes.MODELS_ROUTE}/${givenObject.modelId}/occupations/${givenObject.UUID}`,
        // timestamps
        createdAt: givenObject.createdAt.toISOString(),
        updatedAt: givenObject.updatedAt.toISOString(),
      })
    );
  });

  test("should transform IOccupation to IOccupationResponse with Occupation children", () => {
    // GIVEN a random IOccupation
    const givenObject: IOccupation = getIOccupationMockDataWithOccupationChildren();
    // AND some base path
    const givenBasePath = "https://some/root/path";

    // WHEN the transformation function is called
    const actual: OccupationAPISpecs.Types.POST.Response.Payload = transform(givenObject, givenBasePath);

    // THEN expect the transformation function to return a IOccupationResponse
    // that contains the input from the IOccupation
    expect(actual).toEqual(
      expect.objectContaining({
        id: givenObject.id,
        UUID: givenObject.UUID,
        UUIDHistory: givenObject.UUIDHistory,
        code: givenObject.code,
        occupationGroupCode: givenObject.occupationGroupCode,
        preferredLabel: givenObject.preferredLabel,
        originUUID: givenObject.UUIDHistory && givenObject.UUIDHistory.length > 0 ? givenObject.UUIDHistory.at(-1) : "",
        originUri: givenObject.originUri,
        altLabels: givenObject.altLabels,
        definition: givenObject.definition,
        description: givenObject.description,
        regulatedProfessionNote: givenObject.regulatedProfessionNote,
        scopeNote: givenObject.scopeNote,
        occupationType: givenObject.occupationType,
        modelId: givenObject.modelId,
        isLocalized: givenObject.isLocalized,
        parent: null,
        requiresSkills: givenObject.requiresSkills.map((skillRef) => ({
          id: skillRef.id,
          UUID: skillRef.UUID,
          preferredLabel: skillRef.preferredLabel,
          isLocalized: skillRef.isLocalized,
          objectType: OccupationAPISpecs.Enums.Relations.RequiredSkills.ObjectTypes.Skill,
          relationType: skillRef.relationType,
          signallingValue: skillRef.signallingValue,
          signallingValueLabel: skillRef.signallingValueLabel,
        })),
        children: givenObject.children.map((child) => ({
          id: child.id,
          UUID: child.UUID,
          code: child.code,
          preferredLabel: child.preferredLabel,
          objectType:
            "occupationType" in child && child.occupationType === ObjectTypes.ESCOOccupation
              ? OccupationAPISpecs.Enums.Relations.Children.ObjectTypes.ESCOOccupation
              : OccupationAPISpecs.Enums.Relations.Children.ObjectTypes.LocalOccupation,
        })),
        path: `${givenBasePath}${Routes.MODELS_ROUTE}/${givenObject.modelId}/occupations/${givenObject.id}`,
        tabiyaPath: `${givenBasePath}${Routes.MODELS_ROUTE}/${givenObject.modelId}/occupations/${givenObject.UUID}`,
        createdAt: givenObject.createdAt.toISOString(),
        updatedAt: givenObject.updatedAt.toISOString(),
      })
    );
  });
});

describe("test the transformation of IOccupation[] -> IOccupationResponse[]", () => {
  test("should transform paginated IOccupation[] correctly", () => {
    const givenObjects: IOccupation[] = [getIOccupationMockData(), getIOccupationMockDataWithOccupationChildren()];
    const givenBasePath = "https://some/root/path";
    const limit = 1;
    const cursor = Buffer.from(`${givenObjects[limit].id}|${givenObjects[limit].createdAt.toISOString()}`).toString(
      "base64"
    );

    const givenObjectsPaginated = givenObjects.slice(0, limit);
    const actual: OccupationAPISpecs.Types.GET.Response.Payload = transformPaginated(
      givenObjectsPaginated,
      givenBasePath,
      limit,
      cursor
    );

    expect(actual).toEqual({
      data: givenObjectsPaginated.map((obj) =>
        expect.objectContaining({
          id: obj.id,
          UUID: obj.UUID,
          UUIDHistory: obj.UUIDHistory,
          code: obj.code,
          occupationGroupCode: obj.occupationGroupCode,
          preferredLabel: obj.preferredLabel,
          originUri: obj.originUri,
          altLabels: obj.altLabels,
          definition: obj.definition,
          description: obj.description,
          regulatedProfessionNote: obj.regulatedProfessionNote,
          scopeNote: obj.scopeNote,
          occupationType: obj.occupationType,
          modelId: obj.modelId,
          isLocalized: obj.isLocalized,
          parent: null,
          requiresSkills: expect.arrayContaining([]),
          children: expect.arrayContaining([]),
          path: `${givenBasePath}${Routes.MODELS_ROUTE}/${obj.modelId}/occupations/${obj.id}`,
          tabiyaPath: `${givenBasePath}${Routes.MODELS_ROUTE}/${obj.modelId}/occupations/${obj.UUID}`,
          createdAt: obj.createdAt.toISOString(),
          updatedAt: obj.updatedAt.toISOString(),
        })
      ),
      nextCursor: cursor,
      limit: limit,
    });
  });
});

describe("test the transformation of parent and children objectType fields in IOccupationResponse", () => {
  test("should transform parent = ESCOOccupation", () => {
    const givenObject = getIOccupationMockDataWithParentOccupation();
    const basePath = "https://some/root/path";
    const actual = transform(givenObject, basePath);

    expect(actual.parent!.objectType).toBe(OccupationAPISpecs.Enums.Relations.Parent.ObjectTypes.ESCOOccupation);
  });
  test("should transform parent = ISCOGroup", () => {
    const givenObject = getIOccupationMockDataWithParentOccupationGroup();
    const basePath = "https://some/root/path";
    const actual = transform(givenObject, basePath);

    expect(actual.parent!.objectType).toBe(OccupationAPISpecs.Enums.Relations.Parent.ObjectTypes.ISCOGroup);
  });

  test("should transform parent with groupType = ISCOGroup", () => {
    const parent = {
      UUID: randomUUID(),
      code: getRandomString(5),
      id: getMockStringId(3),
      preferredLabel: getRandomString(15),
      groupType: ObjectTypes.ISCOGroup,
    };
    const givenObject: IOccupation = {
      ...getIOccupationMockData(),
      parent: parent as unknown as IOccupationGroupReference,
    };

    const basePath = "https://some/root/path";
    const actual = transform(givenObject, basePath);

    expect(actual.parent!.objectType).toBe(OccupationAPISpecs.Enums.Relations.Parent.ObjectTypes.ISCOGroup);
  });

  test("should transform children with occupationType = ESCOOccupation", () => {
    const givenObject = getIOccupationMockDataWithOccupationChildren();
    const basePath = "https://some/root/path";
    const actual = transform(givenObject, basePath);

    expect(actual.children[0].objectType).toBe(OccupationAPISpecs.Enums.Relations.Children.ObjectTypes.ESCOOccupation);
  });

  test("should transform children with occupationType = LocalOccupation", () => {
    const child: IOccupationReference = {
      UUID: randomUUID(),
      code: getRandomString(5),
      id: getMockStringId(1),
      preferredLabel: getRandomString(15),
      occupationType: ObjectTypes.LocalOccupation,
      occupationGroupCode: getRandomString(5),
      isLocalized: false,
    };
    const givenObject: IOccupation = {
      ...getIOccupationMockData(),
      children: [child],
    };

    const basePath = "https://some/root/path";
    const actual = transform(givenObject, basePath);

    expect(actual.children[0].objectType).toBe(OccupationAPISpecs.Enums.Relations.Children.ObjectTypes.LocalOccupation);
  });
  test("should transform children with groupType = ISCOGroup", () => {
    // GIVEN an occupation with a child that is an ISCOGroup
    const groupChild = {
      UUID: randomUUID(),
      code: getRandomString(5),
      id: getMockStringId(1),
      preferredLabel: getRandomString(15),
      groupType: ObjectTypes.ISCOGroup,
    };

    const givenObject: IOccupation = {
      ...getIOccupationMockData(),
      children: [groupChild as unknown as IOccupationGroupReference],
    };

    const basePath = "https://some/root/path";

    // WHEN the transformation function is called
    const actual = transform(givenObject, basePath);

    // THEN expect the child objectType to be ISCOGroup
    expect(actual.children[0].objectType).toBe(OccupationAPISpecs.Enums.Relations.Children.ObjectTypes.ISCOGroup);
  });

  test("should transform children with objectType = ISCOGroup", () => {
    // GIVEN an occupation with a child that is an ISCOGroup (using objectType)
    const groupChild = {
      UUID: randomUUID(),
      code: getRandomString(5),
      id: getMockStringId(1),
      preferredLabel: getRandomString(15),
      objectType: ObjectTypes.ISCOGroup,
    };

    const givenObject: IOccupation = {
      ...getIOccupationMockData(),
      children: [groupChild as unknown as IOccupationGroupReference],
    };

    const basePath = "https://some/root/path";

    // WHEN the transformation function is called
    const actual = transform(givenObject, basePath);

    // THEN expect the child objectType to be ISCOGroup
    expect(actual.children[0].objectType).toBe(OccupationAPISpecs.Enums.Relations.Children.ObjectTypes.ISCOGroup);
  });

  test("should transform children with groupType = LocalGroup", () => {
    // GIVEN an occupation with a child that is a LocalGroup
    const groupChild = {
      UUID: randomUUID(),
      code: getRandomString(5),
      id: getMockStringId(1),
      preferredLabel: getRandomString(15),
      groupType: ObjectTypes.LocalGroup,
    };

    const givenObject: IOccupation = {
      ...getIOccupationMockData(),
      children: [groupChild as unknown as IOccupationGroupReference],
    };

    const basePath = "https://some/root/path";

    // WHEN the transformation function is called
    const actual = transform(givenObject, basePath);

    // THEN expect the child objectType to be LocalGroup
    expect(actual.children[0].objectType).toBe(OccupationAPISpecs.Enums.Relations.Children.ObjectTypes.LocalGroup);
  });

  test("should transform parent with objectType = LocalGroup", () => {
    const parent = {
      UUID: randomUUID(),
      code: getRandomString(5),
      id: getMockStringId(3),
      preferredLabel: getRandomString(15),
      objectType: ObjectTypes.LocalGroup,
      occupationGroupCode: getRandomString(5),
      isLocalized: false,
    } as IOccupationReference & { objectType: ObjectTypes.LocalGroup };
    const givenObject: IOccupation = {
      ...getIOccupationMockData(),
      parent: parent,
    };

    const basePath = "https://some/root/path";
    const actual = transform(givenObject, basePath);

    expect(actual.parent!.objectType).toBe(OccupationAPISpecs.Enums.Relations.Parent.ObjectTypes.LocalGroup);
  });

  test("should transform parent with occupationType = LocalOccupation", () => {
    const parent = {
      UUID: randomUUID(),
      code: getRandomString(5),
      id: getMockStringId(4),
      preferredLabel: getRandomString(15),
      occupationType: ObjectTypes.LocalOccupation,
      occupationGroupCode: getRandomString(5),
      isLocalized: false,
    } as IOccupationReference & { occupationType: ObjectTypes.LocalOccupation };
    const givenObject: IOccupation = {
      ...getIOccupationMockData(),
      parent: parent,
    };

    const basePath = "https://some/root/path";
    const actual = transform(givenObject, basePath);

    expect(actual.parent!.objectType).toBe(OccupationAPISpecs.Enums.Relations.Parent.ObjectTypes.LocalOccupation);
  });
});

describe("test the transformation of occupationType field of IOccupation -> IOccupationResponse", () => {
  test("should handle occupationType = ESCOOccupation", () => {
    const givenObject = getIOccupationMockData();
    givenObject.occupationType = ObjectTypes.ESCOOccupation;

    const basePath = "https://some/root/path";
    const actual = transform(givenObject, basePath);

    expect(actual.occupationType).toBe(OccupationAPISpecs.Enums.OccupationType.ESCOOccupation);
  });

  test("should handle occupationType = LocalOccupation", () => {
    const givenObject = getIOccupationMockData();
    givenObject.occupationType = ObjectTypes.LocalOccupation;

    const basePath = "https://some/root/path";
    const actual = transform(givenObject, basePath);

    expect(actual.occupationType).toBe(OccupationAPISpecs.Enums.OccupationType.LocalOccupation);
  });
});

describe("test the transformation of parent and children with null properties", () => {
  test("should handle parent with null properties", () => {
    // GIVEN an occupation with parent that has null properties
    const givenObject = getIOccupationMockData();
    givenObject.parent = {
      id: null,
      UUID: null,
      code: null,
      preferredLabel: null,
      occupationType: ObjectTypes.ESCOOccupation,
      occupationGroupCode: getRandomString(5),
      isLocalized: false,
    } as unknown as IOccupationReference;
    const basePath = "https://some/root/path";

    // WHEN the transformation function is called
    const actual = transform(givenObject, basePath);

    // THEN expect parent properties to be null (no fallback values)
    expect(actual.parent!.id).toBeNull();
    expect(actual.parent!.UUID).toBeNull();
    expect(actual.parent!.code).toBeNull();
    expect(actual.parent!.preferredLabel).toBeNull();
  });

  test("should handle parent with valid id but null other properties", () => {
    // GIVEN an occupation with parent that has valid id but null other properties
    const givenObject = getIOccupationMockData();
    givenObject.parent = {
      id: getMockStringId(5),
      UUID: null,
      code: null,
      preferredLabel: null,
      occupationType: ObjectTypes.ESCOOccupation,
      occupationGroupCode: getRandomString(5),
      isLocalized: false,
    } as unknown as IOccupationReference;
    const basePath = "https://some/root/path";

    // WHEN the transformation function is called
    const actual = transform(givenObject, basePath);

    // THEN expect parent properties to be null (no fallback values)
    expect(actual.parent!.id).toBe(getMockStringId(5));
    expect(actual.parent!.UUID).toBeNull();
    expect(actual.parent!.code).toBeNull();
    expect(actual.parent!.preferredLabel).toBeNull();
  });

  test("should handle children with null properties", () => {
    // GIVEN an occupation with children that have null properties
    const givenObject = getIOccupationMockData();
    givenObject.children = [
      {
        id: null,
        UUID: null,
        code: null,
        preferredLabel: null,
        occupationType: ObjectTypes.ESCOOccupation,
        occupationGroupCode: getRandomString(5),
        isLocalized: false,
      } as unknown as IOccupationReference,
    ];
    const basePath = "https://some/root/path";

    // WHEN the transformation function is called
    const actual = transform(givenObject, basePath);

    // THEN expect children properties to be null (no fallback values)
    expect(actual.children[0].id).toBeNull();
    expect(actual.children[0].UUID).toBeNull();
    expect(actual.children[0].code).toBeNull();
    expect(actual.children[0].preferredLabel).toBeNull();
  });

  test("should handle children with null properties for group children", () => {
    // GIVEN an occupation with children that have null properties (ISCOGroup type)
    const givenObject = getIOccupationMockData();
    givenObject.children = [
      {
        id: null,
        UUID: null,
        code: null,
        preferredLabel: null,
        occupationType: ObjectTypes.LocalOccupation,
        objectType: ObjectTypes.LocalOccupation,
      } as unknown as IOccupationReference,
    ];
    const basePath = "https://some/root/path";

    // WHEN the transformation function is called
    const actual = transform(givenObject, basePath);

    // THEN expect children properties to be null (no fallback values)
    expect(actual.children[0].id).toBeNull();
    expect(actual.children[0].UUID).toBeNull();
    expect(actual.children[0].code).toBeNull();
    expect(actual.children[0].preferredLabel).toBeNull();
  });
});

describe("test the transformation of requiresSkills field", () => {
  test("should transform requiresSkills with populated skill references", () => {
    // GIVEN an occupation with requiresSkills containing populated skill references
    const givenObject = getIOccupationMockData();
    const basePath = "https://some/root/path";

    // WHEN the transformation function is called
    const actual = transform(givenObject, basePath);

    // THEN expect requiresSkills to be mapped correctly
    expect(actual.requiresSkills).toEqual(
      givenObject.requiresSkills.map((skillRef) => ({
        id: skillRef.id,
        UUID: skillRef.UUID,
        preferredLabel: skillRef.preferredLabel,
        isLocalized: skillRef.isLocalized,
        objectType: OccupationAPISpecs.Enums.Relations.RequiredSkills.ObjectTypes.Skill,
        relationType: skillRef.relationType,
        signallingValue: skillRef.signallingValue,
        signallingValueLabel: skillRef.signallingValueLabel,
      }))
    );
  });

  test("should transform requiresSkills with null id in skill reference", () => {
    // GIVEN an occupation with requiresSkills where skillRef.id is null
    const givenObject = getIOccupationMockData();
    // @ts-ignore
    givenObject.requiresSkills[0].id = null;
    const basePath = "https://some/root/path";

    // WHEN the transformation function is called
    const actual = transform(givenObject, basePath);

    // THEN expect id to be null (no fallback to empty string)
    expect(actual.requiresSkills[0].id).toBe(null);
  });

  test("should transform requiresSkills with undefined UUID in skill reference", () => {
    // GIVEN an occupation with requiresSkills where skillRef.UUID is undefined
    const givenObject = getIOccupationMockData();
    // @ts-ignore
    givenObject.requiresSkills[0].UUID = undefined;
    const basePath = "https://some/root/path";

    // WHEN the transformation function is called
    const actual = transform(givenObject, basePath);

    // THEN expect UUID to be undefined (no fallback to empty string)
    expect(actual.requiresSkills[0].UUID).toBe(undefined);
  });

  test("should transform requiresSkills with null preferredLabel in skill reference", () => {
    // GIVEN an occupation with requiresSkills where skillRef.preferredLabel is null
    const givenObject = getIOccupationMockData();
    // @ts-ignore
    givenObject.requiresSkills[0].preferredLabel = null;
    const basePath = "https://some/root/path";

    // WHEN the transformation function is called
    const actual = transform(givenObject, basePath);

    // THEN expect preferredLabel to be null (no fallback to empty string)
    expect(actual.requiresSkills[0].preferredLabel).toBe(null);
  });

  test("should transform requiresSkills as empty array when requiresSkills is empty", () => {
    // GIVEN an occupation with empty requiresSkills
    const givenObject = getIOccupationMockData();
    givenObject.requiresSkills = [];
    const basePath = "https://some/root/path";

    // WHEN the transformation function is called
    const actual = transform(givenObject, basePath);

    // THEN expect requiresSkills to be empty array
    expect(actual.requiresSkills).toEqual([]);
  });

  test("should handle requiresSkills with null signallingValue and signallingValueLabel", () => {
    // GIVEN an occupation with requiresSkills that have null signallingValue and signallingValueLabel
    const givenObject = getIOccupationMockData();
    givenObject.requiresSkills = [
      {
        id: getMockStringId(6),
        UUID: randomUUID(),
        preferredLabel: getRandomString(15),
        isLocalized: false,
        objectType: ObjectTypes.Skill,
        relationType: OccupationToSkillRelationType.ESSENTIAL,
        signallingValue: null,
        signallingValueLabel: undefined,
      } as unknown as (typeof givenObject.requiresSkills)[0],
    ];
    const basePath = "https://some/root/path";

    // WHEN the transformation function is called
    const actual = transform(givenObject, basePath);

    // THEN expect signallingValue to be null and signallingValueLabel to be undefined (no fallback)
    // @ts-ignore
    expect(actual.requiresSkills[0].signallingValue).toBe(null);
    // @ts-ignore
    expect(actual.requiresSkills[0].signallingValueLabel).toBe(null);
  });

  test("should handle requiresSkills with NONE relation type", () => {
    // GIVEN an occupation with requiresSkills that have NONE relation type
    const givenObject = getIOccupationMockData();
    givenObject.requiresSkills = [
      {
        id: getMockStringId(7),
        UUID: randomUUID(),
        preferredLabel: getRandomString(15),
        isLocalized: false,
        objectType: ObjectTypes.Skill,
        relationType: OccupationToSkillRelationType.NONE,
        signallingValue: 50,
        signallingValueLabel: "Medium",
      } as unknown as (typeof givenObject.requiresSkills)[0],
    ];
    const basePath = "https://some/root/path";

    // WHEN the transformation function is called
    const actual = transform(givenObject, basePath);

    // THEN expect relationType to be NONE
    expect(actual.requiresSkills[0].relationType).toBe(null);
  });

  test("should handle requiresSkills with OPTIONAL relation type", () => {
    // GIVEN an occupation with requiresSkills that have OPTIONAL relation type
    const givenObject = getIOccupationMockData();
    givenObject.requiresSkills = [
      {
        id: getMockStringId(9),
        UUID: randomUUID(),
        preferredLabel: getRandomString(15),
        isLocalized: false,
        objectType: ObjectTypes.Skill,
        relationType: OccupationToSkillRelationType.OPTIONAL,
        signallingValue: 75,
        signallingValueLabel: "High",
      } as unknown as (typeof givenObject.requiresSkills)[0],
    ];
    const basePath = "https://some/root/path";

    // WHEN the transformation function is called
    const actual = transform(givenObject, basePath);

    // THEN expect relationType to be OPTIONAL
    expect(actual.requiresSkills[0].relationType).toBe(OccupationAPISpecs.Enums.OccupationToSkillRelationType.OPTIONAL);
  });

  test("should handle requiresSkills with unknown relation type (default case)", () => {
    // GIVEN an occupation with requiresSkills that have an unknown relation type
    const givenObject = getIOccupationMockData();
    const invalidRelationType = 999 as unknown as OccupationToSkillRelationType;
    givenObject.requiresSkills = [
      {
        id: getMockStringId(8),
        UUID: randomUUID(),
        preferredLabel: getRandomString(15),
        isLocalized: false,
        objectType: ObjectTypes.Skill,
        relationType: invalidRelationType, // Invalid relation type to trigger default case
        signallingValue: 50,
        signallingValueLabel: "Medium",
      } as unknown as (typeof givenObject.requiresSkills)[0],
    ];
    const basePath = "https://some/root/path";

    // WHEN the transformation function is called
    const actual = transform(givenObject, basePath);

    // THEN expect relationType to be NONE (default case)
    expect(actual.requiresSkills[0].relationType).toBe(null);
  });
});

describe("test the transformation of paginated results", () => {
  test("should handle transformPaginated with null cursor", () => {
    // GIVEN occupations and null cursor
    const givenObjects: IOccupation[] = [getIOccupationMockData()];
    const givenBasePath = "https://some/root/path";
    const limit = 2;
    const cursor = null;

    // WHEN the transformation function is called
    const actual = transformPaginated(givenObjects, givenBasePath, limit, cursor);

    // THEN expect nextCursor to be null
    expect(actual.nextCursor).toBe(null);
  });
});

describe("test the transformation of originUUID field", () => {
  test("should set originUUID to the last UUID in UUIDHistory when UUIDHistory has items", () => {
    // GIVEN an occupation group with UUIDHistory containing multiple UUIDs
    const givenObject = getIOccupationMockData();
    const firstUUID = randomUUID();
    const secondUUID = randomUUID();
    const thirdUUID = randomUUID();
    givenObject.UUIDHistory = [firstUUID, secondUUID, thirdUUID];

    const basePath = "https://some/root/path";

    // WHEN the transformation function is called
    const actual = transform(givenObject, basePath);

    // THEN expect originUUID to be the last UUID in the history
    expect(actual.originUUID).toBe(thirdUUID);
  });

  test("should set originUUID to empty string when UUIDHistory is empty", () => {
    // GIVEN an occupation group with empty UUIDHistory
    const givenObject = getIOccupationMockData();
    givenObject.UUIDHistory = [];

    const basePath = "https://some/root/path";

    // WHEN the transformation function is called
    const actual = transform(givenObject, basePath);

    // THEN expect originUUID to be empty string
    expect(actual.originUUID).toBe("");
  });

  test("should set originUUID to the single UUID when UUIDHistory has only one item", () => {
    // GIVEN an occupation group with UUIDHistory containing only one UUID
    const givenObject = getIOccupationMockData();
    const singleUUID = randomUUID();
    givenObject.UUIDHistory = [singleUUID];

    const basePath = "https://some/root/path";

    // WHEN the transformation function is called
    const actual = transform(givenObject, basePath);

    // THEN expect originUUID to be that single UUID
    expect(actual.originUUID).toBe(singleUUID);
  });
});

describe("transformOccupationSkill", () => {
  test("should transform skill data with relationship metadata", () => {
    // GIVEN some skill data with relationship metadata
    const givenSkillData = {
      id: getMockStringId(1),
      UUID: randomUUID(),
      preferredLabel: "Skill 1",
      relationType: OccupationToSkillRelationType.ESSENTIAL,
      signallingValue: 1,
      signallingValueLabel: SignallingValueLabel.NONE,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ISkillWithRelation;
    const givenBasePath = "https://some/root/path";

    // AND the skill transformation is mocked
    const mockTransformedSkill = {
      id: givenSkillData.id,
      UUID: givenSkillData.UUID,
      preferredLabel: givenSkillData.preferredLabel,
    } as SkillAPISpecs.Types.Response.ISkill;
    const skillTransformSpy = jest.spyOn(skillTransformModule, "transform").mockReturnValue(mockTransformedSkill);

    // WHEN the transformation function is called
    const actual = transformOccupationSkill(givenSkillData, givenBasePath);

    // THEN expect the result to contain the transformed skill and relationship metadata
    expect(actual).toEqual({
      ...mockTransformedSkill,
      relationType: OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL,
      signallingValue: givenSkillData.signallingValue,
      signallingValueLabel: null,
    });
    expect(skillTransformSpy).toHaveBeenCalledWith(givenSkillData, givenBasePath);
  });
});

describe("transformPaginatedSkills", () => {
  test("should transform paginated skill data correctly", () => {
    // GIVEN some skill data
    const givenData = [
      {
        id: getMockStringId(1),
        relationType: OccupationToSkillRelationType.ESSENTIAL,
        signallingValueLabel: SignallingValueLabel.NONE,
      },
      {
        id: getMockStringId(2),
        relationType: OccupationToSkillRelationType.OPTIONAL,
        signallingValueLabel: SignallingValueLabel.NONE,
      },
    ] as ISkillWithRelation[];
    const givenBasePath = "https://some/root/path";
    const givenLimit = 10;
    const givenCursor = "some-cursor";

    // AND the skill transformation is mocked
    jest
      .spyOn(skillTransformModule, "transform")
      .mockImplementation((data) => ({ id: data.id }) as SkillAPISpecs.Types.Response.ISkill);

    // WHEN the transformation function is called
    const actual = transformPaginatedSkills(givenData, givenBasePath, givenLimit, givenCursor);

    // THEN expect the result to contain transformed skills and pagination info
    expect(actual).toEqual({
      data: [
        expect.objectContaining({
          id: givenData[0].id,
          relationType: OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL,
        }),
        expect.objectContaining({
          id: givenData[1].id,
          relationType: OccupationAPISpecs.Enums.OccupationToSkillRelationType.OPTIONAL,
        }),
      ],
      limit: givenLimit,
      nextCursor: givenCursor,
    });
  });
});
