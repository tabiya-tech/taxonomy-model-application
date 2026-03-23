import {
  testObjectIdField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import OccupationGroupDetailAPISpecs from "./";
import { getMockId } from "_test_utilities/mockMongoId";

describe("Test OccupationGroupDetailAPISpecs.Schemas.Request.Param validity", () => {
  // WHEN the OccupationGroupDetailAPISpecs.Schemas.Request.Param schema
  // THEN expect the givenSchema to be valid
  testValidSchema(
    "OccupationGroupDetailAPISpecs.Schemas.Request.Param.Payload",
    OccupationGroupDetailAPISpecs.Schemas.Request.Param.Payload
  );
});

describe("Test objects against the OccupationGroupDetailAPISpecs.Schemas.Request.Param.Payload schema", () => {
  // GIVEN a valid Request Param object
  const givenValidOccupationGroupDetailRequestParamPayload = {
    modelId: getMockId(1),
    id: getMockId(2),
  };

  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "OccupationGroupDetailAPISpecs.Schemas.Request.Param.Payload",
    OccupationGroupDetailAPISpecs.Schemas.Request.Param.Payload,
    givenValidOccupationGroupDetailRequestParamPayload
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "OccupationGroupDetailAPISpecs.Schemas.Request.Param.Payload",
    OccupationGroupDetailAPISpecs.Schemas.Request.Param.Payload,
    { ...givenValidOccupationGroupDetailRequestParamPayload, extraProperty: "foo" }
  );

  describe("Validate OccupationGroupDetailAPISpecs.Schemas.Request.Param.Payload fields", () => {
    describe("Test validation of 'modelId'", () => {
      testObjectIdField("modelId", OccupationGroupDetailAPISpecs.Schemas.Request.Param.Payload);
    });

    describe("Test validation of 'id'", () => {
      testObjectIdField("id", OccupationGroupDetailAPISpecs.Schemas.Request.Param.Payload);
    });
  });
});
