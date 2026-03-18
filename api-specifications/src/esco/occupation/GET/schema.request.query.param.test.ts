import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
  testLimitField,
  testCursorField,
} from "_test_utilities/stdSchemaTests";
import { getTestBase64String } from "_test_utilities/specialCharacters";

import OccupationAPISpecs from "../index";

describe("Test OccupationAPISpecs.GETOccupations.Schemas.Request.Query validity", () => {
  // WHEN the OccupationAPISpecs.GET.Request.Query schema
  // THEN expect the givenSchema to be valid
  testValidSchema(
    "OccupationAPISpecs.GETOccupations.Schemas.Request.Query.Payload",
    OccupationAPISpecs.GETOccupations.Schemas.Request.Query.Payload
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
    OccupationAPISpecs.GETOccupations.Schemas.Request.Query.Payload,
    givenValidQuery
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "OccupationAPISpecs.GETOccupations.Schemas.Request.Query.Payload",
    OccupationAPISpecs.GETOccupations.Schemas.Request.Query.Payload,
    { ...givenValidQuery, extraProperty: "foo" }
  );

  describe("Validate OccupationAPISpecs.GETOccupations.Schemas.Request.Query.Payload fields", () => {
    describe("Test validation of 'limit'", () => {
      testLimitField<OccupationAPISpecs.GETOccupations.Types.Request.Query.Payload>(
        "limit",
        OccupationAPISpecs.Constants.MAX_LIMIT,
        OccupationAPISpecs.GETOccupations.Schemas.Request.Query.Payload,
        [],
        false
      );
    });

    describe("Test validation of 'cursor'", () => {
      testCursorField<OccupationAPISpecs.GETOccupations.Types.Request.Query.Payload>(
        "cursor",
        OccupationAPISpecs.Constants.MAX_CURSOR_LENGTH,
        OccupationAPISpecs.GETOccupations.Schemas.Request.Query.Payload,
        [],
        false,
        false
      );
    });
  });
});
