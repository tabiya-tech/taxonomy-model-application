import {
  testObjectIdField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import OccupationGroupGETAPISpecs from "./index";
import { getMockId } from "_test_utilities/mockMongoId";

describe("Test OccupationGroupGETAPISpecs.Schemas.Request.Param validity", () => {
  // WHEN the OccupationGroupAPISpecs.GET.Request.Param schema
  // THEN expect the givenSchema to be valid
  testValidSchema(
    "OccupationGroupGETAPISpecs.Schemas.Request.Param.Payload",
    OccupationGroupGETAPISpecs.Schemas.Request.Param.Payload
  );
});

describe("Test objects against the OccupationGroupGETAPISpecs.Schemas.Request.Param.Payload schema", () => {
  // GIVEN a valid GET Request Param object
  const givenValidOccupationGroupGETRequestParamPayload = {
    modelId: getMockId(1),
  };

  //WHEN the object is validated
  //THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "OccupationGroupGETAPISpecs.Schemas.Request.Param.Payload",
    OccupationGroupGETAPISpecs.Schemas.Request.Param.Payload,
    givenValidOccupationGroupGETRequestParamPayload
  );
  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "OccupationGroupGETAPISpecs.Schemas.Request.Param.Payload",
    OccupationGroupGETAPISpecs.Schemas.Request.Param.Payload,
    { ...givenValidOccupationGroupGETRequestParamPayload, extraProperty: "foo" }
  );

  describe("Validate OccupationGroupGETAPISpecs.Schemas.Request.Param.Payload fields", () => {
    describe("Test validation of 'modelId'", () => {
      testObjectIdField("modelId", OccupationGroupGETAPISpecs.Schemas.Request.Param.Payload);
    });
  });
});
