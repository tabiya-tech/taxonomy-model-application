import {
  testObjectIdField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import OccupationAPISpecs from "./index";
import { getMockId } from "_test_utilities/mockMongoId";

describe("Test OccupationAPISpecs.Schemas.GET.Request.Param validity", () => {
  // WHEN the OccupationAPISpecs.GET.Request.Param schema
  // THEN expect the givenSchema to be valid
  testValidSchema(
    "OccupationAPISpecs.Schemas.GET.Request.Param.Payload",
    OccupationAPISpecs.Schemas.GET.Request.Param.Payload
  );
});

describe("Test objects against the OccupationAPISpecs.Schemas.GET.Request.Param.Payload schema", () => {
  // GIVEN a valid GET Request Param object
  const givenValidOccupationGETRequestParamPayload = {
    modelId: getMockId(1),
  };

  //WHEN the object is validated
  //THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "OccupationAPISpecs.Schemas.GET.Request.Param.Payload",
    OccupationAPISpecs.Schemas.GET.Request.Param.Payload,
    givenValidOccupationGETRequestParamPayload
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "OccupationAPISpecs.Schemas.GET.Request.Param.Payload",
    OccupationAPISpecs.Schemas.GET.Request.Param.Payload,
    { ...givenValidOccupationGETRequestParamPayload, extraProperty: "foo" }
  );

  describe("Validate OccupationAPISpecs.Schemas.GET.Request.Param.Payload fields", () => {
    describe("Test validation of 'modelId'", () => {
      testObjectIdField("modelId", OccupationAPISpecs.Schemas.GET.Request.Param.Payload);
    });
  });
});
