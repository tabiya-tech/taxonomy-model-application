import {
  testObjectIdField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import SkillGroupPOStAPISpecs from "./index";
import { getMockId } from "_test_utilities/mockMongoId";

describe("Test SkillGroupPOStAPISpecs.Schemas.POST.Request.Param validity", () => {
  // WHEN the SkillGroupPOStAPISpecs.POST.Request.Param schema
  // THEN expect the givenSchema to be valid
  testValidSchema(
    "SkillGroupPOStAPISpecs.Schemas.POST.Request.Param.Payload",
    SkillGroupPOStAPISpecs.Schemas.Request.Param.Payload
  );
});

describe("Test objects against the SkillGroupPOStAPISpecs.Schemas.POST.Request.Param.Payload schema", () => {
  // GIVEN a valid POST Request Param object
  const givenValidSkillGroupPOSTRequestParamPayload = {
    modelId: getMockId(1),
  };

  //WHEN the object is validated
  //THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "SkillGroupPOStAPISpecs.Schemas.POST.Request.Param.Payload",
    SkillGroupPOStAPISpecs.Schemas.Request.Param.Payload,
    givenValidSkillGroupPOSTRequestParamPayload
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "SkillGroupPOStAPISpecs.Schemas.POST.Request.Param.Payload",
    SkillGroupPOStAPISpecs.Schemas.Request.Param.Payload,
    { ...givenValidSkillGroupPOSTRequestParamPayload, extraProperty: "foo" }
  );

  describe("Validate SkillGroupPOStAPISpecs.Schemas.POST.Request.Param.Payload fields", () => {
    describe("Test validation of 'modelId'", () => {
      testObjectIdField("modelId", SkillGroupPOStAPISpecs.Schemas.Request.Param.Payload);
    });
  });
});
