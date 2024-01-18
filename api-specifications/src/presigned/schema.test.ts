import PresignedAPISpecs from "./index";
import { getTestString } from "_test_utilities/specialCharacters";
import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";

describe("Test the Presigned Schema", () => {
  // GIVEN the Locale.Schemas.Payload schema
  // WHEN the schema is validated
  // THEN expect the schema to be valid
  testValidSchema("PresignedAPISpecs.Schemas.GET.Response.Payload", PresignedAPISpecs.Schemas.GET.Response.Payload);
});

describe("Validate JSON against the Presigned Schema", () => {
  // GIVEN a valid Presigned object
  const givenValidPresignedResponse: PresignedAPISpecs.Types.GET.Response.Payload = {
    url: "https://foo.bar",
    fields: [
      { name: "name1", value: getTestString(10) },
      { name: "name2", value: getTestString(10) },
    ],
    folder: getTestString(10),
  };

  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "PresignedAPISpecs.Schemas.GET.Response.Payload",
    PresignedAPISpecs.Schemas.GET.Response.Payload,
    givenValidPresignedResponse
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "PresignedAPISpecs.Schemas.GET.Response.Payload",
    PresignedAPISpecs.Schemas.GET.Response.Payload,
    givenValidPresignedResponse
  );
});
