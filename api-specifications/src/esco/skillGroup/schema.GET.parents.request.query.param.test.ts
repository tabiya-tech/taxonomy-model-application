import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import { getStdLimitTestCases, getStdCursorTestCases } from "_test_utilities/stdSchemaTestCases";
import { assertCaseForProperty } from "_test_utilities/assertCaseForProperty";
import SkillGroupConstants from "./constants";
import SkillGroupAPISpecs from "./index";
import { getTestString } from "_test_utilities/specialCharacters";

function getValidParentsRequestQuery() {
  return {
    limit: SkillGroupConstants.DEFAULT_LIMIT,
    cursor: getTestString(SkillGroupConstants.MAX_CURSOR_LENGTH),
  };
}

describe("Test SkillGroup Parents Request Query Schema Validity", () => {
  testValidSchema(
    "SkillGroupAPISpecs.Schemas.GET.Parents.Request.Query.Payload",
    SkillGroupAPISpecs.Schemas.GET.Parents.Request.Query.Payload
  );
});

describe("Test objects against the SkillGroupAPISpecs.Schemas.GET.Parents.Request.Query.Payload schema", () => {
  const givenValidQuery = getValidParentsRequestQuery();

  testSchemaWithValidObject(
    "SkillGroupAPISpecs.Schemas.GET.Parents.Request.Query.Payload",
    SkillGroupAPISpecs.Schemas.GET.Parents.Request.Query.Payload,
    givenValidQuery
  );

  testSchemaWithAdditionalProperties(
    "SkillGroupAPISpecs.Schemas.GET.Parents.Request.Query.Payload",
    SkillGroupAPISpecs.Schemas.GET.Parents.Request.Query.Payload,
    {
      ...givenValidQuery,
      extraProperty: "extra test property",
    }
  );

  describe("Validate SkillGroupAPISpecs.Schemas.GET.Parents.Request.Query.Payload fields", () => {
    const givenSchema = SkillGroupAPISpecs.Schemas.GET.Parents.Request.Query.Payload;

    describe("Test validation of 'limit'", () => {
      const testCases = getStdLimitTestCases("limit", SkillGroupConstants.MAX_LIMIT, false);
      test.each(testCases)("%s %s", (caseType, desc, value, failure) => {
        const givenObject = { ...givenValidQuery, limit: value };
        if (value === undefined) delete (givenObject as Record<string, unknown>).limit;
        assertCaseForProperty("limit", givenObject, givenSchema, caseType, failure);
      });
    });

    describe("Test validation of 'cursor'", () => {
      const testCases = getStdCursorTestCases("cursor", SkillGroupConstants.MAX_CURSOR_LENGTH, false, false);
      test.each(testCases)(`(%s) Validate 'cursor' when it is %s`, (caseType, _desc, value, failureMessage) => {
        const givenObject = { ...givenValidQuery, cursor: value };
        if (value === undefined) delete (givenObject as Record<string, unknown>).cursor;
        assertCaseForProperty("cursor", givenObject, givenSchema, caseType, failureMessage);
      });
    });
  });
});
