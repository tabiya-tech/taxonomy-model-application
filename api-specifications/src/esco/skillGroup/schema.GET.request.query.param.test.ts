import {
  testCursorField,
  testLimitField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";

import SkillGroupAPISpecs from "./index";
import { getTestBase64String } from "_test_utilities/specialCharacters";

describe("Test SkillGroupAPISpecs.Schemas.GET.Request.Query validity", () => {
  // WHEN the SkillGroupAPISpecs.GET.Request.Query schema
  // THEN expect the givenSchema to be valid
  testValidSchema(
    "SkillGroupAPISpecs.Schemas.GET.Request.Query.Payload",
    SkillGroupAPISpecs.Schemas.GET.Request.Query.Payload
  );
});

describe("Test objects against the SkillGroupAPISpecs.Schemas.GET.Request.Query.Payload schema", () => {
  // GIVEN a valid GET Request Query object
  const givenValidSkillGroupGetQueryParameter = {
    limit: 10,
    cursor: getTestBase64String(SkillGroupAPISpecs.Constants.MAX_CURSOR_LENGTH),
  };

  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "SkillGroupAPISpecs.Schemas.GET.Request.Query.Payload",
    SkillGroupAPISpecs.Schemas.GET.Request.Query.Payload,
    givenValidSkillGroupGetQueryParameter
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "SkillGroupAPISpecs.Schemas.GET.Request.Query.Payload",
    SkillGroupAPISpecs.Schemas.GET.Request.Query.Payload,
    { ...givenValidSkillGroupGetQueryParameter, extraProperty: "foo" }
  );

  describe("Validate SkillGroupAPISpecs.Schemas.GET.Request.Query.Payload fields", () => {
    describe("Test validation of 'limit'", () => {
      testLimitField<SkillGroupAPISpecs.Types.GET.Request.Query.Payload>(
        "limit",
        SkillGroupAPISpecs.Constants.MAX_LIMIT,
        SkillGroupAPISpecs.Schemas.GET.Request.Query.Payload,
        [],
        false
      );
    });
    describe("Test validate of 'cursor'", () => {
      testCursorField<SkillGroupAPISpecs.Types.GET.Request.Query.Payload>(
        "cursor",
        SkillGroupAPISpecs.Constants.MAX_CURSOR_LENGTH,
        SkillGroupAPISpecs.Schemas.GET.Request.Query.Payload,
        [],
        false,
        false
      );
    });
  });
});
