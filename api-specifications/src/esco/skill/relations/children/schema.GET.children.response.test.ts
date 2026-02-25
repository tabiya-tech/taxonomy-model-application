import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
  testObjectIdField,
  testNonEmptyStringField,
  testUUIDField,
} from "_test_utilities/stdSchemaTests";
import { getStdLimitTestCases, getStdCursorTestCases } from "_test_utilities/stdSchemaTestCases";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import { getTestString } from "_test_utilities/specialCharacters";
import { getMockId } from "_test_utilities/mockMongoId";
import { randomUUID } from "crypto";
import SkillConstants from "../../constants";
import SkillAPISpecs from "../../index";
import SkillEnums from "../../enums";

describe("Test Skill Children Response Schema Validity", () => {
  testValidSchema(
    "SkillAPISpecs.Schemas.GET.Children.Response.Payload",
    SkillAPISpecs.Schemas.GET.Children.Response.Payload
  );
});

describe("Test objects against the SkillAPISpecs.Schemas.GET.Children.Response.Payload schema", () => {
  const givenValidChild = {
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
    modelId: getMockId(1),
    parents: [],
    children: [],
    requiresSkills: [],
    requiredBySkills: [],
    requiredByOccupations: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const givenValidPaginatedResponse = {
    data: [givenValidChild],
    limit: SkillConstants.MAX_LIMIT,
    nextCursor: getTestString(SkillConstants.MAX_CURSOR_LENGTH),
  };

  testSchemaWithValidObject(
    "SkillAPISpecs.Schemas.GET.Children.Response.Payload",
    SkillAPISpecs.Schemas.GET.Children.Response.Payload,
    givenValidPaginatedResponse
  );

  testSchemaWithAdditionalProperties(
    "SkillAPISpecs.Schemas.GET.Children.Response.Payload",
    SkillAPISpecs.Schemas.GET.Children.Response.Payload,
    {
      ...givenValidPaginatedResponse,
      extraProperty: "extra test property",
    }
  );

  describe("Validate SkillAPISpecs.Schemas.GET.Children.Response.Payload fields", () => {
    const givenSchema = SkillAPISpecs.Schemas.GET.Children.Response.Payload;

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

    describe("Test validation of child item fields", () => {
      const itemSchema = {
        ...SkillAPISpecs.Schemas.GET.Children.Response.Payload.properties.data.items,
        $id: "SkillChildrenResponseItemTestSchema",
      };

      describe("Test validation of 'id'", () => {
        testObjectIdField("id", itemSchema);
      });

      describe("Test validation of 'UUID'", () => {
        testUUIDField<SkillAPISpecs.Types.GET.Children.Response.Payload>("UUID", itemSchema);
      });

      describe("Test validation of 'preferredLabel'", () => {
        testNonEmptyStringField<SkillAPISpecs.Types.GET.Children.Response.Payload>(
          "preferredLabel",
          SkillConstants.PREFERRED_LABEL_MAX_LENGTH,
          itemSchema
        );
      });

      describe("Test validation of 'skillType'", () => {
        test.each([
          [
            CaseType.Failure,
            "undefined",
            undefined,
            constructSchemaError("", "required", "must have required property 'skillType'"),
          ],
          [CaseType.Failure, "null", null, constructSchemaError("/skillType", "type", "must be string")],
          [
            CaseType.Failure,
            "empty string",
            "",
            constructSchemaError("/skillType", "enum", "must be equal to one of the allowed values"),
          ],
          [
            CaseType.Failure,
            "invalid value",
            "invalid",
            constructSchemaError("/skillType", "enum", "must be equal to one of the allowed values"),
          ],
          [CaseType.Success, "knowledge", SkillEnums.SkillType.Knowledge, undefined],
          [CaseType.Success, "skill/competence", SkillEnums.SkillType.SkillCompetence, undefined],
          [CaseType.Success, "attitude", SkillEnums.SkillType.Attitude, undefined],
          [CaseType.Success, "language", SkillEnums.SkillType.Language, undefined],
        ])("%s Validate 'skillType' when it is %s", (caseType, _description, givenValue, failureMessage) => {
          const givenObject = {
            ...givenValidChild,
            skillType: givenValue,
          };
          assertCaseForProperty("skillType", givenObject, itemSchema, caseType, failureMessage);
        });
      });

      describe("Test validation of 'isLocalized'", () => {
        test.each([
          [
            CaseType.Failure,
            "undefined",
            undefined,
            constructSchemaError("", "required", "must have required property 'isLocalized'"),
          ],
          [CaseType.Failure, "null", null, constructSchemaError("/isLocalized", "type", "must be boolean")],
          [CaseType.Success, "true", true, undefined],
          [CaseType.Success, "false", false, undefined],
        ])("%s Validate 'isLocalized' when it is %s", (caseType, _description, givenValue, failureMessage) => {
          const givenObject = {
            ...givenValidChild,
            isLocalized: givenValue,
          };
          assertCaseForProperty("isLocalized", givenObject, itemSchema, caseType, failureMessage);
        });
      });
    });
  });
});
