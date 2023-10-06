import InfoAPISpecs from "./index";
import {
  testSchemaWithInvalidObject,
  testSchemaWithValidObject,
  testValidSchema,
} from "../_test_utilities/stdSchemaTests";

describe("Test the InfoSchema", () => {
  // GIVEN the InfoAPISpecs.Schemas.GET.Response.Payload schema

  // WHEN the schema is validated
  // THEN expect the schema to be valid
  testValidSchema(
    "Info.Schemas.GET.Response.Payload",
    InfoAPISpecs.Schemas.GET.Response.Payload
  );
});

describe("Validate JSON against the Info Schema", () => {
  // GIVEN a valid ModelInfoResponse object
  const givenValidInfoResponse: InfoAPISpecs.Types.GET.Response.Payload = {
    date: "2023-08-22T14:13:32.439Z",
    branch: "main",
    buildNumber: "972",
    sha: "c7846bd03d8bb709a93cd4eba4b88889e69a0fd2",
    path: "https://dev.tabiya.tech/api/info",
    database: "connected",
  };

  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "Info.Schemas.GET.Response.Payload",
    InfoAPISpecs.Schemas.GET.Response.Payload,
    givenValidInfoResponse
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithInvalidObject(
    "Info.Schemas.GET.Response.Payload",
    InfoAPISpecs.Schemas.GET.Response.Payload,
    givenValidInfoResponse
  );
});
