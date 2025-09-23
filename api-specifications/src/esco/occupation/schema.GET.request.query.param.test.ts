import {
  testNonEmptyStringField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import { getTestBase64String } from "_test_utilities/specialCharacters";

import OccupationAPISpecs from "./index";

describe("Test OccupationAPISpecs.Schemas.GET.Request.Query validity", () => {
  // WHEN the OccupationAPISpecs.GET.Request.Query schema
  // THEN expect the givenSchema to be valid
  testValidSchema(
    "OccupationAPISpecs.Schemas.GET.Request.Query.Payload",
    OccupationAPISpecs.Schemas.GET.Request.Query.Payload
  );
});

describe("Test objects against the OccupationAPISpecs.Schemas.GET.Request.Query.Payload schema", () => {
  // GIVEN a valid GET Request Query Param object
  const maxCursor = getTestBase64String(OccupationAPISpecs.Constants.MAX_CURSOR_LENGTH);
  const givenValidQuery = {
    limit: 10,
    next_cursor: maxCursor,
  };

  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "OccupationAPISpecs.Schemas.GET.Request.Query.Payload",
    OccupationAPISpecs.Schemas.GET.Request.Query.Payload,
    givenValidQuery
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "OccupationAPISpecs.Schemas.GET.Request.Query.Payload",
    OccupationAPISpecs.Schemas.GET.Request.Query.Payload,
    { ...givenValidQuery, extraProperty: "foo" }
  );

  describe("Validate OccupationAPISpecs.Schemas.GET.Request.Query.Payload fields", () => {
    describe("Test validation of 'limit'", () => {
      test.each([
        [CaseType.Success, "undefined", undefined, undefined],
        [CaseType.Failure, "null", null, constructSchemaError("/limit", "type", "must be integer")],
        [CaseType.Failure, "stringified number", "10", constructSchemaError("/limit", "type", "must be integer")],
        [CaseType.Failure, "random string", "foo", constructSchemaError("/limit", "type", "must be integer")],
        [CaseType.Failure, "float", 1.1, constructSchemaError("/limit", "type", "must be integer")],
        [CaseType.Failure, "zero", 0, constructSchemaError("/limit", "minimum", "must be >= 1")],
        [
          CaseType.Failure,
          "over max",
          OccupationAPISpecs.Constants.MAX_LIMIT + 1,
          constructSchemaError("/limit", "maximum", `must be <= ${OccupationAPISpecs.Constants.MAX_LIMIT}`),
        ],
        [CaseType.Success, "one", 1, undefined],
        [CaseType.Success, "ten", 10, undefined],
      ])("%s Validate 'limit' when it is %s", (caseType, _description, givenValue, failureMessage) => {
        // GIVEN an object with given value
        const givenObject = { limit: givenValue };

        // THEN export the object to validate accordingly
        assertCaseForProperty(
          "limit",
          givenObject,
          OccupationAPISpecs.Schemas.GET.Request.Query.Payload,
          caseType,
          failureMessage
        );
      });
    });

    describe("Test validation of 'next_cursor'", () => {
      testNonEmptyStringField<OccupationAPISpecs.Types.GET.Request.Query.Payload>(
        "next_cursor",
        OccupationAPISpecs.Constants.MAX_CURSOR_LENGTH,
        OccupationAPISpecs.Schemas.GET.Request.Query.Payload
      );
    });
  });
});
