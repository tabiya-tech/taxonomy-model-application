import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import { getStdLimitTestCases, getStdCursorTestCases } from "_test_utilities/stdSchemaTestCases";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import { getTestString } from "_test_utilities/specialCharacters";
import { getMockId } from "_test_utilities/mockMongoId";
import { randomUUID } from "crypto";
import SkillConstants from "../../constants";
import SkillAPISpecs from "../../index";
import SkillEnums from "../../enums";

describe("Test Skill Related Response Schema Validity", () => {
  testValidSchema(
    "SkillAPISpecs.Schemas.GET.Related.Response.Payload",
    SkillAPISpecs.Schemas.GET.Related.Response.Payload
  );
});

describe("Test objects against the SkillAPISpecs.Schemas.GET.Related.Response.Payload schema", () => {
  const givenValidRelatedSkill = {
    id: getMockId(1),
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
    objectType: SkillEnums.ObjectTypes.Skill,
    skillGroupCode: "S1.2.3",
    modelId: getMockId(1),
    parent: null,
    children: [],
    requiresSkills: [],
    requiredBySkills: [],
    requiredByOccupations: [],
    relationType: SkillEnums.SkillToSkillRelationType.ESSENTIAL,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const givenValidPaginatedResponse = {
    data: [givenValidRelatedSkill],
    limit: SkillConstants.MAX_LIMIT,
    nextCursor: getTestString(SkillConstants.MAX_CURSOR_LENGTH),
  };

  testSchemaWithValidObject(
    "SkillAPISpecs.Schemas.GET.Related.Response.Payload",
    SkillAPISpecs.Schemas.GET.Related.Response.Payload,
    givenValidPaginatedResponse
  );

  testSchemaWithAdditionalProperties(
    "SkillAPISpecs.Schemas.GET.Related.Response.Payload",
    SkillAPISpecs.Schemas.GET.Related.Response.Payload,
    {
      ...givenValidPaginatedResponse,
      extraProperty: "extra test property",
    }
  );

  describe("Validate SkillAPISpecs.Schemas.GET.Related.Response.Payload fields", () => {
    const givenSchema = SkillAPISpecs.Schemas.GET.Related.Response.Payload;

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

    describe("Test validation of related skill item fields", () => {
      const itemSchema = {
        ...SkillAPISpecs.Schemas.GET.Related.Response.Payload.properties.data.items,
        $id: "SkillRelatedResponseItemTestSchema",
      };

      describe("Test validation of 'relationType'", () => {
        test.each([
          [
            CaseType.Failure,
            "undefined",
            undefined,
            constructSchemaError("", "required", "must have required property 'relationType'"),
          ],
          [CaseType.Failure, "null", null, constructSchemaError("/relationType", "type", "must be string")],
          [
            CaseType.Failure,
            "empty string",
            "",
            constructSchemaError("/relationType", "enum", "must be equal to one of the allowed values"),
          ],
          [CaseType.Success, "valid relation type", SkillEnums.SkillToSkillRelationType.ESSENTIAL, undefined],
          [CaseType.Success, "another valid type", SkillEnums.SkillToSkillRelationType.OPTIONAL, undefined],
        ])("%s Validate 'relationType' when it is %s", (caseType, _description, givenValue, failureMessage) => {
          const givenObject = {
            ...givenValidRelatedSkill,
            relationType: givenValue,
          };
          assertCaseForProperty("relationType", givenObject, itemSchema, caseType, failureMessage);
        });
      });
    });
  });
});
