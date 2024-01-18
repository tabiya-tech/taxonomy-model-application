import ImportProcessStateAPISpecs from "./index";
import { getMockId } from "_test_utilities/mockMongoId";
import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";

describe("Test the ImportProcessStateAPISpecs Schema", () => {
  // GIVEN the ImportProcessStateAPISpecs.Schemas.GET.Response.Payload schema

  // WHEN the schema is validated

  // THEN expect the schema to be valid
  testValidSchema(
    "ImportProcessStateAPISpecs.Schemas.GET.Response.Payload",
    ImportProcessStateAPISpecs.Schemas.GET.Response.Payload
  );
});

describe("Validate JSON against the ImportProcessStateAPISpecs Schema", () => {
  // GIVEN a valid ImportProcessStateAPISpecs object
  const givenValidImportProcessState: ImportProcessStateAPISpecs.Types.GET.Response.Payload = {
    id: getMockId(1),
    modelId: getMockId(2),
    status: ImportProcessStateAPISpecs.Enums.Status.PENDING,
    result: {
      errored: false,
      parsingErrors: false,
      parsingWarnings: false,
    },
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "ImportProcessStateAPISpecs.Schemas.GET.Response.Payload",
    ImportProcessStateAPISpecs.Schemas.GET.Response.Payload,
    givenValidImportProcessState
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "ImportProcessStateAPISpecs.Schemas.GET.Response.Payload",
    ImportProcessStateAPISpecs.Schemas.GET.Response.Payload,
    givenValidImportProcessState
  );
});
