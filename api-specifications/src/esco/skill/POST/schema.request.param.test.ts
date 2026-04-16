import {
  testObjectIdField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import SkillAPISpecs from "../index";
import { getMockId } from "_test_utilities/mockMongoId";

describe("Test SkillAPISpecs.Schemas.POST.Request.Param validity", () => {
  // WHEN the SkillAPISpecs.POST.Request.Param schema
  // THEN expect the givenSchema to be valid
  testValidSchema("SkillAPISpecs.POST.Schemas.Request.Param.Payload", SkillAPISpecs.POST.Schemas.Request.Param.Payload);
});

describe("Test objects against the SkillAPISpecs.POST.Schemas.Request.Param.Payload schema", () => {
  // GIVEN a valid POST Request Param object
  const givenValidSkillPOSTRequestParamPayload = {
    modelId: getMockId(1),
  };

  //WHEN the object is validated
  //THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "SkillAPISpecs.POST.Schemas.Request.Param.Payload",
    SkillAPISpecs.POST.Schemas.Request.Param.Payload,
    givenValidSkillPOSTRequestParamPayload
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "SkillAPISpecs.POST.Schemas.Request.Param.Payload",
    SkillAPISpecs.POST.Schemas.Request.Param.Payload,
    { ...givenValidSkillPOSTRequestParamPayload, extraProperty: "foo" }
  );

  describe("Validate SkillAPISpecs.POST.Schemas.Request.Param.Payload fields", () => {
    describe("Test validation of 'modelId'", () => {
      testObjectIdField("modelId", SkillAPISpecs.POST.Schemas.Request.Param.Payload);
    });
  });
});
