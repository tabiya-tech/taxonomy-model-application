import {
  testObjectIdField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";

import { getMockId } from "_test_utilities/mockMongoId";
import SkillAPISpecs from "./index";

describe("Test Skill GET Request Param Schema Validity", () => {
  // WHEN the SkillAPISpecs.Schemas.GET.Request.Param schema
  // THEN expect the givenSchema to be valid
  testValidSchema("SkillAPISpecs.Schemas.GET.Request.Param.Payload", SkillAPISpecs.Schemas.GET.Request.Param.Payload);
});

describe("Test objects against the SkillAPISpecs.Schemas.GET.Request.Param schema", () => {
  // GIVEN a valid skill GET request param object
  const givenValidSkillGETRequestParam = {
    modelId: getMockId(1),
  };

  // Test with a valid request param
  testSchemaWithValidObject(
    "SkillAPISpecs.Schemas.GET.Request.Param.Payload",
    SkillAPISpecs.Schemas.GET.Request.Param.Payload,
    givenValidSkillGETRequestParam
  );

  // Test with additional properties in the request param
  testSchemaWithAdditionalProperties(
    "SkillAPISpecs.Schemas.GET.Request.Param.Payload",
    SkillAPISpecs.Schemas.GET.Request.Param.Payload,
    {
      ...givenValidSkillGETRequestParam,
      extraProperty: "extra test property (not defined in schema) for testing additionalProperties",
    }
  );

  describe("Validate SkillAPISpecs.Schemas.GET.Request.Param.Payload fields", () => {
    describe("Test validation of 'modelId'", () => {
      testObjectIdField("modelId", SkillAPISpecs.Schemas.GET.Request.Param.Payload);
    });
  });
});
