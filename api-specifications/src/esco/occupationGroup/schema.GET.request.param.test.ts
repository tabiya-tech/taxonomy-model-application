import {
  testObjectIdField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import OccupationGroupAPISpecs from "./index";
import { getMockId } from "_test_utilities/mockMongoId";

// ----------------------------------------------
// Test GET Request Param schema
// ----------------------------------------------

describe("Test OccupationGroupAPISpecs.Schemas.GET.Request.Param validity", () => {
  // WHEN the OccupationGroupAPISpecs.GET.Request.Param schema
  // THEN expect the givenSchema to be valid
  testValidSchema(
    "OccupationGroupAPISpecs.Schemas.GET.Request.Param.Payload",
    OccupationGroupAPISpecs.Schemas.GET.Request.Param.Payload
  );
});

describe("Test objects against the OccupationGroupAPISpecs.Schemas.GET.Request.Param.Payload schema", () => {
  // GIVEN a valid GET Request Param object
  const givenValidOccupationGroupGETRequestParamPayload = {
    modelId: getMockId(1),
  };

  //WHEN the object is validated
  //THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "OccupationGroupAPISpecs.Schemas.GET.Request.Param.Payload",
    OccupationGroupAPISpecs.Schemas.GET.Request.Param.Payload,
    givenValidOccupationGroupGETRequestParamPayload
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "OccupationGroupAPISpecs.Schemas.GET.Request.Param.Payload",
    OccupationGroupAPISpecs.Schemas.GET.Request.Param.Payload,
    { ...givenValidOccupationGroupGETRequestParamPayload, extraProperty: "foo" }
  );

  describe("Validate OccupationGroupAPISpecs.Schemas.GET.Request.Param.Payload fields", () => {
    describe("Test validation of 'modelId'", () => {
      testObjectIdField("modelId", OccupationGroupAPISpecs.Schemas.GET.Request.Param.Payload);
    });
  });
});
