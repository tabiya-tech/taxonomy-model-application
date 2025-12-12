import {
  testObjectIdField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import SkillGroupAPISpecs from "./index";
import { getMockId } from "_test_utilities/mockMongoId";

describe("Test SkillGroupAPISpecs.Schemas.GET.Request.Param validity", () => {
  // WHEN the SkillGroupAPISpecs.GET.Request.Param schema
  // THEN expect the givenSchema to be valid
  testValidSchema(
    "SkillGroupAPISpecs.Schemas.GET.Request.Param.Payload",
    SkillGroupAPISpecs.Schemas.GET.Request.Param.Payload
  );
});

describe("Test objects against the SkillGroupAPISpecs.Schemas.GET.Request.Param.Payload schema", () => {
  // GIVEN a valid GET Request Param object
  const givenValidSkillGroupGETRequestParamPayload = {
    modelId: getMockId(1),
  };

  //WHEN the object is validated
  //THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "SkillGroupAPISpecs.Schemas.GET.Request.Param.Payload",
    SkillGroupAPISpecs.Schemas.GET.Request.Param.Payload,
    givenValidSkillGroupGETRequestParamPayload
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "SkillGroupAPISpecs.Schemas.GET.Request.Param.Payload",
    SkillGroupAPISpecs.Schemas.GET.Request.Param.Payload,
    { ...givenValidSkillGroupGETRequestParamPayload, extraProperty: "foo" }
  );

  describe("Validate SkillGroupAPISpecs.Schemas.GET.Request.Param.Payload fields", () => {
    describe("Test validation of 'modelId'", () => {
      testObjectIdField("modelId", SkillGroupAPISpecs.Schemas.GET.Request.Param.Payload);
    });
  });
});
