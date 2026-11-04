import {
  testObjectIdField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import DELETEOccupationGroupByIdOperation from "./index";
import { getMockId } from "_test_utilities/mockMongoId";

describe("Test DELETEOccupationGroupByIdOperation.Schemas.Request.Param validity", () => {
  // WHEN the DELETEOccupationGroupByIdOperation.Schemas.Request.Param schema
  // THEN expect the givenSchema to be valid
  testValidSchema(
    "DELETEOccupationGroupByIdOperation.Schemas.Request.Param.Payload",
    DELETEOccupationGroupByIdOperation.Schemas.Request.Param.Payload
  );
});

describe("Test objects against the DELETEOccupationGroupByIdOperation.Schemas.Request.Param.Payload schema", () => {
  // GIVEN a valid DELETE Detail Request Param object
  const givenValidOccupationGroupDELETEDetailRequestParamPayload = {
    modelId: getMockId(1),
    id: getMockId(2),
  };

  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "DELETEOccupationGroupByIdOperation.Schemas.Request.Param.Payload",
    DELETEOccupationGroupByIdOperation.Schemas.Request.Param.Payload,
    givenValidOccupationGroupDELETEDetailRequestParamPayload
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "DELETEOccupationGroupByIdOperation.Schemas.Request.Param.Payload",
    DELETEOccupationGroupByIdOperation.Schemas.Request.Param.Payload,
    { ...givenValidOccupationGroupDELETEDetailRequestParamPayload, extraProperty: "foo" }
  );

  describe("Validate DELETEOccupationGroupByIdOperation.Schemas.Request.Param.Payload fields", () => {
    describe("Test validation of 'modelId'", () => {
      testObjectIdField("modelId", DELETEOccupationGroupByIdOperation.Schemas.Request.Param.Payload);
    });

    describe("Test validation of 'id'", () => {
      testObjectIdField("id", DELETEOccupationGroupByIdOperation.Schemas.Request.Param.Payload);
    });
  });
});
