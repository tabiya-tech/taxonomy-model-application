import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import { getStdLimitTestCases, getStdCursorTestCases } from "_test_utilities/stdSchemaTestCases";
import { assertCaseForProperty } from "_test_utilities/assertCaseForProperty";
import { getTestString } from "_test_utilities/specialCharacters";
import SkillConstants from "../../constants";
import SkillAPISpecs from "../../index";

describe("Test Skill Children Request Query Schema Validity", () => {
  testValidSchema(
    "SkillAPISpecs.Schemas.GET.Children.Request.Query.Payload",
    SkillAPISpecs.Schemas.GET.Children.Request.Query.Payload
  );
});

describe("Test objects against the SkillAPISpecs.Schemas.GET.Children.Request.Query.Payload schema", () => {
  const givenValidQuery = {
    limit: SkillConstants.DEFAULT_LIMIT,
    cursor: getTestString(SkillConstants.MAX_CURSOR_LENGTH),
  };

  testSchemaWithValidObject(
    "SkillAPISpecs.Schemas.GET.Children.Request.Query.Payload",
    SkillAPISpecs.Schemas.GET.Children.Request.Query.Payload,
    givenValidQuery
  );

  testSchemaWithAdditionalProperties(
    "SkillAPISpecs.Schemas.GET.Children.Request.Query.Payload",
    SkillAPISpecs.Schemas.GET.Children.Request.Query.Payload,
    {
      ...givenValidQuery,
      extraProperty: "extra test property",
    }
  );

  describe("Validate SkillAPISpecs.Schemas.GET.Children.Request.Query.Payload fields", () => {
    const givenSchema = SkillAPISpecs.Schemas.GET.Children.Request.Query.Payload;

    describe("Test validation of 'limit'", () => {
      const testCases = getStdLimitTestCases("limit", SkillConstants.MAX_LIMIT, false);
      test.each(testCases)("%s %s", (caseType, desc, value, failure) => {
        const givenObject = { ...givenValidQuery, limit: value };
        if (value === undefined) delete (givenObject as Record<string, unknown>).limit;
        assertCaseForProperty("limit", givenObject, givenSchema, caseType, failure);
      });
    });

    describe("Test validation of 'cursor'", () => {
      const testCases = getStdCursorTestCases("cursor", SkillConstants.MAX_CURSOR_LENGTH, false, false);
      test.each(testCases)(`(%s) Validate 'cursor' when it is %s`, (caseType, _desc, value, failureMessage) => {
        const givenObject = { ...givenValidQuery, cursor: value };
        if (value === undefined) delete (givenObject as Record<string, unknown>).cursor;
        assertCaseForProperty("cursor", givenObject, givenSchema, caseType, failureMessage);
      });
    });
  });
});
