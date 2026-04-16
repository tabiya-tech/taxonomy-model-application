import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import { getStdLimitTestCases, getStdCursorTestCases } from "_test_utilities/stdSchemaTestCases";
import { assertCaseForProperty } from "_test_utilities/assertCaseForProperty";
import SkillGroupConstants from "../../../_shared/constants";
import SkillGroupGETChildrenAPISpecs from "./index";
import { getTestString } from "_test_utilities/specialCharacters";

function getValidChildrenRequestQuery() {
  return {
    limit: SkillGroupConstants.DEFAULT_LIMIT,
    cursor: getTestString(SkillGroupConstants.MAX_CURSOR_LENGTH),
  };
}

describe("Test SkillGroup Children Request Query Schema Validity", () => {
  testValidSchema(
    "SkillGroupGETChildrenAPISpecs.Schemas.Request.Query.Payload",
    SkillGroupGETChildrenAPISpecs.Schemas.Request.Query.Payload
  );
});

describe("Test objects against the SkillGroupGETChildrenAPISpecs.Schemas.Request.Query.Payload schema", () => {
  const givenValidQuery = getValidChildrenRequestQuery();

  testSchemaWithValidObject(
    "SkillGroupGETChildrenAPISpecs.Schemas.Request.Query.Payload",
    SkillGroupGETChildrenAPISpecs.Schemas.Request.Query.Payload,
    givenValidQuery
  );

  testSchemaWithAdditionalProperties(
    "SkillGroupGETChildrenAPISpecs.Schemas.Request.Query.Payload",
    SkillGroupGETChildrenAPISpecs.Schemas.Request.Query.Payload,
    {
      ...givenValidQuery,
      extraProperty: "extra test property",
    }
  );

  describe("Validate SkillGroupGETChildrenAPISpecs.Schemas.Request.Query.Payload fields", () => {
    const givenSchema = SkillGroupGETChildrenAPISpecs.Schemas.Request.Query.Payload;

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
