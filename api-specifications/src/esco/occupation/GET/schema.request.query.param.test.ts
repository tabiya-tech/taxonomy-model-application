import Ajv from "ajv";
import addFormats from "ajv-formats";
import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
  testLimitField,
  testCursorField,
} from "_test_utilities/stdSchemaTests";
import { getTestBase64String, getTestString } from "_test_utilities/specialCharacters";

import OccupationAPISpecs from "../index";

/**
 * Compiles the GET query-param schema and validates the given object against it.
 * Used to assert the `query`/`searchFields` search parameters (optional fields with an inter-field
 * `allOf` constraint), which the shared single-field helpers do not cover.
 */
function validateOccupationGETQuery(givenObject: object): { valid: boolean } {
  const ajv = new Ajv({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(OccupationAPISpecs.GET.Schemas.Request.Query.Payload);
  return { valid: validate(givenObject) as boolean };
}

describe("Test OccupationAPISpecs.GETOccupations.Schemas.Request.Query validity", () => {
  // WHEN the OccupationAPISpecs.GET.Request.Query schema
  // THEN expect the givenSchema to be valid
  testValidSchema(
    "OccupationAPISpecs.GETOccupations.Schemas.Request.Query.Payload",
    OccupationAPISpecs.GET.Schemas.Request.Query.Payload
  );
});

describe("Test objects against the OccupationAPISpecs.GETOccupations.Schemas.Request.Query.Payload schema", () => {
  // GIVEN a valid GET Request Query Param object
  const maxCursor = getTestBase64String(OccupationAPISpecs.Constants.MAX_CURSOR_LENGTH);
  const givenValidQuery = {
    limit: 10,
    cursor: maxCursor,
  };

  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "OccupationAPISpecs.GETOccupations.Schemas.Request.Query.Payload",
    OccupationAPISpecs.GET.Schemas.Request.Query.Payload,
    givenValidQuery
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "OccupationAPISpecs.GETOccupations.Schemas.Request.Query.Payload",
    OccupationAPISpecs.GET.Schemas.Request.Query.Payload,
    { ...givenValidQuery, extraProperty: "foo" }
  );

  describe("Validate OccupationAPISpecs.GETOccupations.Schemas.Request.Query.Payload fields", () => {
    describe("Test validation of 'limit'", () => {
      testLimitField<OccupationAPISpecs.GET.Types.Request.Query.Payload>(
        "limit",
        OccupationAPISpecs.Constants.MAX_LIMIT,
        OccupationAPISpecs.GET.Schemas.Request.Query.Payload,
        [],
        false
      );
    });

    describe("Test validation of 'cursor'", () => {
      testCursorField<OccupationAPISpecs.GET.Types.Request.Query.Payload>(
        "cursor",
        OccupationAPISpecs.Constants.MAX_CURSOR_LENGTH,
        OccupationAPISpecs.GET.Schemas.Request.Query.Payload,
        [],
        false,
        false
      );
    });

    describe("Test validation of the search parameters 'query' and 'searchFields'", () => {
      test.each([
        ["query only", { query: "software developer" }],
        ["query with a single searchField", { query: "software", searchFields: "preferredLabel" }],
        [
          "query with multiple searchFields",
          { query: "software", searchFields: "preferredLabel,description,altLabels" },
        ],
        ["an empty query", { query: "" }],
        [
          "a query of the maximum length",
          { query: getTestString(OccupationAPISpecs.Constants.SEARCH_VALUE_MAX_LENGTH) },
        ],
        ["no search parameters at all", { limit: OccupationAPISpecs.Constants.DEFAULT_LIMIT }],
      ])("(Success) Validate the search parameters when they are %s", (_description, givenQueryParams) => {
        // WHEN the query params are validated against the schema
        const actual = validateOccupationGETQuery(givenQueryParams);
        // THEN expect them to be valid
        expect(actual.valid).toBe(true);
      });

      test.each([
        [
          "query is longer than the maximum",
          { query: getTestString(OccupationAPISpecs.Constants.SEARCH_VALUE_MAX_LENGTH + 1) },
        ],
        ["query is null", { query: null }],
        ["searchFields is set without a query", { searchFields: "preferredLabel" }],
        ["searchFields contains an unknown field", { query: "software", searchFields: "scopeNote" }],
        ["searchFields has a trailing comma", { query: "software", searchFields: "preferredLabel," }],
        ["searchFields is separated by semicolons", { query: "software", searchFields: "preferredLabel;description" }],
        ["searchFields is null", { query: "software", searchFields: null }],
      ])("(Failure) Reject the search parameters when %s", (_description, givenQueryParams) => {
        // WHEN the query params are validated against the schema
        const actual = validateOccupationGETQuery(givenQueryParams as object);
        // THEN expect them to be invalid
        expect(actual.valid).toBe(false);
      });
    });
  });
});
