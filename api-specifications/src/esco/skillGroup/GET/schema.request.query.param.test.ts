import Ajv from "ajv";
import addFormats from "ajv-formats";
import { getTestBase64String, getTestString } from "_test_utilities/specialCharacters";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import {
  testBooleanField,
  testCursorField,
  testLimitField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import { getMockId } from "_test_utilities/mockMongoId";

import SkillGroupGETAPISpecs from "./index";
import SkillGroupEnums from "../_shared/enums";
import SkillGroupConstants from "../_shared/constants";

/**
 * Compiles the GET query-param schema and validates the given object against it.
 * Used to assert the `query`/`searchFields` search parameters (optional fields with an inter-field
 * `allOf` constraint), which the shared single-field helpers do not cover.
 */
function validateSkillGroupGETQuery(givenObject: object): { valid: boolean } {
  const ajv = new Ajv({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(SkillGroupGETAPISpecs.Schemas.Request.Query.Payload);
  return { valid: validate(givenObject) as boolean };
}

describe("Test SkillGroupGETAPISpecs.Schemas.GET.Request.Query validity", () => {
  // WHEN the SkillGroupGETAPISpecs.GET.Request.Query schema
  // THEN expect the givenSchema to be valid
  testValidSchema(
    "SkillGroupGETAPISpecs.Schemas.GET.Request.Query.Payload",
    SkillGroupGETAPISpecs.Schemas.Request.Query.Payload
  );
});

describe("Test objects against the SkillGroupGETAPISpecs.Schemas.GET.Request.Query.Payload schema", () => {
  // GIVEN a valid GET Request Query object
  const givenValidSkillGroupGetQueryParameter = {
    limit: 10,
    cursor: getTestBase64String(SkillGroupGETAPISpecs.Constants.MAX_CURSOR_LENGTH),
    root: true,
  };

  const givenValidSkillGroupGetQueryParameterWithChildrenFilter = {
    ...givenValidSkillGroupGetQueryParameter,
    childrenIds: `${getMockId(1)};${getMockId(2)}`,
    childrenType: SkillGroupEnums.Relations.Children.ObjectTypes.SkillGroup,
  };

  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "SkillGroupGETAPISpecs.Schemas.GET.Request.Query.Payload",
    SkillGroupGETAPISpecs.Schemas.Request.Query.Payload,
    givenValidSkillGroupGetQueryParameter
  );

  testSchemaWithValidObject(
    "SkillGroupGETAPISpecs.Schemas.GET.Request.Query.Payload",
    SkillGroupGETAPISpecs.Schemas.Request.Query.Payload,
    givenValidSkillGroupGetQueryParameterWithChildrenFilter
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "SkillGroupGETAPISpecs.Schemas.GET.Request.Query.Payload",
    SkillGroupGETAPISpecs.Schemas.Request.Query.Payload,
    { ...givenValidSkillGroupGetQueryParameterWithChildrenFilter, extraProperty: "foo" }
  );

  describe("Validate SkillGroupGETAPISpecs.Schemas.Request.Query.Payload fields", () => {
    describe("Test validation of 'limit'", () => {
      testLimitField<SkillGroupGETAPISpecs.Types.Request.Query.Payload>(
        "limit",
        SkillGroupGETAPISpecs.Constants.MAX_LIMIT,
        SkillGroupGETAPISpecs.Schemas.Request.Query.Payload,
        [],
        false
      );
    });
    describe("Test validate of 'cursor'", () => {
      testCursorField<SkillGroupGETAPISpecs.Types.Request.Query.Payload>(
        "cursor",
        SkillGroupGETAPISpecs.Constants.MAX_CURSOR_LENGTH,
        SkillGroupGETAPISpecs.Schemas.Request.Query.Payload,
        [],
        false,
        false
      );
    });
    describe("Test validate of 'root'", () => {
      testBooleanField("root", SkillGroupGETAPISpecs.Schemas.Request.Query.Payload, [], false);
    });
    describe("Test validate of 'childrenIds'", () => {
      const givenSchema = SkillGroupGETAPISpecs.Schemas.Request.Query.Payload;
      test.each([
        [
          CaseType.Failure,
          "childrenIds only",
          { ...givenValidSkillGroupGetQueryParameter, childrenIds: getMockId(1) },
          constructSchemaError("", "required", "must have required property 'childrenType'"),
        ],
        [
          CaseType.Failure,
          "null",
          { ...givenValidSkillGroupGetQueryParameterWithChildrenFilter, childrenIds: null },
          constructSchemaError("/childrenIds", "type", "must be string"),
        ],
        [
          CaseType.Failure,
          "invalid pattern",
          { ...givenValidSkillGroupGetQueryParameterWithChildrenFilter, childrenIds: "foo" },
          constructSchemaError("/childrenIds", "pattern", 'must match pattern "^[0-9a-f]{24}(;[0-9a-f]{24})*$"'),
        ],
        [
          CaseType.Success,
          "single id",
          { ...givenValidSkillGroupGetQueryParameterWithChildrenFilter, childrenIds: getMockId(1) },
          undefined,
        ],
        [
          CaseType.Success,
          "multiple ids",
          {
            ...givenValidSkillGroupGetQueryParameterWithChildrenFilter,
            childrenIds: `${getMockId(1)};${getMockId(2)}`,
          },
          undefined,
        ],
      ])("%s Validate 'childrenIds' when it is %s", (caseType, _description, givenObject, failureMessage) => {
        assertCaseForProperty("childrenIds", givenObject, givenSchema, caseType, failureMessage);
      });
    });
    describe("Test validate of 'childrenType'", () => {
      const givenSchema = SkillGroupGETAPISpecs.Schemas.Request.Query.Payload;
      test.each([
        [
          CaseType.Failure,
          "childrenType only",
          {
            ...givenValidSkillGroupGetQueryParameter,
            childrenType: SkillGroupEnums.Relations.Children.ObjectTypes.Skill,
          },
          constructSchemaError("", "required", "must have required property 'childrenIds'"),
        ],
        [
          CaseType.Failure,
          "null",
          { ...givenValidSkillGroupGetQueryParameterWithChildrenFilter, childrenType: null },
          constructSchemaError("/childrenType", "type", "must be string"),
        ],
        [
          CaseType.Failure,
          "invalid enum",
          { ...givenValidSkillGroupGetQueryParameterWithChildrenFilter, childrenType: "foo" },
          constructSchemaError("/childrenType", "enum", "must be equal to one of the allowed values"),
        ],
        [
          CaseType.Success,
          "skill",
          {
            ...givenValidSkillGroupGetQueryParameterWithChildrenFilter,
            childrenType: SkillGroupEnums.Relations.Children.ObjectTypes.Skill,
          },
          undefined,
        ],
        [
          CaseType.Success,
          "skillgroup",
          {
            ...givenValidSkillGroupGetQueryParameterWithChildrenFilter,
            childrenType: SkillGroupEnums.Relations.Children.ObjectTypes.SkillGroup,
          },
          undefined,
        ],
      ])("%s Validate 'childrenType' when it is %s", (caseType, _description, givenObject, failureMessage) => {
        assertCaseForProperty("childrenType", givenObject, givenSchema, caseType, failureMessage);
      });
    });

    describe("Test validation of the search parameters 'query' and 'searchFields'", () => {
      test.each([
        ["query only", { query: "software developer" }],
        ["query with a single searchField", { query: "software", searchFields: "preferredLabel" }],
        [
          "query with multiple searchFields",
          { query: "software", searchFields: "preferredLabel,description,altLabels,scopeNote" },
        ],
        ["an empty query", { query: "" }],
        ["a query of the maximum length", { query: getTestString(SkillGroupConstants.SEARCH_VALUE_MAX_LENGTH) }],
        ["no search parameters at all", { limit: SkillGroupGETAPISpecs.Constants.DEFAULT_LIMIT }],
      ])("(Success) Validate the search parameters when they are %s", (_description, givenQueryParams) => {
        // WHEN the query params are validated against the schema
        const actual = validateSkillGroupGETQuery(givenQueryParams);
        // THEN expect them to be valid
        expect(actual.valid).toBe(true);
      });

      test.each([
        ["query is longer than the maximum", { query: getTestString(SkillGroupConstants.SEARCH_VALUE_MAX_LENGTH + 1) }],
        ["query is null", { query: null }],
        ["searchFields is set without a query", { searchFields: "preferredLabel" }],
        ["searchFields contains an unknown field", { query: "software", searchFields: "unknownField" }],
        ["searchFields has a trailing comma", { query: "software", searchFields: "preferredLabel," }],
        ["searchFields is separated by semicolons", { query: "software", searchFields: "preferredLabel;description" }],
        ["searchFields is null", { query: "software", searchFields: null }],
      ])("(Failure) Reject the search parameters when %s", (_description, givenQueryParams) => {
        // WHEN the query params are validated against the schema
        const actual = validateSkillGroupGETQuery(givenQueryParams as object);
        // THEN expect them to be invalid
        expect(actual.valid).toBe(false);
      });
    });
  });
});
