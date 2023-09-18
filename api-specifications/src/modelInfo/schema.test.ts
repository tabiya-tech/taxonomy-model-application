import ModelInfoAPISpecs from "./index"
import ImportProcessState from "../importProcessState";
import {randomUUID} from "crypto";
import {getTestString} from "../_test_utilities/specialCharacters";
import {getMockId} from "../_test_utilities/mockMongoId";
import {
  testSchemaWithInvalidObject,
  testSchemaWithValidObject,
  testValidSchema
} from "../_test_utilities/stdSchemaTests";
import LocaleAPISpecs from "../locale";

describe("Test ModelInfoAPISpecs Schema", () => {

  // WHEN the ModelInfoAPISpecs.Schemas.GET.Response.Schema.Payload schema
  // THEN expect the givenSchema to be valid
  testValidSchema("ModelInfoAPISpecs.Schemas.GET.Response.Schema.Payload", ModelInfoAPISpecs.Schemas.GET.Response.Payload, [LocaleAPISpecs.Schemas.Payload])

  // AND WHEN the ModelInfoAPISpecs.POST.Response.Schema.Payload schema
  // THEN expect the givenSchema to be valid
  testValidSchema("ModelInfoAPISpecs.Schemas.POST.Response.Schema.Payload", ModelInfoAPISpecs.Schemas.POST.Response.Payload, [LocaleAPISpecs.Schemas.Payload])

  // AND WHEN the ModelInfoAPISpecs.Schemas.POST.Request.Schema.Payload schemama
  // THEN expect the givenSchema to be valid
  testValidSchema("ModelInfoAPISpecs.Schemas.POST.Request.Schema.Payload", ModelInfoAPISpecs.Schemas.POST.Request.Payload, [LocaleAPISpecs.Schemas.Payload])

})

describe("Validate JSON against the Schema", () => {

   // GIVEN the valid ModelInfoPOSTResponse and ModelInfoPOSTRequest objects
  const givenValidModelInfoPOSTResponse = {
    id: getMockId(1),
    UUID: randomUUID(),
    previousUUID: "",//randomUUID(),
    originUUID: randomUUID(),
    path: "path/to/tabiya",
    tabiyaPath: "/path/to/tabiya",
    name: getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
    description: getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
    locale: {
      name: getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
      UUID: randomUUID(),
      shortCode: getTestString(ModelInfoAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH)
    },
    releaseNotes: getTestString(ModelInfoAPISpecs.Constants.RELEASE_NOTES_MAX_LENGTH),
    released: false,
    version: getTestString(ModelInfoAPISpecs.Constants.VERSION_MAX_LENGTH),
    importProcessState: {
      id: getMockId(1),
      status: ImportProcessState.Enums.Status.PENDING,
      result: {
        errored: false,
        parsingErrors: false,
        parsingWarnings: false,
      }
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  const givenValidModelInfoPOSTRequest = {
    name: getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
    description: getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
    locale: {
      name: getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
      UUID: randomUUID(),
      shortCode: getTestString(ModelInfoAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH)
    }
  }
  
  describe("Test against the ModelInfoAPISpecs.Schemas.GET.Response.Payload schema", () => {
    // WHEN the object is validated
    // THEN expect the object to validate successfully
    testSchemaWithValidObject("ModelInfoAPISpecs.Schemas.GET.Response.Payload", ModelInfoAPISpecs.Schemas.GET.Response.Payload, [givenValidModelInfoPOSTResponse], [LocaleAPISpecs.Schemas.Payload])

    // AND WHEN the object has additional properties
    // THEN expect the object to not validate
    testSchemaWithInvalidObject("ModelInfoAPISpecs.Schemas.GET.Response.Payload", ModelInfoAPISpecs.Schemas.GET.Response.Payload, [givenValidModelInfoPOSTResponse], [LocaleAPISpecs.Schemas.Payload])
  })

  describe("Test against the  ModelInfoAPISpecs.Schemas.POST.Response.Payload schema", () => {
    // WHEN the object is validated
    // THEN expect the object to validate successfully
    testSchemaWithValidObject("ModelInfoAPISpecs.Schemas.POST.Response.Payload", ModelInfoAPISpecs.Schemas.POST.Response.Payload, givenValidModelInfoPOSTResponse, [LocaleAPISpecs.Schemas.Payload])

    // AND WHEN the object has additional properties
    // THEN expect the object to not validate
    testSchemaWithInvalidObject("ModelInfoAPISpecs.Schemas.POST.Response.Payload", ModelInfoAPISpecs.Schemas.POST.Response.Payload, givenValidModelInfoPOSTResponse, [LocaleAPISpecs.Schemas.Payload])
  })

  describe("Test against the ModelInfoAPISpecs.Schemas.POST.Request.Payload schema", () => {
    // WHEN the object is validated
    // THEN expect the object to validate successfully
    testSchemaWithValidObject("ModelInfoAPISpecs.Schemas.POST.Request.Payload", ModelInfoAPISpecs.Schemas.POST.Request.Payload, givenValidModelInfoPOSTRequest, [LocaleAPISpecs.Schemas.Payload])

    // AND WHEN the object has additional properties
    // THEN expect the object to not validate
    testSchemaWithInvalidObject("ModelInfoAPISpecs.Schemas.POST.Request.Payload", ModelInfoAPISpecs.Schemas.POST.Request.Payload, givenValidModelInfoPOSTRequest, [LocaleAPISpecs.Schemas.Payload])

  })
});