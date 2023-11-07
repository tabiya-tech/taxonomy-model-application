import ExportProcessStateAPISpecs from "./index";
import { getMockId } from "../_test_utilities/mockMongoId";
import {
  testSchemaWithInvalidObject,
  testSchemaWithValidObject,
  testValidSchema,
} from "../_test_utilities/stdSchemaTests";

describe("Test the ExportProcessStateAPISpecs Schema", () => {
  // GIVEN the ExportProcessStateAPISpecs.Schemas.GET.Response.Payload schema

  // WHEN the schema is validated

  // THEN expect the schema to be valid
  testValidSchema(
    "ExportProcessStateAPISpecs.Schemas.GET.Response.Payload",
    ExportProcessStateAPISpecs.Schemas.GET.Response.Payload
  );
});

describe("Validate JSON against the ExportProcessStateAPISpecs Schema", () => {
  // GIVEN a valid ExportProcessStateAPISpecs object
  const givenValidExportProcessState: ExportProcessStateAPISpecs.Types.GET.Response.Payload = {
    id: getMockId(1),
    modelId: getMockId(2),
    status: ExportProcessStateAPISpecs.Enums.Status.PENDING,
    result: {
      errored: false,
      exportErrors: false,
      exportWarnings: false,
    },
    downloadUrl: "https://foo.bar.com",
    timestamp: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "ExportProcessStateAPISpecs.Schemas.GET.Response.Payload",
    ExportProcessStateAPISpecs.Schemas.GET.Response.Payload,
    givenValidExportProcessState
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithInvalidObject(
    "ExportProcessStateAPISpecs.Schemas.GET.Response.Payload",
    ExportProcessStateAPISpecs.Schemas.GET.Response.Payload,
    givenValidExportProcessState
  );
});
