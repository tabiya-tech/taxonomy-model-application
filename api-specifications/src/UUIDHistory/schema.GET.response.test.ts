import UUIDHistoryAPISpecs from "./index";
import { getMockId } from "_test_utilities/mockMongoId";
import { randomUUID } from "crypto";
import { getTestString } from "_test_utilities/specialCharacters";
import {
  testArraySchemaFailureWithValidObject,
  testNonEmptyStringField,
  testObjectIdField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testStringField,
  testUUIDField,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";

describe("Test UUIDHistoryAPISpecs Schema validity", () => {
  // WHEN the UUIDHistoryAPISpecs.Schemas.GET.Response.Schema.Payload schema
  // THEN expect the givenSchema to be valid
  testValidSchema("UUIDHistoryAPISpecs.Schemas.GET.Response.Payload", UUIDHistoryAPISpecs.Schemas.GET.Response.Payload);
});

describe("Test objects against the UUIDHistoryAPISpecs.Schemas.GET.Response.Payload schema", () => {
  // GIVEN the valid UUIDHistoryResponse object
  const givenValidUUIDHistoryResponse = {
    modelId: getMockId(2),
    UUID: randomUUID(),
    name: getTestString(UUIDHistoryAPISpecs.Constants.NAME_MAX_LENGTH),
    version: getTestString(UUIDHistoryAPISpecs.Constants.VERSION_MAX_LENGTH),
    localeShortCode: getTestString(UUIDHistoryAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
  };

  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "UUIDHistoryAPISpecs.Schemas.GET.Response.Payload",
    UUIDHistoryAPISpecs.Schemas.GET.Response.Payload,
    [givenValidUUIDHistoryResponse]
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "UUIDHistoryAPISpecs.Schemas.GET.Response.Payload",
    UUIDHistoryAPISpecs.Schemas.GET.Response.Payload,
    [givenValidUUIDHistoryResponse]
  );

  // AND WHEN the schema is called with an object instead of an array
  // THEN expect the object not to validate
  testArraySchemaFailureWithValidObject(
    "UUIDHistoryAPISpecs.Schemas.GET.Response.Payload",
    UUIDHistoryAPISpecs.Schemas.GET.Response.Payload,
    givenValidUUIDHistoryResponse
  );

  describe("Validate UUIDHistoryAPISpecs.Schemas.GET.Response.Payload field", () => {
    // spread the items of the schema into the schema itself
    // we do this because we want to test the fields, not the fact that they are in an array
    // and in cases where we use reusable test functions we do not have control over the givenObject
    const { items, ...rest } = UUIDHistoryAPISpecs.Schemas.GET.Response.Payload;
    const givenSchema = { ...rest, ...items };

    describe("Test validation of 'modelId'", () => {
      testObjectIdField("modelId", givenSchema);
    });

    describe("Test validation of 'UUID'", () => {
      testUUIDField("UUID", givenSchema);
    });

    describe("Test validation of 'name'", () => {
      testNonEmptyStringField("name", UUIDHistoryAPISpecs.Constants.NAME_MAX_LENGTH, givenSchema);
    });

    describe("Test validation of 'version'", () => {
      testStringField<UUIDHistoryAPISpecs.Types.GET.Response.Payload>(
        "version",
        UUIDHistoryAPISpecs.Constants.NAME_MAX_LENGTH,
        givenSchema
      );
    });

    describe("Test validation of 'localeShortCode'", () => {
      testNonEmptyStringField(
        "localeShortCode",
        UUIDHistoryAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH,
        givenSchema
      );
    });
  });
});
