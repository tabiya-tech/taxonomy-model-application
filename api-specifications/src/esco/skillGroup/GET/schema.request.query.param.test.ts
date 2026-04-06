import {
  testCursorField,
  testLimitField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";

import SkillGroupGETAPISpecs from "./index";
import { getTestBase64String } from "_test_utilities/specialCharacters";

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
  };

  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "SkillGroupGETAPISpecs.Schemas.GET.Request.Query.Payload",
    SkillGroupGETAPISpecs.Schemas.Request.Query.Payload,
    givenValidSkillGroupGetQueryParameter
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "SkillGroupGETAPISpecs.Schemas.GET.Request.Query.Payload",
    SkillGroupGETAPISpecs.Schemas.Request.Query.Payload,
    { ...givenValidSkillGroupGetQueryParameter, extraProperty: "foo" }
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
  });
});
