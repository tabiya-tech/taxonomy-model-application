import UUIDHistoryAPISpecs from "./index";
import { getMockId } from "_test_utilities/mockMongoId";
import {
  testObjectIdField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";

describe("Test UUIDHistoryAPISpecs Schema validity", () => {
  // WHEN the UUIDHistoryAPISpecs.Schemas.GET.Request.Schema.Payload schema
  // THEN expect the givenSchema to be valid
  testValidSchema("UUIDHistoryAPISpecs.Schemas.GET.Request.Payload", UUIDHistoryAPISpecs.Schemas.GET.Request.Payload);
});

describe("Test objects against the UUIDHistoryAPISpecs.Schemas.GET.Request.Payload schema", () => {
  // GIVEN the valid UUIDHistoryRequest object
  const givenValidUUIDHistoryRequest: UUIDHistoryAPISpecs.Types.GET.Request.Payload = {
    modelId: getMockId(2),
  };

  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "UUIDHistoryAPISpecs.Schemas.GET.Request.Payload",
    UUIDHistoryAPISpecs.Schemas.GET.Request.Payload,
    givenValidUUIDHistoryRequest
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "UUIDHistoryAPISpecs.Schemas.GET.Request.Payload",
    UUIDHistoryAPISpecs.Schemas.GET.Request.Payload,
    givenValidUUIDHistoryRequest
  );

  describe("Validate UUIDHistoryAPISpecs.Schemas.GET.Request.Payload field", () => {
    describe("Test validation of modelId", () => {
      testObjectIdField("modelId", UUIDHistoryAPISpecs.Schemas.GET.Request.Payload);
    });
  });
});
