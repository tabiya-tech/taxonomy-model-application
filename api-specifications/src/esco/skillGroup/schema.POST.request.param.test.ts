import {
  testObjectIdField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import SkillGroupAPISpecs from "./index";
import { getMockId } from "_test_utilities/mockMongoId";

describe("Test SkillGroupAPISpecs.Schemas.POST.Request.Param validity", () => {
  // WHEN the SkillGroupAPISpecs.POST.Request.Param schema
  // THEN expect the givenSchema to be valid
  testValidSchema(
    "SkillGroupAPISpecs.Schemas.POST.Request.Param.Payload",
    SkillGroupAPISpecs.Schemas.POST.Request.Param.Payload
  );
});

describe("Test objects against the SkillGroupAPISpecs.Schemas.POST.Request.Param.Payload schema", () => {
  // GIVEN a valid POST Request Param object
  const givenValidSkillGroupPOSTRequestParamPayload = {
    modelId: getMockId(1),
  };

  //WHEN the object is validated
  //THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "SkillGroupAPISpecs.Schemas.POST.Request.Param.Payload",
    SkillGroupAPISpecs.Schemas.POST.Request.Param.Payload,
    givenValidSkillGroupPOSTRequestParamPayload
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "SkillGroupAPISpecs.Schemas.POST.Request.Param.Payload",
    SkillGroupAPISpecs.Schemas.POST.Request.Param.Payload,
    { ...givenValidSkillGroupPOSTRequestParamPayload, extraProperty: "foo" }
  );

  describe("Validate SkillGroupAPISpecs.Schemas.POST.Request.Param.Payload fields", () => {
    describe("Test validation of 'modelId'", () => {
      testObjectIdField("modelId", SkillGroupAPISpecs.Schemas.POST.Request.Param.Payload);
    });
  });
});
