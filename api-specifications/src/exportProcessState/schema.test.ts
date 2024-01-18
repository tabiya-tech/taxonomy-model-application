import ExportProcessStateAPISpecs from "./index";
import { getMockId } from "_test_utilities/mockMongoId";
import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
  testObjectIdField,
} from "_test_utilities/stdSchemaTests";
import { WHITESPACE } from "_test_utilities/specialCharacters";
import {assertCaseForProperty, CaseType, constructSchemaError} from "_test_utilities/assertCaseForProperty";

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

  describe("Validate ExportProcessState fields", () => {
    describe("Test validation of 'id'", () => {
      testObjectIdField<ExportProcessStateAPISpecs.Types.GET.Response.Payload>(
        "id",
        ExportProcessStateAPISpecs.Schemas.GET.Response.Payload
      );
    });

    describe("Test validation of modelId", () => {
      testObjectIdField<ExportProcessStateAPISpecs.Types.GET.Response.Payload>(
        "modelId",
        ExportProcessStateAPISpecs.Schemas.GET.Response.Payload
      );
    });

    describe("Test validation of 'status'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'status'"),
        ],
        [
          CaseType.Failure,
          "null",
          null,
          [
            constructSchemaError("/status", "type", "must be string"),
            constructSchemaError("/status", "enum", "must be equal to one of the allowed values"),
          ],
        ],
        [
          CaseType.Failure,
          "only whitespace characters",
          WHITESPACE,
          [constructSchemaError("/status", "enum", "must be equal to one of the allowed values")],
        ],
        [
          CaseType.Failure,
          "random string",
          "foo",
          [constructSchemaError("/status", "enum", "must be equal to one of the allowed values")],
        ],
        [CaseType.Success, "a valid PENDING status", ExportProcessStateAPISpecs.Enums.Status.PENDING, undefined],
        [CaseType.Success, "a valid RUNNING status", ExportProcessStateAPISpecs.Enums.Status.RUNNING, undefined],
        [CaseType.Success, "a valid COMPLETED status", ExportProcessStateAPISpecs.Enums.Status.COMPLETED, undefined],
      ])("(%s) Validate 'status' when it is %s", (caseType, _description, givenValue, failureMessages) => {
        // GIVEN an object with the given value
        const givenObject: ExportProcessStateAPISpecs.Types.GET.Response.Payload = {
          // @ts-ignore
          status: givenValue,
        };
        // THEN expect the object to validate accordingly
        assertCaseForProperty(
          "status",
          givenObject,
          ExportProcessStateAPISpecs.Schemas.GET.Response.Payload,
          caseType,
          failureMessages
        );
      });
    });

    /*
    [
            CaseType.Failure,
            "errored not provided",
            {
              exportErrors: false,
              exportWarnings: false,
            },
            ["must have required property 'errored'"],
          ],
          [
            CaseType.Failure,
            "exportErrors not provided",
            {
              errored: false,
              exportWarnings: false,
            },
            ["must have required property 'exportErrors'"],
          ],
          [
            CaseType.Failure,
            "exportWarnings not provided",
            {
              errored: false,
              exportErrors: false,
            },
            ["must have required property 'exportWarnings'"],
          ],
     */

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

    describe("Test validation of 'result.errored'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("/result", "required", "must have required property 'errored'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/result/errored", "type", "must be boolean")],
        [
          CaseType.Failure,
          "only whitespace characters",
          WHITESPACE,
          constructSchemaError("/result/errored", "type", "must be boolean"),
        ],
        [CaseType.Failure, "random string", "foo", constructSchemaError("/result/errored", "type", "must be boolean")],
        [CaseType.Success, "a valid boolean", false, undefined],
      ])("(%s) Validate 'result.errored' when it is %s", (caseType, _description, givenValue, failureMessages) => {
        // GIVEN an object with the given value
        const givenObject: ExportProcessStateAPISpecs.Types.GET.Response.Payload = {
          // @ts-ignore
          result: {
            // @ts-ignore
            errored: givenValue,
          },
        };
        // THEN expect the object to validate accordingly
        assertCaseForProperty(
          "result/errored",
          givenObject,
          ExportProcessStateAPISpecs.Schemas.GET.Response.Payload,
          caseType,
          failureMessages
        );
      });
    });

    describe("Test validation of 'result.exportErrors'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("/result", "required", "must have required property 'exportErrors'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/result/exportErrors", "type", "must be boolean")],
        [
          CaseType.Failure,
          "only whitespace characters",
          WHITESPACE,
          constructSchemaError("/result/exportErrors", "type", "must be boolean"),
        ],
        [
          CaseType.Failure,
          "random string",
          "foo",
          constructSchemaError("/result/exportErrors", "type", "must be boolean"),
        ],
        [CaseType.Success, "a valid boolean", false, undefined],
      ])("(%s) Validate 'result.exportErrors' when it is %s", (caseType, _description, givenValue, failureMessages) => {
        // GIVEN an object with the given value
        const givenObject: ExportProcessStateAPISpecs.Types.GET.Response.Payload = {
          // @ts-ignore
          result: {
            ...givenValidExportProcessState.result, // @ts-ignore
            exportErrors: givenValue,
          },
        };
        // THEN expect the object to validate accordingly
        assertCaseForProperty(
          "result/exportErrors",
          givenObject,
          ExportProcessStateAPISpecs.Schemas.GET.Response.Payload,
          caseType,
          failureMessages
        );
      });
    });

    describe("Test validation of 'result.exportWarnings'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("/result", "required", "must have required property 'exportWarnings'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/result/exportWarnings", "type", "must be boolean")],
        [
          CaseType.Failure,
          "only whitespace characters",
          WHITESPACE,
          constructSchemaError("/result/exportWarnings", "type", "must be boolean"),
        ],
        [
          CaseType.Failure,
          "random string",
          "foo",
          constructSchemaError("/result/exportWarnings", "type", "must be boolean"),
        ],
        [CaseType.Success, "a valid boolean", false, undefined],
      ])(
        "(%s) Validate 'result.exportWarnings' when it is %s",
        (caseType, _description, givenValue, failureMessages) => {
          // GIVEN an object with the given value
          const givenObject: ExportProcessStateAPISpecs.Types.GET.Response.Payload = {
            // @ts-ignore
            result: {
              ...givenValidExportProcessState.result, // @ts-ignore
              exportWarnings: givenValue,
            },
          };
          // THEN expect the object to validate accordingly
          assertCaseForProperty(
            "result/exportWarnings",
            givenObject,
            ExportProcessStateAPISpecs.Schemas.GET.Response.Payload,
            caseType,
            failureMessages
          );
        }
      );
    });

    describe("Test validation of 'downloadUrl'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'downloadUrl'"),
        ],
        [
          CaseType.Failure,
          "null",
          null,
          [
            constructSchemaError("/downloadUrl", "type", "must be string"),
            constructSchemaError("/downloadUrl", "anyOf", "must match a schema in anyOf"),
          ],
        ],
        [
          CaseType.Failure,
          "only whitespace characters",
          WHITESPACE,
          [
            constructSchemaError("/downloadUrl", "pattern", 'must match pattern "^$"'),
            constructSchemaError("/downloadUrl", "pattern", 'must match pattern "^https://.*"'),
            constructSchemaError("/downloadUrl", "format", 'must match format "uri"'),
            constructSchemaError("/downloadUrl", "anyOf", "must match a schema in anyOf"),
          ],
        ],
        [
          CaseType.Failure,
          "random string",
          "foo",
          [
            constructSchemaError("/downloadUrl", "pattern", 'must match pattern "^$"'),
            constructSchemaError("/downloadUrl", "pattern", 'must match pattern "^https://.*"'),
            constructSchemaError("/downloadUrl", "format", 'must match format "uri"'),
            constructSchemaError("/downloadUrl", "anyOf", "must match a schema in anyOf"),
          ],
        ],
        [
          CaseType.Failure,
          "a valid HTTP URL",
          "http://foo.bar.com",
          [
            constructSchemaError("/downloadUrl", "pattern", 'must match pattern "^$"'),
            constructSchemaError("/downloadUrl", "pattern", 'must match pattern "^https://.*"'),
            constructSchemaError("/downloadUrl", "anyOf", "must match a schema in anyOf"),
          ],
        ],
        [
          CaseType.Failure,
          "a valid FTP URL",
          "ftp://foo.bar.com",
          [
            constructSchemaError("/downloadUrl", "pattern", 'must match pattern "^$"'),
            constructSchemaError("/downloadUrl", "pattern", 'must match pattern "^https://.*"'),
            constructSchemaError("/downloadUrl", "anyOf", "must match a schema in anyOf"),
          ],
        ],
        [
          CaseType.Failure,
          "SMTP URL",
          "smtp://smtp.foo.bar.com",
          [
            constructSchemaError("/downloadUrl", "pattern", 'must match pattern "^$"'),
            constructSchemaError("/downloadUrl", "pattern", 'must match pattern "^https://.*"'),
            constructSchemaError("/downloadUrl", "anyOf", "must match a schema in anyOf"),
          ],
        ],
        [CaseType.Success, "an empty string", "", undefined],
        [CaseType.Success, "a valid HTTPS URL", "https://foo.bar.com", undefined],
        [CaseType.Success, "a valid complex HTTPS URL", "https://u:p@foo.bar.com:8080/%25?25#%25", undefined],
      ])("(%s) Validate 'downloadUrl' when it is %s", (caseType, _description, givenValue, failureMessages) => {
        // GIVEN an object with the given value
        const givenObject: ExportProcessStateAPISpecs.Types.GET.Response.Payload = {
          // @ts-ignore
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
      });
    });

    describe("Test validation of 'timestamp'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'timestamp'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/timestamp", "type", "must be string")],
        [
          CaseType.Failure,
          "only whitespace characters",
          WHITESPACE,
          constructSchemaError("/timestamp", "format", 'must match format "date-time"'),
        ],
        [
          CaseType.Failure,
          "random string",
          "foo",
          constructSchemaError("/timestamp", "format", 'must match format "date-time"'),
        ],
        [CaseType.Failure, "non string date", new Date(), constructSchemaError("/timestamp", "type", "must be string")],
        [
          CaseType.Failure,
          "a valid UTCString date",
          new Date().toUTCString(),
          constructSchemaError("/timestamp", "format", 'must match format "date-time"'),
        ],
        [
          CaseType.Failure,
          "a valid DateString date",
          new Date().toDateString(),
          constructSchemaError("/timestamp", "format", 'must match format "date-time"'),
        ],
        [CaseType.Success, "a valid ISOString date", new Date().toISOString(), undefined],
      ])("(%s) Validate 'timestamp' when it is %s", (caseType, _description, givenValue, failureMessages) => {
        // GIVEN an object with the given value
        const givenObject: ExportProcessStateAPISpecs.Types.GET.Response.Payload = {
          // @ts-ignore
          timestamp: givenValue,
        };
        // THEN expect the object to validate accordingly
        assertCaseForProperty(
          "timestamp",
          givenObject,
          ExportProcessStateAPISpecs.Schemas.GET.Response.Payload,
          caseType,
          failureMessages
        );
      });
    });

    describe("Test validation of 'createdAt'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'createdAt'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/createdAt", "type", "must be string")],
        [
          CaseType.Failure,
          "only whitespace characters",
          WHITESPACE,
          constructSchemaError("/createdAt", "format", 'must match format "date-time"'),
        ],
        [
          CaseType.Failure,
          "random string",
          "foo",
          constructSchemaError("/createdAt", "format", 'must match format "date-time"'),
        ],
        [CaseType.Failure, "non string date", new Date(), constructSchemaError("/createdAt", "type", "must be string")],
        [
          CaseType.Failure,
          "a valid UTCString date",
          new Date().toUTCString(),
          constructSchemaError("/createdAt", "format", 'must match format "date-time"'),
        ],
        [
          CaseType.Failure,
          "a valid DateString date",
          new Date().toDateString(),
          constructSchemaError("/createdAt", "format", 'must match format "date-time"'),
        ],
        [CaseType.Success, "a valid ISOString date", new Date().toISOString(), undefined],
      ])("(%s) Validate 'createdAt' when it is %s", (caseType, _description, givenValue, failureMessages) => {
        // GIVEN an object with the given value
        const givenObject: ExportProcessStateAPISpecs.Types.GET.Response.Payload = {
          // @ts-ignore
          createdAt: givenValue,
        };
        // THEN expect the object to validate accordingly
        assertCaseForProperty(
          "createdAt",
          givenObject,
          ExportProcessStateAPISpecs.Schemas.GET.Response.Payload,
          caseType,
          failureMessages
        );
      });
    });

    describe("Test validation of 'updatedAt'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'updatedAt'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/updatedAt", "type", "must be string")],
        [
          CaseType.Failure,
          "only whitespace characters",
          WHITESPACE,
          constructSchemaError("/updatedAt", "format", 'must match format "date-time"'),
        ],
        [
          CaseType.Failure,
          "random string",
          "foo",
          constructSchemaError("/updatedAt", "format", 'must match format "date-time"'),
        ],
        [CaseType.Failure, "non string date", new Date(), constructSchemaError("/updatedAt", "type", "must be string")],
        [
          CaseType.Failure,
          "a valid UTCString date",
          new Date().toUTCString(),
          constructSchemaError("/updatedAt", "format", 'must match format "date-time"'),
        ],
        [
          CaseType.Failure,
          "a valid DateString date",
          new Date().toDateString(),
          constructSchemaError("/updatedAt", "format", 'must match format "date-time"'),
        ],
        [CaseType.Success, "a valid ISOString date", new Date().toISOString(), undefined],
      ])("(%s) Validate 'updatedAt' when it is %s", (caseType, _description, givenValue, failureMessages) => {
        // GIVEN an object with the given value
        const givenObject: ExportProcessStateAPISpecs.Types.GET.Response.Payload = {
          // @ts-ignore
          updatedAt: givenValue,
        };
        // THEN expect the object to validate accordingly
        assertCaseForProperty(
          "updatedAt",
          givenObject,
          ExportProcessStateAPISpecs.Schemas.GET.Response.Payload,
          caseType,
          failureMessages
        );
      });
    });
  });
});
