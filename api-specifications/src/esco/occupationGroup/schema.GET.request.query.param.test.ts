import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
  testLimitField,
  testCursorField,
} from "_test_utilities/stdSchemaTests";
import OccupationGroupAPISpecs from ".";
import { getTestBase64String } from "_test_utilities/specialCharacters";

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
      testLimitField<OccupationGroupAPISpecs.Types.GET.Request.Query.Payload>(
        "limit",
        OccupationGroupAPISpecs.Constants.MAX_LIMIT,
        OccupationGroupAPISpecs.Schemas.GET.Request.Query.Payload
      );
    });
    describe("Test validate of 'cursor'", () => {
      testCursorField<OccupationGroupAPISpecs.Types.GET.Request.Query.Payload>(
        "cursor",
        OccupationGroupAPISpecs.Constants.MAX_CURSOR_LENGTH,
        OccupationGroupAPISpecs.Schemas.GET.Request.Query.Payload
      );
    });
  });
});
