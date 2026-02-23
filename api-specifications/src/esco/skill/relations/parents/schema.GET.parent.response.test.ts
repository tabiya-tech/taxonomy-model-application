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
import { getStdLimitTestCases, getStdCursorTestCases } from "_test_utilities/stdSchemaTestCases";

describe("Test Skill Parent Response Schema Validity", () => {
  // WHEN the SkillAPISpecs.Schemas.GET.Parents.Response.Payload schema
  // THEN expect the schema to be valid
  testValidSchema(
    "SkillAPISpecs.Schemas.GET.Parents.Response.Payload",
    SkillAPISpecs.Schemas.GET.Parents.Response.Payload
  );
});

describe("Test objects against the SkillAPISpecs.Schemas.GET.Parents.Response.Payload schema", () => {
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

  const givenValidPaginatedResponse = {
    data: [givenFullSkillParent, givenFullSkillGroupParent],
    limit: SkillConstants.MAX_LIMIT,
    nextCursor: getTestString(SkillConstants.MAX_CURSOR_LENGTH),
  };

  // Test with a valid paginated response
  testSchemaWithValidObject(
    "SkillAPISpecs.Schemas.GET.Parents.Response.Payload",
    SkillAPISpecs.Schemas.GET.Parents.Response.Payload,
    givenValidPaginatedResponse
  );

  // Test with additional properties
  testSchemaWithAdditionalProperties(
    "SkillAPISpecs.Schemas.GET.Parents.Response.Payload",
    SkillAPISpecs.Schemas.GET.Parents.Response.Payload,
    {
      ...givenValidPaginatedResponse,
      extraProperty: "extra test property",
    }
  );

  describe("Validate SkillAPISpecs.Schemas.GET.Parents.Response.Payload fields", () => {
    const givenSchema = SkillAPISpecs.Schemas.GET.Parents.Response.Payload;

    describe("Test validation of 'limit'", () => {
      const testCases = getStdLimitTestCases("limit", SkillConstants.MAX_LIMIT, true);
      test.each(testCases)("%s %s", (caseType, desc, value, failure) => {
        const givenObject = { ...givenValidPaginatedResponse, limit: value };
        if (value === undefined) delete (givenObject as Record<string, unknown>).limit;
        assertCaseForProperty("limit", givenObject, givenSchema, caseType, failure);
      });
    });

    describe("Test validation of 'nextCursor'", () => {
      const testCases = getStdCursorTestCases("nextCursor", SkillConstants.MAX_CURSOR_LENGTH, false, true);
      test.each(testCases)(`(%s) Validate 'nextCursor' when it is %s`, (caseType, _desc, value, failureMessage) => {
        const givenObject = { ...givenValidPaginatedResponse, nextCursor: value };
        if (value === undefined) delete (givenObject as Record<string, unknown>).nextCursor;
        assertCaseForProperty("nextCursor", givenObject, givenSchema, caseType, failureMessage);
      });
    });

    describe("Test validation of parent item fields", () => {
      describe("Test validation of Skill fields", () => {
        const skillSchema = SkillAPISpecs.Schemas.POST.Response.Payload;
        test("Validate 'skillType'", () => {
          assertCaseForProperty("skillType", givenFullSkillParent, skillSchema, CaseType.Success, undefined);
        });
      });

      describe("Test validation of SkillGroup fields", () => {
        const skillGroupSchema = SkillGroupAPISpecs.Schemas.POST.Response.Payload;
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
});
