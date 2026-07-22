import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
  testLimitField,
  testCursorField,
  testBooleanField,
} from "_test_utilities/stdSchemaTests";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import OccupationGroupGETAPISpecs from "./index";
import OccupationGroupConstants from "../_shared/constants";
import { getTestBase64String, getTestString } from "_test_utilities/specialCharacters";

/**
 * Compiles the GET query-param schema and validates the given object against it.
 * Used to assert the `query`/`searchFields` search parameters (optional fields with an inter-field
 * `allOf` constraint), which the shared single-field helpers do not cover.
 */
function validateOccupationGroupGETQuery(givenObject: object): { valid: boolean } {
  const ajv = new Ajv({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(OccupationGroupGETAPISpecs.Schemas.Request.Query.Payload);
  return { valid: validate(givenObject) as boolean };
}

describe("Test OccupationGroupGETAPISpecs.Schemas.Request.Query validity", () => {
  // WHEN the OccupationGroupGETAPISpecs.GET.Request.Query schema
  // THEN expect the givenSchema to be valid
  testValidSchema(
    "OccupationGroupGETAPISpecs.Schemas.Request.Query.Payload",
    OccupationGroupGETAPISpecs.Schemas.Request.Query.Payload
  );
});

describe("Test objects against the OccupationGroupGETAPISpecs.Schemas.Request.Query.Payload schema", () => {
  // GIVEN a valid GET Request Query object
  const givenValidOccupationGroupGetQueryParameter = {
    limit: 10,
    cursor: getTestBase64String(OccupationGroupGETAPISpecs.Constants.MAX_CURSOR_LENGTH),
    root: true,
  };

  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "OccupationGroupGETAPISpecs.Schemas.Request.Query.Payload",
    OccupationGroupGETAPISpecs.Schemas.Request.Query.Payload,
    givenValidOccupationGroupGetQueryParameter
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "OccupationGroupGETAPISpecs.Schemas.Request.Query.Payload",
    OccupationGroupGETAPISpecs.Schemas.Request.Query.Payload,
    { ...givenValidOccupationGroupGetQueryParameter, extraProperty: "foo" }
  );

  describe("Validate OccupationGroupGETAPISpecs.Schemas.Request.Query.Payload fields", () => {
    describe("Test validation of 'limit'", () => {
      testLimitField<OccupationGroupGETAPISpecs.Types.Request.Query.Payload>(
        "limit",
        OccupationGroupGETAPISpecs.Constants.MAX_LIMIT,
        OccupationGroupGETAPISpecs.Schemas.Request.Query.Payload,
        [],
        false
      );
    });
    describe("Test validate of 'cursor'", () => {
      testCursorField<OccupationGroupGETAPISpecs.Types.Request.Query.Payload>(
        "cursor",
        OccupationGroupGETAPISpecs.Constants.MAX_CURSOR_LENGTH,
        OccupationGroupGETAPISpecs.Schemas.Request.Query.Payload,
        [],
        false,
        false
      );
    });
    describe("Test validate of 'root'", () => {
      testBooleanField("root", OccupationGroupGETAPISpecs.Schemas.Request.Query.Payload, [], false);
    });

    describe("Test validation of the search parameters 'query' and 'searchFields'", () => {
      test.each([
        ["query only", { query: "nursing professionals" }],
        ["query with a single searchField", { query: "nursing", searchFields: "preferredLabel" }],
        [
          "query with multiple searchFields",
          { query: "nursing", searchFields: "preferredLabel,description,altLabels" },
        ],
        ["an empty query", { query: "" }],
        ["a query of the maximum length", { query: getTestString(OccupationGroupConstants.SEARCH_VALUE_MAX_LENGTH) }],
        ["no search parameters at all", { limit: OccupationGroupGETAPISpecs.Constants.DEFAULT_LIMIT }],
      ])("(Success) Validate the search parameters when they are %s", (_description, givenQueryParams) => {
        // WHEN the query params are validated against the schema
        const actual = validateOccupationGroupGETQuery(givenQueryParams);
        // THEN expect them to be valid
        expect(actual.valid).toBe(true);
      });

      test.each([
        [
          "query is longer than the maximum",
          { query: getTestString(OccupationGroupConstants.SEARCH_VALUE_MAX_LENGTH + 1) },
        ],
        ["query is null", { query: null }],
        ["searchFields is set without a query", { searchFields: "preferredLabel" }],
        ["searchFields contains an unknown field", { query: "nursing", searchFields: "scopeNote" }],
        ["searchFields has a trailing comma", { query: "nursing", searchFields: "preferredLabel," }],
        ["searchFields is separated by semicolons", { query: "nursing", searchFields: "preferredLabel;description" }],
        ["searchFields is null", { query: "nursing", searchFields: null }],
      ])("(Failure) Reject the search parameters when %s", (_description, givenQueryParams) => {
        // WHEN the query params are validated against the schema
        const actual = validateOccupationGroupGETQuery(givenQueryParams as object);
        // THEN expect them to be invalid
        expect(actual.valid).toBe(false);
      });
    });
  });
});
