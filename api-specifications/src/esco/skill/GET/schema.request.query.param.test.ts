import {
  testCursorField,
  testLimitField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";

import { getTestBase64String } from "_test_utilities/specialCharacters";
import SkillAPISpecs from "../index";
import SkillConstants from "../_shared/constants";

describe("Test Skill GET Request Query Param Schema Validity", () => {
  // WHEN the SkillAPISpecs.Schemas.GET.Request.Query.Param schema
  // THEN expect the givenSchema to be valid
  testValidSchema("SkillAPISpecs.GET.Schemas.Request.Query.Payload", SkillAPISpecs.GET.Schemas.Request.Query.Payload);
});

describe("Test objects against the SkillAPISpecs.Schemas.GET.Request.Query.Param schema", () => {
  // GIVEN a valid skill GET request query param object
  const givenValidSkillGETRequestQueryParam = {
    limit: SkillConstants.MAX_LIMIT,
    cursor: getTestBase64String(SkillConstants.MAX_CURSOR_LENGTH),
  };

  // Test with a valid request query param
  testSchemaWithValidObject(
    "SkillAPISpecs.GET.Schemas.Request.Query.Payload",
    SkillAPISpecs.GET.Schemas.Request.Query.Payload,
    givenValidSkillGETRequestQueryParam
  );

  // Test with additional properties in the request query param
  testSchemaWithAdditionalProperties(
    "SkillAPISpecs.GET.Schemas.Request.Query.Payload",
    SkillAPISpecs.GET.Schemas.Request.Query.Payload,
    {
      ...givenValidSkillGETRequestQueryParam,
      extraProperty: "extra test property (not defined in schema) for testing additionalProperties",
    }
  );

  describe("Validate SkillAPISpecs.GET.Schemas.Request.Query.Payload fields", () => {
    describe("Test validation of 'limit'", () => {
      testLimitField<SkillAPISpecs.Types.GETSkills.Request.Query.Payload>(
        "limit",
        SkillAPISpecs.Constants.MAX_LIMIT,
        SkillAPISpecs.GET.Schemas.Request.Query.Payload,
        [],
        false
      );
    });

    describe("Test validate of 'cursor'", () => {
      testCursorField<SkillAPISpecs.Types.GETSkills.Request.Query.Payload>(
        "cursor",
        SkillAPISpecs.Constants.MAX_CURSOR_LENGTH,
        SkillAPISpecs.GET.Schemas.Request.Query.Payload,
        [],
        false,
        false
      );
    });
  });
});
