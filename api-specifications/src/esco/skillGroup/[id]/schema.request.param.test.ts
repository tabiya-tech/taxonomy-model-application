import {
  testObjectIdField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import SkillGroupDetailAPISpecs from "./index";
import { getMockId } from "_test_utilities/mockMongoId";

describe("Test SkillGroupDetailAPISpecs.Schemas.GET.Request.ById.Param validity", () => {
  // WHEN the SkillGroupDetailAPISpecs.Schemas.GET.Request.ById.Param schema
  // THEN expect the givenSchema to be valid
  testValidSchema(
    "SkillGroupDetailAPISpecs.Schemas.Request.Param.Payload",
    SkillGroupDetailAPISpecs.Schemas.Request.Param.Payload
  );
});

describe("Test objects against the SkillGroupDetailAPISpecs.Schemas.Request.Param.Payload schema", () => {
  // GIVEN a valid GET ById Request Param object
  const givenValidSkillGroupGETByIdRequestParamPayload = {
    modelId: getMockId(1),
    id: getMockId(2),
  };

  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "SkillGroupDetailAPISpecs.Schemas.Request.Param.Payload",
    SkillGroupDetailAPISpecs.Schemas.Request.Param.Payload,
    givenValidSkillGroupGETByIdRequestParamPayload
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "SkillGroupDetailAPISpecs.Schemas.Request.Param.Payload",
    SkillGroupDetailAPISpecs.Schemas.Request.Param.Payload,
    { ...givenValidSkillGroupGETByIdRequestParamPayload, extraProperty: "foo" }
  );

  describe("Validate SkillGroupDetailAPISpecs.Schemas.Request.Param.Payload fields", () => {
    describe("Test validation of 'modelId'", () => {
      testObjectIdField("modelId", SkillGroupDetailAPISpecs.Schemas.Request.Param.Payload);
    });

    describe("Test validation of 'id'", () => {
      testObjectIdField("id", SkillGroupDetailAPISpecs.Schemas.Request.Param.Payload);
    });
  });
});
