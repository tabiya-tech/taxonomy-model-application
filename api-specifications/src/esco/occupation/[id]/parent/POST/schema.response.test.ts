import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import { CaseType, assertCaseForProperty, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import { getMockId } from "_test_utilities/mockMongoId";
import { randomUUID } from "crypto";
import { getTestString } from "../../../../../_test_utilities/specialCharacters";
import OccupationAPISpecs from "../../../index";
import OccupationEnums from "../../../_shared/enums";
import OccupationGroupEnums from "../../../../occupationGroup/_shared/enums";
import {
  getTestISCOGroupCode,
  getTestESCOOccupationCode,
  getTestLocalOccupationCode,
} from "../../../../_test_utilities/testUtils";

describe("OccupationAPISpecs.Occupation.Parent.POST.Schemas.Response.Payload schema", () => {
  testValidSchema(
    "OccupationAPISpecs.Occupation.Parent.POST.Schemas.Response.Payload",
    OccupationAPISpecs.Occupation.Parent.POST.Schemas.Response.Payload
  );
});

describe("Test objects against the OccupationAPISpecs.Occupation.Parent.POST.Schemas.Response.Payload schema", () => {
  const givenParent = {
    id: getMockId(1),
    UUID: randomUUID(),
    code: getTestISCOGroupCode(),
    occupationGroupCode: getTestISCOGroupCode(),
    preferredLabel: getTestString(20),
    objectType: OccupationEnums.Relations.Parent.ObjectTypes.ISCOGroup,
  };

  const givenChild = {
    id: getMockId(2),
    UUID: randomUUID(),
    code: getTestLocalOccupationCode(),
    preferredLabel: getTestString(20),
    objectType: OccupationEnums.Relations.Children.ObjectTypes.LocalOccupation,
  };

  const givenSkill = {
    id: getMockId(3),
    UUID: randomUUID(),
    preferredLabel: getTestString(20),
    isLocalized: true,
    objectType: OccupationEnums.Relations.RequiredSkills.ObjectTypes.Skill,
    relationType: OccupationEnums.OccupationToSkillRelationType.ESSENTIAL,
    signallingValue: null,
    signallingValueLabel: null,
  };

  const validOccupationResponse = {
    id: getMockId(4),
    UUID: randomUUID(),
    UUIDHistory: [randomUUID()],
    originUUID: randomUUID(),
    code: getTestESCOOccupationCode(),
    path: "https://path/to/tabiya",
    tabiyaPath: "https://path/to/tabiya",
    originUri: "https://foo/bar",
    occupationGroupCode: getTestISCOGroupCode(),
    description: getTestString(50),
    preferredLabel: getTestString(20),
    altLabels: [getTestString(15)],
    definition: getTestString(50),
    regulatedProfessionNote: getTestString(30),
    scopeNote: getTestString(30),
    occupationType: OccupationEnums.OccupationType.ESCOOccupation,
    modelId: getMockId(5),
    isLocalized: true,
    parent: givenParent,
    children: [givenChild],
    requiresSkills: [givenSkill],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const validOccupationGroupResponse = {
    id: getMockId(6),
    UUID: randomUUID(),
    originUUID: randomUUID(),
    UUIDHistory: [randomUUID()],
    path: "https://path/to/tabiya",
    tabiyaPath: "https://path/to/tabiya",
    originUri: "https://foo/bar",
    code: getTestISCOGroupCode(),
    description: getTestString(50),
    preferredLabel: getTestString(20),
    altLabels: [getTestString(15)],
    parent: null,
    children: [],
    groupType: OccupationGroupEnums.ObjectTypes.ISCOGroup,
    modelId: getMockId(7),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  testSchemaWithValidObject(
    "valid occupation response",
    OccupationAPISpecs.Occupation.Parent.POST.Schemas.Response.Payload,
    validOccupationResponse
  );

  testSchemaWithValidObject(
    "valid occupation group response",
    OccupationAPISpecs.Occupation.Parent.POST.Schemas.Response.Payload,
    validOccupationGroupResponse
  );

  test("null response", () => {
    assertCaseForProperty(
      "",
      null,
      OccupationAPISpecs.Occupation.Parent.POST.Schemas.Response.Payload,
      CaseType.Success,
      undefined
    );
  });

  testSchemaWithAdditionalProperties(
    "occupation payload with additional properties",
    OccupationAPISpecs.Occupation.Parent.POST.Schemas.Response.Payload,
    {
      ...validOccupationResponse,
      extraProperty: "extra test property (not defined in schema) for testing additionalProperties",
    }
  );

  testSchemaWithAdditionalProperties(
    "occupation group payload with additional properties",
    OccupationAPISpecs.Occupation.Parent.POST.Schemas.Response.Payload,
    {
      ...validOccupationGroupResponse,
      extraProperty: "extra test property (not defined in schema) for testing additionalProperties",
    }
  );

  describe("Invalid objects should not match anyOf", () => {
    test("empty object should fail all branches", () => {
      assertCaseForProperty(
        "",
        {},
        OccupationAPISpecs.Occupation.Parent.POST.Schemas.Response.Payload,
        CaseType.Failure,
        constructSchemaError("", "anyOf", "must match a schema in anyOf")
      );
    });

    test("string should fail all branches", () => {
      assertCaseForProperty(
        "",
        "invalid",
        OccupationAPISpecs.Occupation.Parent.POST.Schemas.Response.Payload,
        CaseType.Failure,
        constructSchemaError("", "anyOf", "must match a schema in anyOf")
      );
    });

    test("number should fail all branches", () => {
      assertCaseForProperty(
        "",
        123,
        OccupationAPISpecs.Occupation.Parent.POST.Schemas.Response.Payload,
        CaseType.Failure,
        constructSchemaError("", "anyOf", "must match a schema in anyOf")
      );
    });
  });

  describe("Individual field validation on occupation response", () => {
    describe("Test validation of 'id'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, constructSchemaError("", "anyOf", "must match a schema in anyOf")],
        [CaseType.Failure, "null", null, constructSchemaError("", "anyOf", "must match a schema in anyOf")],
        [CaseType.Failure, "only whitespace", "   ", constructSchemaError("", "anyOf", "must match a schema in anyOf")],
        [CaseType.Failure, "random string", "foo", constructSchemaError("", "anyOf", "must match a schema in anyOf")],
      ])("%s Validate 'id' when it is %s", (caseType, _description, givenValue, failureMessage) => {
        const givenObject = {
          ...validOccupationResponse,
          id: givenValue,
        };
        assertCaseForProperty(
          "id",
          givenObject,
          OccupationAPISpecs.Occupation.Parent.POST.Schemas.Response.Payload,
          caseType,
          failureMessage
        );
      });
    });

    describe("Test validation of 'occupationType'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, constructSchemaError("", "anyOf", "must match a schema in anyOf")],
        [CaseType.Failure, "null", null, constructSchemaError("", "anyOf", "must match a schema in anyOf")],
        [
          CaseType.Failure,
          "invalid value",
          "invalid",
          constructSchemaError("", "anyOf", "must match a schema in anyOf"),
        ],
      ])("%s Validate 'occupationType' when it is %s", (caseType, _description, givenValue, failureMessage) => {
        const givenObject = {
          ...validOccupationResponse,
          occupationType: givenValue,
        };
        assertCaseForProperty(
          "occupationType",
          givenObject,
          OccupationAPISpecs.Occupation.Parent.POST.Schemas.Response.Payload,
          caseType,
          failureMessage
        );
      });
    });

    describe("Test validation of 'code'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, constructSchemaError("", "anyOf", "must match a schema in anyOf")],
        [CaseType.Failure, "null", null, constructSchemaError("", "anyOf", "must match a schema in anyOf")],
        [CaseType.Failure, "empty string", "", constructSchemaError("", "anyOf", "must match a schema in anyOf")],
      ])("%s Validate 'code' when it is %s", (caseType, _description, givenValue, failureMessage) => {
        const givenObject = {
          ...validOccupationResponse,
          code: givenValue,
        };
        assertCaseForProperty(
          "code",
          givenObject,
          OccupationAPISpecs.Occupation.Parent.POST.Schemas.Response.Payload,
          caseType,
          failureMessage
        );
      });
    });

    describe("Test validation of 'isLocalized'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, constructSchemaError("", "anyOf", "must match a schema in anyOf")],
        [CaseType.Failure, "null", null, constructSchemaError("", "anyOf", "must match a schema in anyOf")],
        [CaseType.Failure, "string", "true", constructSchemaError("", "anyOf", "must match a schema in anyOf")],
      ])("%s Validate 'isLocalized' when it is %s", (caseType, _description, givenValue, failureMessage) => {
        const givenObject = {
          ...validOccupationResponse,
          isLocalized: givenValue,
        };
        assertCaseForProperty(
          "isLocalized",
          givenObject,
          OccupationAPISpecs.Occupation.Parent.POST.Schemas.Response.Payload,
          caseType,
          failureMessage
        );
      });
    });
  });

  describe("Individual field validation on occupation group response", () => {
    describe("Test validation of 'groupType'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, constructSchemaError("", "anyOf", "must match a schema in anyOf")],
        [CaseType.Failure, "null", null, constructSchemaError("", "anyOf", "must match a schema in anyOf")],
        [
          CaseType.Failure,
          "invalid value",
          "invalid",
          constructSchemaError("", "anyOf", "must match a schema in anyOf"),
        ],
      ])("%s Validate 'groupType' when it is %s", (caseType, _description, givenValue, failureMessage) => {
        const givenObject = {
          ...validOccupationGroupResponse,
          groupType: givenValue,
        };
        assertCaseForProperty(
          "groupType",
          givenObject,
          OccupationAPISpecs.Occupation.Parent.POST.Schemas.Response.Payload,
          caseType,
          failureMessage
        );
      });
    });

    describe("Test validation of 'id'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, constructSchemaError("", "anyOf", "must match a schema in anyOf")],
        [CaseType.Failure, "null", null, constructSchemaError("", "anyOf", "must match a schema in anyOf")],
        [CaseType.Failure, "random string", "foo", constructSchemaError("", "anyOf", "must match a schema in anyOf")],
      ])("%s Validate 'id' when it is %s", (caseType, _description, givenValue, failureMessage) => {
        const givenObject = {
          ...validOccupationGroupResponse,
          id: givenValue,
        };
        assertCaseForProperty(
          "id",
          givenObject,
          OccupationAPISpecs.Occupation.Parent.POST.Schemas.Response.Payload,
          caseType,
          failureMessage
        );
      });
    });
  });
});
