// ----------------------------------------------
// Test GET Request Query Param schema
// ----------------------------------------------

import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import OccupationGroupAPISpecs from ".";
import { getTestBase64String, getTestString } from "_test_utilities/specialCharacters";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";

describe("Test OccupationGroupAPISpecs.Schemas.GET.Request.Query validity", () => {
  // WHEN the OccupationGroupAPISpecs.GET.Request.Query schema
  // THEN expect the givenSchema to be valid
  testValidSchema(
    "OccupationGroupAPISpecs.Schemas.GET.Request.Query.Payload",
    OccupationGroupAPISpecs.Schemas.GET.Request.Query.Payload
  );
});

describe("Test objects against the OccupationGroupAPISpecs.Schemas.GET.Request.Query.Payload schema", () => {
  // GIVEN a valid GET Request Query object
  const givenValidOccupationGroupGetQueryParameter = {
    limit: 10,
    cursor: getTestBase64String(OccupationGroupAPISpecs.Constants.MAX_CURSOR_LENGTH),
  };

  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "OccupationGroupAPISpecs.Schemas.GET.Request.Query.Payload",
    OccupationGroupAPISpecs.Schemas.GET.Request.Query.Payload,
    givenValidOccupationGroupGetQueryParameter
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "OccupationGroupAPISpecs.Schemas.GET.Request.Query.Payload",
    OccupationGroupAPISpecs.Schemas.GET.Request.Query.Payload,
    { ...givenValidOccupationGroupGetQueryParameter, extraProperty: "foo" }
  );

  describe("Validate OccupationGroupAPISpecs.Schemas.GET.Request.Query.Payload fields", () => {
    describe("Test validation of 'limit'", () => {
      test.each([
        [CaseType.Success, "undefined", undefined, undefined],
        [CaseType.Failure, "null", null, constructSchemaError("/limit", "type", "must be integer")],
        [CaseType.Failure, "random string", "10", constructSchemaError("/limit", "type", "must be integer")],
        [CaseType.Failure, "float", 1.1, constructSchemaError("/limit", "type", "must be integer")],
        [CaseType.Failure, "zero", 0, constructSchemaError("/limit", "minimum", "must be >= 1")],
        [
          CaseType.Failure,
          "over max",
          OccupationGroupAPISpecs.Constants.MAX_LIMIT + 1,
          constructSchemaError("/limit", "maximum", `must be <= ${OccupationGroupAPISpecs.Constants.MAX_LIMIT}`),
        ],
        [CaseType.Success, "one", 1, undefined],
        [CaseType.Success, "ten", 10, undefined],
      ])("%s Validate 'limit' when it is %s", (caseType, __description, givenValue, failureMessage) => {
        // GIVEN an object with given value
        const givenObject = {
          limit: givenValue,
        };

        // THEN export the object to validate accordingly
        assertCaseForProperty(
          "limit",
          givenObject,
          OccupationGroupAPISpecs.Schemas.GET.Request.Query.Payload,
          caseType,
          failureMessage
        );
      });
    });
    describe("Test validate of 'cursor'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'cursor'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/cursor", "type", "must be string")],
        [
          CaseType.Failure,
          "too long",
          getTestString(OccupationGroupAPISpecs.Constants.MAX_CURSOR_LENGTH + 1),
          constructSchemaError(
            "/cursor",
            "maxLength",
            `must NOT have more than ${OccupationGroupAPISpecs.Constants.MAX_CURSOR_LENGTH} characters`
          ),
        ],
        [
          CaseType.Success,
          "a valid base64 string",
          getTestBase64String(OccupationGroupAPISpecs.Constants.MAX_CURSOR_LENGTH),
          undefined,
        ],
        [
          CaseType.Success,
          "the longest",
          getTestBase64String(OccupationGroupAPISpecs.Constants.MAX_CURSOR_LENGTH),
          undefined,
        ],
      ])("(%s) Validate 'cursor' when it is %s", (caseType, _description, givenValue, failureMessages) => {
        // GIVEN an object with the given value
        const givenObject = {
          cursor: givenValue,
        };
        // THEN expect the object to validate accordingly
        assertCaseForProperty(
          "cursor",
          givenObject,
          OccupationGroupAPISpecs.Schemas.GET.Request.Query.Payload,
          caseType,
          failureMessages
        );
      });
    });
  });
});
