import {
  testObjectIdField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import DELETEOccupationGroupParentOperation from "./index";
import { getMockId } from "_test_utilities/mockMongoId";

describe("Test DELETEOccupationGroupParentOperation.Schemas.Request.Param validity", () => {
  // WHEN the DELETEOccupationGroupParentOperation.Schemas.Request.Param schema
  // THEN expect the givenSchema to be valid
  testValidSchema(
    "DELETEOccupationGroupParentOperation.Schemas.Request.Param.Payload",
    DELETEOccupationGroupParentOperation.Schemas.Request.Param.Payload
  );
});

describe("Test objects against the DELETEOccupationGroupParentOperation.Schemas.Request.Param.Payload schema", () => {
  // GIVEN a valid DELETE Parent Request Param object
  const givenValidOccupationGroupDELETEParentRequestParamPayload = {
    modelId: getMockId(1),
    id: getMockId(2),
  };

  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "DELETEOccupationGroupParentOperation.Schemas.Request.Param.Payload",
    DELETEOccupationGroupParentOperation.Schemas.Request.Param.Payload,
    givenValidOccupationGroupDELETEParentRequestParamPayload
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "DELETEOccupationGroupParentOperation.Schemas.Request.Param.Payload",
    DELETEOccupationGroupParentOperation.Schemas.Request.Param.Payload,
    { ...givenValidOccupationGroupDELETEParentRequestParamPayload, extraProperty: "foo" }
  );

  describe("Validate DELETEOccupationGroupParentOperation.Schemas.Request.Param.Payload fields", () => {
    describe("Test validation of 'modelId'", () => {
      testObjectIdField("modelId", DELETEOccupationGroupParentOperation.Schemas.Request.Param.Payload);
    });

    describe("Test validation of 'id'", () => {
      testObjectIdField("id", DELETEOccupationGroupParentOperation.Schemas.Request.Param.Payload);
    });
  });
});
