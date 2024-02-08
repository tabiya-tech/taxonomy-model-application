import ExportAPISpecs from "./index";
import { getMockId } from "_test_utilities/mockMongoId";
import {
  testObjectIdField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";

describe("Test the Export Schema", () => {
  // GIVEN the ExportAPISpecs.Schemas.POST.Request.Payload schema

  // WHEN the schema is validated
  // THEN expect the schema to be valid
  testValidSchema("ExportAPISpecs.Schemas.POST.Request.Payload", ExportAPISpecs.Schemas.POST.Request.Payload);
});

describe("Validate JSON against the Export Schema", () => {
  // GIVEN a valid ExportRequest object
  const givenValidExportRequest: ExportAPISpecs.Types.POST.Request.Payload = {
    modelId: getMockId(2),
  };

  describe("Successful validation of Export", () => {
    // WHEN the object is validated
    // THEN expect the object to validate successfully
    testSchemaWithValidObject(
      "ExportAPISpecs.Schemas.POST.Request.Payload",
      ExportAPISpecs.Schemas.POST.Request.Payload,
      givenValidExportRequest
    );
  });

  describe("Failed validation of Export", () => {
    // WHEN the object has additional properties
    // THEN expect the object to not validate
    testSchemaWithAdditionalProperties(
      "ExportAPISpecs.Schemas.POST.Request.Payload",
      ExportAPISpecs.Schemas.POST.Request.Payload,
      givenValidExportRequest
    );

    describe("Fail validation of 'modelId'", () => {
      testObjectIdField("modelId", ExportAPISpecs.Schemas.POST.Request.Payload);
    });
  });
});
