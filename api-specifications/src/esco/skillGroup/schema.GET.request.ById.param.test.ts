import {
  testObjectIdField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import SkillGroupAPISpecs from "./index";
import { getMockId } from "_test_utilities/mockMongoId";

describe("Test SkillGroupAPISpecs.Schemas.GET.Request.ById.Param validity", () => {
  // WHEN the SkillGroupAPISpecs.Schemas.GET.Request.ById.Param schema
  // THEN expect the givenSchema to be valid
  testValidSchema(
    "SkillGroupAPISpecs.Schemas.GET.Request.ById.Param.Payload",
    SkillGroupAPISpecs.Schemas.GET.Request.ById.Param.Payload
  );
});

describe("Test objects against the SkillGroupAPISpecs.Schemas.GET.Request.ById.Param.Payload schema", () => {
  // GIVEN a valid GET ById Request Param object
  const givenValidSkillGroupGETByIdRequestParamPayload = {
    modelId: getMockId(1),
    id: getMockId(2),
  };

  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "SkillGroupAPISpecs.Schemas.GET.Request.ById.Param.Payload",
    SkillGroupAPISpecs.Schemas.GET.Request.ById.Param.Payload,
    givenValidSkillGroupGETByIdRequestParamPayload
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "SkillGroupAPISpecs.Schemas.GET.Request.ById.Param.Payload",
    SkillGroupAPISpecs.Schemas.GET.Request.ById.Param.Payload,
    { ...givenValidSkillGroupGETByIdRequestParamPayload, extraProperty: "foo" }
  );

  describe("Validate SkillGroupAPISpecs.Schemas.GET.Request.ById.Param.Payload fields", () => {
    describe("Test validation of 'modelId'", () => {
      testObjectIdField("modelId", SkillGroupAPISpecs.Schemas.GET.Request.ById.Param.Payload);
    });

    describe("Test validation of 'id'", () => {
      testObjectIdField("id", SkillGroupAPISpecs.Schemas.GET.Request.ById.Param.Payload);
    });
  });
});
