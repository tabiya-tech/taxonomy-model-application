import {
  testObjectIdField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";

import { getMockId } from "_test_utilities/mockMongoId";
import SkillAPISpecs from "./index";

describe("Test Skill GET Request ById Param Schema Validity", () => {
  // WHEN the SkillAPISpecs.Schemas.GET.Request.ById.Param schema
  // THEN expect the givenSchema to be valid
  testValidSchema(
    "SkillAPISpecs.Schemas.GET.Request.ById.Param.Payload",
    SkillAPISpecs.Schemas.GET.Request.ById.Param.Payload
  );
});

describe("Test objects against the SkillAPISpecs.Schemas.GET.Request.ById.Param schema", () => {
  // GIVEN a valid skill GET request ById param object
  const givenValidSkillGETRequestByIdParam = {
    modelId: getMockId(1),
    id: getMockId(2),
  };

  // Test with a valid request param
  testSchemaWithValidObject(
    "SkillAPISpecs.Schemas.GET.Request.ById.Param.Payload",
    SkillAPISpecs.Schemas.GET.Request.ById.Param.Payload,
    givenValidSkillGETRequestByIdParam
  );

  // Test with additional properties in the request param
  testSchemaWithAdditionalProperties(
    "SkillAPISpecs.Schemas.GET.Request.ById.Param.Payload",
    SkillAPISpecs.Schemas.GET.Request.ById.Param.Payload,
    {
      ...givenValidSkillGETRequestByIdParam,
      extraProperty: "extra test property (not defined in schema) for testing additionalProperties",
    }
  );

  describe("Validate SkillAPISpecs.Schemas.GET.Request.ById.Param.Payload fields", () => {
    describe("Test validation of 'modelId'", () => {
      testObjectIdField("modelId", SkillAPISpecs.Schemas.GET.Request.ById.Param.Payload);
    });

    describe("Test validation of 'id'", () => {
      testObjectIdField("id", SkillAPISpecs.Schemas.GET.Request.ById.Param.Payload);
    });
  });
});
