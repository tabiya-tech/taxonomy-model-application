import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import { CaseType, assertCaseForProperty } from "_test_utilities/assertCaseForProperty";
import { getTestString } from "_test_utilities/specialCharacters";
import { getMockId } from "_test_utilities/mockMongoId";
import { randomUUID } from "crypto";
import SkillConstants from "../../constants";
import SkillGroupConstants from "../../../skillGroup/constants";
import SkillAPISpecs from "../../index";
import SkillGroupAPISpecs from "../../../skillGroup/index";
import { getTestSkillGroupCode } from "../../../_test_utilities/testUtils";
import SkillEnums from "../../enums";

describe("Test Skill Parent Response Schema Validity", () => {
  // WHEN the SkillAPISpecs.Schemas.GET.Parent.Response.Payload schema
  // THEN expect the schema to be valid
  testValidSchema(
    "SkillAPISpecs.Schemas.GET.Parent.Response.Payload",
    SkillAPISpecs.Schemas.GET.Parent.Response.Payload
  );
});

describe("Test objects against the SkillAPISpecs.Schemas.GET.Parent.Response.Payload schema", () => {
  const givenValidSkillGroupParent = {
    id: getMockId(1),
    UUID: randomUUID(),
    originUUID: randomUUID(),
    UUIDHistory: [randomUUID()],
    path: "https://path/to/tabiya",
    tabiyaPath: "https://path/to/tabiya",
    originUri: "https://foo/bar",
    code: getTestSkillGroupCode(),
    preferredLabel: getTestString(SkillGroupConstants.PREFERRED_LABEL_MAX_LENGTH),
    altLabels: [getTestString(SkillGroupConstants.ALT_LABEL_MAX_LENGTH)],
    description: getTestString(SkillGroupConstants.DESCRIPTION_MAX_LENGTH),
    scopeNote: getTestString(SkillGroupConstants.MAX_SCOPE_NOTE_LENGTH),
    modelId: getMockId(1),
    parents: [],
    children: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const givenFullSkillGroupParent = {
    ...givenValidSkillGroupParent,
  };

  const givenFullSkillParent = {
    id: getMockId(2),
    UUID: randomUUID(),
    originUUID: randomUUID(),
    UUIDHistory: [randomUUID()],
    path: "https://path/to/tabiya",
    tabiyaPath: "https://path/to/tabiya",
    originUri: "https://foo/bar",
    preferredLabel: getTestString(SkillConstants.PREFERRED_LABEL_MAX_LENGTH),
    altLabels: [getTestString(SkillConstants.ALT_LABEL_MAX_LENGTH)],
    definition: getTestString(SkillConstants.DEFINITION_MAX_LENGTH),
    description: getTestString(SkillConstants.DESCRIPTION_MAX_LENGTH),
    scopeNote: getTestString(SkillConstants.SCOPE_NOTE_MAX_LENGTH),
    skillType: SkillEnums.SkillType.Knowledge,
    reuseLevel: SkillEnums.ReuseLevel.CrossSector,
    isLocalized: true,
    modelId: getMockId(1),
    parent: null,
    children: [],
    requiresSkills: [],
    requiredBySkills: [],
    requiredByOccupations: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Test with a valid SkillGroup parent
  testSchemaWithValidObject(
    "SkillAPISpecs.Schemas.GET.Parent.Response.Payload (SkillGroup)",
    SkillAPISpecs.Schemas.GET.Parent.Response.Payload,
    givenFullSkillGroupParent
  );

  // Test with a valid Skill parent
  testSchemaWithValidObject(
    "SkillAPISpecs.Schemas.GET.Parent.Response.Payload (Skill)",
    SkillAPISpecs.Schemas.GET.Parent.Response.Payload,
    givenFullSkillParent
  );

  // Test with null
  test("Should validate null", () => {
    assertCaseForProperty("", null, SkillAPISpecs.Schemas.GET.Parent.Response.Payload, CaseType.Success, undefined);
  });

  // Test with additional properties
  testSchemaWithAdditionalProperties(
    "SkillAPISpecs.Schemas.GET.Parent.Response.Payload",
    SkillAPISpecs.Schemas.GET.Parent.Response.Payload,
    {
      ...givenFullSkillParent,
      extraProperty: "extra test property",
    }
  );

  describe("Validate SkillAPISpecs.Schemas.GET.Parent.Response.Payload fields", () => {
    // For individual field validation, we test against the specific base schemas to avoid anyOf ambiguity
    const skillSchema = SkillAPISpecs.Schemas.POST.Response.Payload;
    const skillGroupSchema = SkillGroupAPISpecs.Schemas.POST.Response.Payload;

    describe("Test validation of Skill fields", () => {
      test("Validate 'skillType'", () => {
        assertCaseForProperty("skillType", givenFullSkillParent, skillSchema, CaseType.Success, undefined);
      });
      // Add more specific field tests if needed, or rely on base tests
    });

    describe("Test validation of SkillGroup fields", () => {
      test("Validate 'code'", () => {
        assertCaseForProperty("code", givenFullSkillGroupParent, skillGroupSchema, CaseType.Success, undefined);
      });
      test("Validate 'preferredLabel'", () => {
        assertCaseForProperty(
          "preferredLabel",
          givenFullSkillGroupParent,
          skillGroupSchema,
          CaseType.Success,
          undefined
        );
      });
    });
  });
});
