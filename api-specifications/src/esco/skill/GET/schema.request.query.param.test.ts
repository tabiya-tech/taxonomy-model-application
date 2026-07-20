import Ajv from "ajv";
import addFormats from "ajv-formats";
import {
  testCursorField,
  testLimitField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";

import { getTestBase64String, getTestString } from "_test_utilities/specialCharacters";
import SkillAPISpecs from "../index";
import SkillConstants from "../_shared/constants";

/**
 * Compiles the GET query-param schema and validates the given object against it.
 * Used to assert the `query`/`searchFields` search parameters (optional fields with an inter-field
 * `allOf` constraint), which the shared single-field helpers do not cover.
 */
function validateSkillGETQuery(givenObject: object): { valid: boolean } {
  const ajv = new Ajv({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(SkillAPISpecs.GET.Schemas.Request.Query.Payload);
  return { valid: validate(givenObject) as boolean };
}

describe("Test Skill GET Request Query Param Schema Validity", () => {
  // WHEN the SkillAPISpecs.Schemas.GET.Request.Query.Param schema
  // THEN expect the givenSchema to be valid
  testValidSchema("SkillAPISpecs.GET.Schemas.Request.Query.Payload", SkillAPISpecs.GET.Schemas.Request.Query.Payload);
});

describe("Test objects against the SkillAPISpecs.Schemas.GET.Request.Query.Param schema", () => {
  // GIVEN a valid skill GET request query param object
  const givenValidSkillGETRequestQueryParam = {
    limit: SkillConstants.MAX_LIMIT,
    cursor: getTestBase64String(SkillConstants.MAX_CURSOR_LENGTH),
  };

  // Test with a valid request query param
  testSchemaWithValidObject(
    "SkillAPISpecs.GET.Schemas.Request.Query.Payload",
    SkillAPISpecs.GET.Schemas.Request.Query.Payload,
    givenValidSkillGETRequestQueryParam
  );

  // Test with additional properties in the request query param
  testSchemaWithAdditionalProperties(
    "SkillAPISpecs.GET.Schemas.Request.Query.Payload",
    SkillAPISpecs.GET.Schemas.Request.Query.Payload,
    {
      ...givenValidSkillGETRequestQueryParam,
      extraProperty: "extra test property (not defined in schema) for testing additionalProperties",
    }
  );

  describe("Validate SkillAPISpecs.GET.Schemas.Request.Query.Payload fields", () => {
    describe("Test validation of 'limit'", () => {
      testLimitField<SkillAPISpecs.Types.GETSkills.Request.Query.Payload>(
        "limit",
        SkillAPISpecs.Constants.MAX_LIMIT,
        SkillAPISpecs.GET.Schemas.Request.Query.Payload,
        [],
        false
      );
    });

    describe("Test validate of 'cursor'", () => {
      testCursorField<SkillAPISpecs.Types.GETSkills.Request.Query.Payload>(
        "cursor",
        SkillAPISpecs.Constants.MAX_CURSOR_LENGTH,
        SkillAPISpecs.GET.Schemas.Request.Query.Payload,
        [],
        false,
        false
      );
    });

    describe("Test validation of the search parameters 'query' and 'searchFields'", () => {
      test.each([
        ["query only", { query: "python developer" }],
        ["query with a single searchField", { query: "python", searchFields: "preferredLabel" }],
        ["query with multiple searchFields", { query: "python", searchFields: "preferredLabel,description,altLabels" }],
        ["an empty query", { query: "" }],
        ["a query of the maximum length", { query: getTestString(SkillConstants.SEARCH_VALUE_MAX_LENGTH) }],
        ["no search parameters at all", { limit: SkillConstants.DEFAULT_LIMIT }],
      ])("(Success) Validate the search parameters when they are %s", (_description, givenQueryParams) => {
        // WHEN the query params are validated against the schema
        const actual = validateSkillGETQuery(givenQueryParams);
        // THEN expect them to be valid
        expect(actual.valid).toBe(true);
      });

      test.each([
        ["query is longer than the maximum", { query: getTestString(SkillConstants.SEARCH_VALUE_MAX_LENGTH + 1) }],
        ["query is null", { query: null }],
        ["searchFields is set without a query", { searchFields: "preferredLabel" }],
        ["searchFields contains an unknown field", { query: "python", searchFields: "unknownField" }],
        ["searchFields has a trailing comma", { query: "python", searchFields: "preferredLabel," }],
        ["searchFields is separated by semicolons", { query: "python", searchFields: "preferredLabel;description" }],
        ["searchFields is null", { query: "python", searchFields: null }],
      ])("(Failure) Reject the search parameters when %s", (_description, givenQueryParams) => {
        // WHEN the query params are validated against the schema
        const actual = validateSkillGETQuery(givenQueryParams as object);
        // THEN expect them to be invalid
        expect(actual.valid).toBe(false);
      });
    });
  });
});
