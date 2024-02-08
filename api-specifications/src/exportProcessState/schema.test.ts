import ExportProcessStateAPISpecs from "./index";
import { getMockId } from "_test_utilities/mockMongoId";
import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testObjectIdField,
  testValidSchema,
  testTimestampField,
  testEnumField,
  testBooleanField,
} from "_test_utilities/stdSchemaTests";
import { WHITESPACE } from "_test_utilities/specialCharacters";
import ExportProcessStateConstants from "exportProcessState/constants";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import { getStdURIFieldTestCases } from "_test_utilities/stdSchemaTestCases";

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
  testSchemaWithAdditionalProperties(
    "ExportProcessStateAPISpecs.Schemas.GET.Response.Payload",
    ExportProcessStateAPISpecs.Schemas.GET.Response.Payload,
    givenValidExportProcessState
  );

  describe("Validate ExportProcessStateAPISpecs.Schemas.GET.Response.Payload fields", () => {
    describe("Test validation of 'id'", () => {
      testObjectIdField("id", ExportProcessStateAPISpecs.Schemas.GET.Response.Payload);
    });

    describe("Test validation of modelId", () => {
      testObjectIdField("modelId", ExportProcessStateAPISpecs.Schemas.GET.Response.Payload);
    });

    describe("Test validation of 'status'", () => {
      testEnumField(
        "status",
        ExportProcessStateAPISpecs.Schemas.GET.Response.Payload,
        Object.values(ExportProcessStateAPISpecs.Enums.Status)
      );
    });

    describe("Test validation of 'result'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'result'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/result", "type", "must be object")],
        [
          CaseType.Failure,
          "only whitespace characters",
          WHITESPACE,
          constructSchemaError("/result", "type", "must be object"),
        ],
        [CaseType.Failure, "random string", "foo", constructSchemaError("/result", "type", "must be object")],
        [
          CaseType.Failure,
          "empty object",
          {},
          [
            constructSchemaError("/result", "required", "must have required property 'errored'"),
            constructSchemaError("/result", "required", "must have required property 'exportErrors'"),
            constructSchemaError("/result", "required", "must have required property 'exportWarnings'"),
          ],
        ],
        [
          CaseType.Success,
          "a valid result",
          {
            errored: false,
            exportErrors: false,
            exportWarnings: false,
          },
          undefined,
        ],
      ])("(%s) Validate 'result' when it is %s", (caseType, _description, givenValue, failureMessages) => {
        // GIVEN an object with the given value
        const givenObject: ExportProcessStateAPISpecs.Types.GET.Response.Payload = {
          // @ts-ignore
          result: givenValue,
        };
        // THEN expect the object to validate accordingly
        assertCaseForProperty(
          "result",
          givenObject,
          ExportProcessStateAPISpecs.Schemas.GET.Response.Payload,
          caseType,
          failureMessages
        );
      });
    });

    describe.each([["result/exportWarnings"], ["result/exportErrors"], ["result/errored"]])(
      `Test validation of '%s'`,
      (propertyName) => {
        testBooleanField(propertyName, ExportProcessStateAPISpecs.Schemas.GET.Response.Payload);
      }
    );

    describe("Test validation of 'downloadUrl'", () => {
      test.each(getStdURIFieldTestCases("downloadUrl", ExportProcessStateConstants.MAX_URI_LENGTH, true))(
        "(%s) Validate 'downloadUrl' when it is %s",
        (caseType, _description, givenValue, failureMessages) => {
          // GIVEN an object with the given value
          const givenObject = {
            downloadUrl: givenValue,
          };
          // THEN expect the object to validate accordingly
          assertCaseForProperty(
            "downloadUrl",
            givenObject,
            ExportProcessStateAPISpecs.Schemas.GET.Response.Payload,
            caseType,
            failureMessages
          );
        }
      );
    });

    describe("Test validation of 'timestamp'", () => {
      testTimestampField<ExportProcessStateAPISpecs.Types.GET.Response.Payload>(
        "timestamp",
        ExportProcessStateAPISpecs.Schemas.GET.Response.Payload
      );
    });

    describe("Test validation of 'createdAt'", () => {
      testTimestampField<ExportProcessStateAPISpecs.Types.GET.Response.Payload>(
        "createdAt",
        ExportProcessStateAPISpecs.Schemas.GET.Response.Payload
      );
    });

    describe("Test validation of 'updatedAt'", () => {
      testTimestampField<ExportProcessStateAPISpecs.Types.GET.Response.Payload>(
        "updatedAt",
        ExportProcessStateAPISpecs.Schemas.GET.Response.Payload
      );
    });
  });
});
