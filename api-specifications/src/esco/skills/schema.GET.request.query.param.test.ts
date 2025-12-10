import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";

import { getTestBase64String } from "_test_utilities/specialCharacters";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import SkillAPISpecs from "./index";
import SkillConstants from "./constants";
import { RegExp_Str_NotEmptyString } from "../../regex";

describe("Test Skill GET Request Query Param Schema Validity", () => {
  // WHEN the SkillAPISpecs.Schemas.GET.Request.Query.Param schema
  // THEN expect the givenSchema to be valid
  testValidSchema("SkillAPISpecs.Schemas.GET.Request.Query.Payload", SkillAPISpecs.Schemas.GET.Request.Query.Payload);
});

describe("Test objects against the SkillAPISpecs.Schemas.GET.Request.Query.Param schema", () => {
  // GIVEN a valid skill GET request query param object
  const givenValidSkillGETRequestQueryParam = {
    limit: SkillConstants.MAX_LIMIT,
    cursor: getTestBase64String(SkillConstants.MAX_CURSOR_LENGTH),
  };

  // Test with a valid request query param
  testSchemaWithValidObject(
    "SkillAPISpecs.Schemas.GET.Request.Query.Payload",
    SkillAPISpecs.Schemas.GET.Request.Query.Payload,
    givenValidSkillGETRequestQueryParam
  );

  // Test with additional properties in the request query param
  testSchemaWithAdditionalProperties(
    "SkillAPISpecs.Schemas.GET.Request.Query.Payload",
    SkillAPISpecs.Schemas.GET.Request.Query.Payload,
    {
      ...givenValidSkillGETRequestQueryParam,
      extraProperty: "extra test property (not defined in schema) for testing additionalProperties",
    }
  );

  describe("Validate SkillAPISpecs.Schemas.GET.Request.Query.Payload fields", () => {
    const givenSchema = SkillAPISpecs.Schemas.GET.Request.Query.Payload;

    describe("Test validation of 'limit'", () => {
      test.each([
        [CaseType.Success, "undefined", undefined, undefined],
        [CaseType.Failure, "null", null, constructSchemaError("/limit", "type", "must be integer")],
        [CaseType.Failure, "string", "10", constructSchemaError("/limit", "type", "must be integer")],
        [CaseType.Failure, "float", 1.1, constructSchemaError("/limit", "type", "must be integer")],
        [CaseType.Failure, "zero", 0, constructSchemaError("/limit", "minimum", "must be >= 1")],
        [
          CaseType.Failure,
          "over max",
          SkillConstants.MAX_LIMIT + 1,
          constructSchemaError("/limit", "maximum", `must be <= ${SkillConstants.MAX_LIMIT}`),
        ],
        [CaseType.Success, "one", 1, undefined],
        [CaseType.Success, "ten", 10, undefined],
      ])("%s %s", (caseType, desc, value, failure) => {
        assertCaseForProperty("limit", { limit: value }, givenSchema, caseType, failure);
      });
    });

    describe("Test validation of 'cursor'", () => {
      test.each([
        [CaseType.Success, "undefined", undefined, undefined],
        [CaseType.Success, "null", null, undefined],
        [
          CaseType.Failure,
          "empty string",
          "",
          constructSchemaError("/cursor", "pattern", `must match pattern "${RegExp_Str_NotEmptyString}"`),
        ],
        [
          CaseType.Failure,
          "too long",
          "a".repeat(SkillConstants.MAX_CURSOR_LENGTH + 1),
          constructSchemaError(
            "/cursor",
            "maxLength",
            `must NOT have more than ${SkillConstants.MAX_CURSOR_LENGTH} characters`
          ),
        ],
        [CaseType.Success, "valid string", getTestBase64String(SkillConstants.MAX_CURSOR_LENGTH), undefined],
      ])(`(%s) Validate 'cursor' when it is %s`, (caseType, _desc, value, failureMessage) => {
        assertCaseForProperty("cursor", { cursor: value }, givenSchema, caseType, failureMessage);
      });
    });
  });
});
