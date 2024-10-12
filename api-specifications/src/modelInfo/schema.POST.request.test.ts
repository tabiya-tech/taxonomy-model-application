import {
  testNonEmptyStringField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testStringField,
  testUUIDArray,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import ModelInfoAPISpecs from "./index";
import ModelInfoConstants from "./constants";
import { getTestString } from "_test_utilities/specialCharacters";
import { randomUUID } from "crypto";
import LocaleAPISpecs from "locale";

describe("Test ModelInfoAPISpecs Schema validity", () => {
  // WHEN the ModelInfoAPISpecs.POST.Response.Schema.Payload schema
  // THEN expect the givenSchema to be valid
  testValidSchema(
    "ModelInfoAPISpecs.Schemas.POST.Response.Schema.Payload",
    ModelInfoAPISpecs.Schemas.POST.Response.Payload,
    [LocaleAPISpecs.Schemas.Payload]
  );
});

describe("Test objects against the ModelInfoAPISpecs.Schemas.POST.Request.Payload schema", () => {
  // GIVEN a valid ModelInfoPOSTRequest object
  const givenValidModelInfoPOSTRequest = {
    name: getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
    description: getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
    license: getTestString(ModelInfoAPISpecs.Constants.LICENSE_MAX_LENGTH),
    UUIDHistory: [randomUUID()],
    locale: {
      name: getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
      UUID: randomUUID(),
      shortCode: getTestString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
    },
  };

  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "ModelInfoAPISpecs.Schemas.POST.Request.Payload",
    ModelInfoAPISpecs.Schemas.POST.Request.Payload,
    givenValidModelInfoPOSTRequest,
    [LocaleAPISpecs.Schemas.Payload]
  );

  // GIVEN the object has an empty UUIDHistory
  const givenModelInfoPOSTRequestWithEmptyUUIDHistory = { ...givenValidModelInfoPOSTRequest };
  givenModelInfoPOSTRequestWithEmptyUUIDHistory.UUIDHistory = [];
  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "ModelInfoAPISpecs.Schemas.POST.Request.Payload",
    ModelInfoAPISpecs.Schemas.POST.Request.Payload,
    givenModelInfoPOSTRequestWithEmptyUUIDHistory,
    [LocaleAPISpecs.Schemas.Payload]
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "ModelInfoAPISpecs.Schemas.POST.Request.Payload",
    ModelInfoAPISpecs.Schemas.POST.Request.Payload,
    givenValidModelInfoPOSTRequest,
    [LocaleAPISpecs.Schemas.Payload]
  );

  describe("Validate ModelInfoAPISpecs.Schemas.POST.Request.Payload fields", () => {
    describe("Test validation of 'name'", () => {
      testNonEmptyStringField<ModelInfoAPISpecs.Types.POST.Request.Payload>(
        "name",
        ModelInfoConstants.NAME_MAX_LENGTH,
        ModelInfoAPISpecs.Schemas.POST.Request.Payload,
        [LocaleAPISpecs.Schemas.Payload]
      );
    });

    describe("Test validation of 'description'", () => {
      testStringField<ModelInfoAPISpecs.Types.POST.Request.Payload>(
        "description",
        ModelInfoConstants.DESCRIPTION_MAX_LENGTH,
        ModelInfoAPISpecs.Schemas.POST.Request.Payload,
        [LocaleAPISpecs.Schemas.Payload]
      );
    });

    describe("Test validation of 'license'", () => {
      testStringField<ModelInfoAPISpecs.Types.POST.Request.Payload>(
        "license",
        ModelInfoConstants.LICENSE_MAX_LENGTH,
        ModelInfoAPISpecs.Schemas.POST.Request.Payload,
        [LocaleAPISpecs.Schemas.Payload]
      );
    });

    describe("Test validation of 'UUIDHistory'", () => {
      testUUIDArray<ModelInfoAPISpecs.Types.POST.Request.Payload>(
        "UUIDHistory",
        ModelInfoAPISpecs.Schemas.POST.Request.Payload,
        [LocaleAPISpecs.Schemas.Payload]
      );
    });
  });
});
