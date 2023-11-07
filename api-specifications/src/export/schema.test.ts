import ExportAPISpecs from "./index";
import { getMockId } from "_test_utilities/mockMongoId";
import {
  assertValidationErrors,
  testSchemaWithInvalidObject,
  testSchemaWithValidObject,
  testValidSchema,
} from "../_test_utilities/stdSchemaTests";

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
    testSchemaWithInvalidObject(
      "ExportAPISpecs.Schemas.POST.Request.Payload",
      ExportAPISpecs.Schemas.POST.Request.Payload,
      givenValidExportRequest
    );

    describe("Fail validation of 'modelId'", () => {
      test.each([
        // GIVEN an undefined modelId
        [
          "undefined",
          undefined,
          {
            instancePath: "",
            keyword: "required",
            message: "must have required property 'modelId'",
          },
        ],
        // OR GIVEN a null modelId
        [
          "null",
          null,
          {
            instancePath: "/modelId",
            keyword: "type",
            message: "must be string",
          },
        ],
        // OR GIVEN a malformed modelId
        [
          "malformed",
          "foo",
          {
            instancePath: "/modelId",
            keyword: "pattern",
            message: 'must match pattern "^[0-9a-f]{24}$"',
          },
        ],
      ])("Fail validation of Export 'modelId' because it is %s", (caseDescription, value, failure) => {
        // GIVEN an Export object with the given modelId
        const exportRequestSpec: Partial<ExportAPISpecs.Types.POST.Request.Payload> = {
          // @ts-ignore
          modelId: value,
        };

        // WHEN the object is validated

        // THEN expect the object to not validate with the expected errors
        assertValidationErrors(exportRequestSpec, ExportAPISpecs.Schemas.POST.Request.Payload, [
          expect.objectContaining({
            instancePath: failure.instancePath,
            keyword: failure.keyword,
            message: failure.message,
          }),
        ]);
      });
    });
  });
});
