import { randomUUID } from "crypto";
import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import { CaseType, assertCaseForProperty, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import { getMockId } from "_test_utilities/mockMongoId";
import { getTestString } from "_test_utilities/specialCharacters";
import { getTestSkillGroupCode } from "../../../../_test_utilities/testUtils";
import SkillAPISpecs from "../../../index";
import SkillEnums from "../../../_shared/enums";
import SkillGroupEnums from "../../../../skillGroup/_shared/enums";

describe("SkillAPISpecs.Skill.Parents.PATCH.Schemas.Response.Payload schema", () => {
  testValidSchema(
    "SkillAPISpecs.Skill.Parents.PATCH.Schemas.Response.Payload",
    SkillAPISpecs.Skill.Parents.PATCH.Schemas.Response.Payload
  );
});

describe("Test objects against the SkillAPISpecs.Skill.Parents.PATCH.Schemas.Response.Payload schema", () => {
  const givenValidSkillResponse = {
    id: getMockId(1),
    UUID: randomUUID(),
    UUIDHistory: [randomUUID()],
    originUUID: randomUUID(),
    path: "https://path/to/tabiya",
    tabiyaPath: "https://path/to/tabiya",
    preferredLabel: getTestString(20),
    originUri: "https://foo/bar",
    altLabels: [getTestString(15)],
    definition: getTestString(50),
    description: getTestString(50),
    scopeNote: getTestString(30),
    skillType: SkillEnums.SkillType.SkillCompetence,
    reuseLevel: SkillEnums.ReuseLevel.CrossSector,
    isLocalized: true,
    modelId: getMockId(2),
    parents: [],
    children: [],
    requiresSkills: [],
    requiredBySkills: [],
    requiredByOccupations: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const givenValidSkillGroupResponse = {
    id: getMockId(3),
    UUID: randomUUID(),
    UUIDHistory: [randomUUID()],
    originUUID: randomUUID(),
    path: "https://path/to/tabiya",
    tabiyaPath: "https://path/to/tabiya",
    originUri: "https://foo/bar",
    code: getTestSkillGroupCode(),
    description: getTestString(50),
    preferredLabel: getTestString(20),
    parents: [
      {
        id: getMockId(4),
        UUID: randomUUID(),
        code: getTestSkillGroupCode(),
        preferredLabel: getTestString(20),
        objectType: SkillGroupEnums.Relations.Parents.ObjectTypes.SkillGroup,
      },
    ],
    children: [],
    altLabels: [],
    modelId: getMockId(5),
    scopeNote: getTestString(30),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  testSchemaWithValidObject(
    "valid skill response",
    SkillAPISpecs.Skill.Parents.PATCH.Schemas.Response.Payload,
    givenValidSkillResponse
  );

  testSchemaWithValidObject(
    "valid skill group response",
    SkillAPISpecs.Skill.Parents.PATCH.Schemas.Response.Payload,
    givenValidSkillGroupResponse
  );

  test("null response", () => {
    assertCaseForProperty(
      "",
      null,
      SkillAPISpecs.Skill.Parents.PATCH.Schemas.Response.Payload,
      CaseType.Success,
      undefined
    );
  });

  testSchemaWithAdditionalProperties(
    "skill payload with additional properties",
    SkillAPISpecs.Skill.Parents.PATCH.Schemas.Response.Payload,
    {
      ...givenValidSkillResponse,
      extraProperty: "extra test property (not defined in schema) for testing additionalProperties",
    }
  );

  testSchemaWithAdditionalProperties(
    "skill group payload with additional properties",
    SkillAPISpecs.Skill.Parents.PATCH.Schemas.Response.Payload,
    {
      ...givenValidSkillGroupResponse,
      extraProperty: "extra test property (not defined in schema) for testing additionalProperties",
    }
  );

  describe("Invalid objects should not match anyOf", () => {
    test("empty object should fail all branches", () => {
      assertCaseForProperty(
        "",
        {},
        SkillAPISpecs.Skill.Parents.PATCH.Schemas.Response.Payload,
        CaseType.Failure,
        constructSchemaError("", "anyOf", "must match a schema in anyOf")
      );
    });

    test("string should fail all branches", () => {
      assertCaseForProperty(
        "",
        "invalid",
        SkillAPISpecs.Skill.Parents.PATCH.Schemas.Response.Payload,
        CaseType.Failure,
        constructSchemaError("", "anyOf", "must match a schema in anyOf")
      );
    });

    test("number should fail all branches", () => {
      assertCaseForProperty(
        "",
        123,
        SkillAPISpecs.Skill.Parents.PATCH.Schemas.Response.Payload,
        CaseType.Failure,
        constructSchemaError("", "anyOf", "must match a schema in anyOf")
      );
    });
  });
});
