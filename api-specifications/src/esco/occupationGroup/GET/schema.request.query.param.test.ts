import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
  testLimitField,
  testCursorField,
} from "_test_utilities/stdSchemaTests";
import OccupationGroupGETAPISpecs from "./index";
import { getTestBase64String } from "_test_utilities/specialCharacters";

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
  });
});
