import {
  testBooleanField,
  testNonEmptyStringField,
  testObjectIdField,
  testRefSchemaField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testStringField,
  testTimestampField,
  testUUIDArray,
  testUUIDField,
  testURIField,
  testEnumField,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import ModelInfoAPISpecs from "./index";
import ModelInfoConstants from "./constants";
import LocaleAPISpecs from "locale";
import { getMockId } from "_test_utilities/mockMongoId";
import { randomUUID } from "crypto";
import { getTestString } from "_test_utilities/specialCharacters";
import { ExportProcessState } from "exportProcessState/enums";
import ImportProcessState from "importProcessState";
import ExportProcessStateAPISpecs from "exportProcessState";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import {
  getStdEnumTestCases,
  getStdObjectIdTestCases,
  getStdTimestampFieldTestCases,
  getStdURIFieldTestCases,
} from "_test_utilities/stdSchemaTestCases";

describe("Test ModelInfoAPISpecs Schema validity", () => {
  // WHEN the ModelInfoAPISpecs.Schemas.POST.Request.Schema.Payload schema
  // THEN expect the givenSchema to be valid
  testValidSchema(
    "ModelInfoAPISpecs.Schemas.POST.Request.Schema.Payload",
    ModelInfoAPISpecs.Schemas.POST.Request.Payload,
    [LocaleAPISpecs.Schemas.Payload]
  );
});

describe("Test objects against the  ModelInfoAPISpecs.Schemas.POST.Response.Payload schema", () => {
  // GIVEN a valid ModelInfoPOSTRequest object
  const givenExportProcessState = {
    id: getMockId(2),
    status: ExportProcessState.Enums.Status.PENDING,
    result: {
      errored: false,
      exportErrors: false,
      exportWarnings: false,
    },
    downloadUrl: "https://foo/bar",
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const givenImportProcessState = {
    id: getMockId(1),
    status: ImportProcessState.Enums.Status.PENDING,
    result: {
      errored: false,
      parsingErrors: false,
      parsingWarnings: false,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const givenValidModelInfoPOSTResponse = {
    id: getMockId(1),
    UUID: randomUUID(),
    UUIDHistory: [randomUUID()],
    path: "https://path/to/tabiya",
    tabiyaPath: "https://path/to/tabiya",
    name: getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
    description: getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
    locale: {
      name: getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
      UUID: randomUUID(),
      shortCode: getTestString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
    },
    releaseNotes: getTestString(ModelInfoAPISpecs.Constants.RELEASE_NOTES_MAX_LENGTH),
    released: false,
    version: getTestString(ModelInfoAPISpecs.Constants.VERSION_MAX_LENGTH),
    exportProcessState: [givenExportProcessState],
    importProcessState: givenImportProcessState,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "ModelInfoAPISpecs.Schemas.POST.Response.Payload",
    ModelInfoAPISpecs.Schemas.POST.Response.Payload,
    givenValidModelInfoPOSTResponse,
    [LocaleAPISpecs.Schemas.Payload]
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "ModelInfoAPISpecs.Schemas.POST.Response.Payload",
    ModelInfoAPISpecs.Schemas.POST.Response.Payload,
    givenValidModelInfoPOSTResponse,
    [LocaleAPISpecs.Schemas.Payload]
  );

  describe("Validate ModelInfoAPISpecs.Schemas.POST.Response.Payload fields", () => {
    describe("Test validation of 'id'", () => {
      testObjectIdField("id", ModelInfoAPISpecs.Schemas.POST.Response.Payload, [LocaleAPISpecs.Schemas.Payload]);
    });

    describe("Test validation of 'UUID'", () => {
      testUUIDField<ModelInfoAPISpecs.Types.POST.Response.Payload>(
        "UUID",
        ModelInfoAPISpecs.Schemas.POST.Response.Payload,
        [LocaleAPISpecs.Schemas.Payload]
      );
    });

    describe("Test validation of 'path'", () => {
      testURIField<ModelInfoAPISpecs.Types.POST.Response.Payload>(
        "path",
        ModelInfoConstants.MAX_URI_LENGTH,
        ModelInfoAPISpecs.Schemas.POST.Response.Payload,
        [LocaleAPISpecs.Schemas.Payload]
      );
    });

    describe("Test validation of 'tabiyaPath'", () => {
      testURIField<ModelInfoAPISpecs.Types.POST.Response.Payload>(
        "tabiyaPath",
        ModelInfoConstants.MAX_URI_LENGTH,
        ModelInfoAPISpecs.Schemas.POST.Response.Payload,
        [LocaleAPISpecs.Schemas.Payload]
      );
    });

    describe("Test validation of 'released'", () => {
      testBooleanField("released", ModelInfoAPISpecs.Schemas.POST.Response.Payload, [LocaleAPISpecs.Schemas.Payload]);
    });

    describe("Test validation of 'releaseNotes'", () => {
      testStringField<ModelInfoAPISpecs.Types.POST.Response.Payload>(
        "releaseNotes",
        ModelInfoConstants.RELEASE_NOTES_MAX_LENGTH,
        ModelInfoAPISpecs.Schemas.POST.Response.Payload,
        [LocaleAPISpecs.Schemas.Payload]
      );
    });

    describe("Test validation of 'version'", () => {
      testStringField<ModelInfoAPISpecs.Types.POST.Response.Payload>(
        "version",
        ModelInfoConstants.VERSION_MAX_LENGTH,
        ModelInfoAPISpecs.Schemas.POST.Response.Payload,
        [LocaleAPISpecs.Schemas.Payload]
      );
    });

    describe("Test validation of 'createdAt'", () => {
      testTimestampField<ModelInfoAPISpecs.Types.POST.Response.Payload>(
        "createdAt",
        ModelInfoAPISpecs.Schemas.POST.Response.Payload,
        [LocaleAPISpecs.Schemas.Payload]
      );
    });

    describe("Test validation of 'updatedAt'", () => {
      testTimestampField<ModelInfoAPISpecs.Types.POST.Response.Payload>(
        "updatedAt",
        ModelInfoAPISpecs.Schemas.POST.Response.Payload,
        [LocaleAPISpecs.Schemas.Payload]
      );
    });

    describe("Test validation of 'name'", () => {
      testNonEmptyStringField<ModelInfoAPISpecs.Types.POST.Response.Payload>(
        "name",
        ModelInfoConstants.NAME_MAX_LENGTH,
        ModelInfoAPISpecs.Schemas.POST.Response.Payload,
        [LocaleAPISpecs.Schemas.Payload]
      );
    });

    describe("Test validation of 'description'", () => {
      testStringField<ModelInfoAPISpecs.Types.POST.Response.Payload>(
        "description",
        ModelInfoConstants.DESCRIPTION_MAX_LENGTH,
        ModelInfoAPISpecs.Schemas.POST.Response.Payload,
        [LocaleAPISpecs.Schemas.Payload]
      );
    });

    describe("Test validation of 'UUIDHistory'", () => {
      testUUIDArray<ModelInfoAPISpecs.Types.POST.Response.Payload>(
        "UUIDHistory",
        ModelInfoAPISpecs.Schemas.POST.Response.Payload,
        [LocaleAPISpecs.Schemas.Payload],
        false
      );
    });

    describe("Test validation of 'locale'", () => {
      const validLocale = {
        name: getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
        UUID: randomUUID(),
        shortCode: getTestString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
      };
      testRefSchemaField(
        "locale",
        ModelInfoAPISpecs.Schemas.POST.Response.Payload,
        validLocale,
        LocaleAPISpecs.Schemas.Payload
      );
    });

    describe("Test validation of 'exportProcessState'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'exportProcessState'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/exportProcessState", "type", "must be array")],
        [CaseType.Failure, "a string", "foo", constructSchemaError("/exportProcessState", "type", "must be array")],
        [
          CaseType.Failure,
          "an array of strings",
          ["foo", "bar"],
          [
            constructSchemaError("/exportProcessState/0", "type", "must be object"),
            constructSchemaError("/exportProcessState/1", "type", "must be object"),
          ],
        ],
        [
          CaseType.Failure,
          "a valid exportProcessState object (not array)",
          {
            id: getMockId(1),
            status: ExportProcessStateAPISpecs.Enums.Status.PENDING,
            result: {
              errored: false,
              exportErrors: false,
              exportWarnings: false,
            },
            downloadUrl: "https://foo.bar.com",
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          constructSchemaError("/exportProcessState", "type", "must be array"),
        ],
        [CaseType.Success, "an empty array", [], undefined],
        [
          CaseType.Success,
          "a valid exportProcessState object array",
          [
            {
              id: getMockId(1),
              status: ExportProcessStateAPISpecs.Enums.Status.PENDING,
              result: {
                errored: false,
                exportErrors: false,
                exportWarnings: false,
              },
              downloadUrl: "https://foo.bar.com",
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          undefined,
        ],
      ])("(%s) Validate 'exportProcessState' when it is %s", (caseType, _description, givenValue, failureMessages) => {
        // GIVEN an object with the given value
        const givenObject = {
          exportProcessState: givenValue,
        };
        // THEN expect the object to validate accordingly
        assertCaseForProperty(
          "exportProcessState",
          givenObject,
          ModelInfoAPISpecs.Schemas.POST.Response.Payload,
          caseType,
          failureMessages,
          [LocaleAPISpecs.Schemas.Payload]
        );
      });
    });

    describe("Test validation of exportProcessState fields", () => {
      describe("Test validation of 'exportProcessState/id'", () => {
        test.each([...getStdObjectIdTestCases("/exportProcessState/0/id")])(
          `(%s) Validate id when it is %s`,
          (caseType, _description, givenValue, failureMessages) => {
            // GIVEN an object with the given value
            const givenObject = {
              exportProcessState: [
                {
                  id: givenValue,
                },
              ],
            };
            // THEN expect the object to validate accordingly
            assertCaseForProperty(
              "/exportProcessState/0/id",
              givenObject,
              ModelInfoAPISpecs.Schemas.POST.Response.Payload,
              caseType,
              failureMessages,
              [LocaleAPISpecs.Schemas.Payload]
            );
          }
        );
      });

      describe("Test validation of 'exportProcessState/status'", () => {
        test.each(
          getStdEnumTestCases("/exportProcessState/0/status", Object.values(ExportProcessStateAPISpecs.Enums.Status))
        )(
          "(%s) Validate 'exportProcessState.status' when it is %s",
          (caseType, _description, givenValue, failureMessages) => {
            // GIVEN an object with the given value
            const givenObject = {
              exportProcessState: [
                {
                  status: givenValue,
                },
              ],
            };
            // THEN expect the object to validate accordingly
            assertCaseForProperty(
              "/exportProcessState/0/status",
              givenObject,
              ModelInfoAPISpecs.Schemas.POST.Response.Payload,
              caseType,
              failureMessages,
              [LocaleAPISpecs.Schemas.Payload]
            );
          }
        );
      });

      describe.each([
        ["exportProcessState/0/result/errored", "errored"],
        ["exportProcessState/0/result/exportErrors", "exportErrors"],
        ["exportProcessState/0/result/exportWarnings", "exportWarnings"],
      ])(`Test validation of '%s'`, (propertyPath, propertyName) => {
        test.each([
          [
            CaseType.Failure,
            "undefined",
            undefined,
            constructSchemaError(
              "/exportProcessState/0/result",
              "required",
              `must have required property '${propertyName}'`
            ),
          ],
          [CaseType.Failure, "null", null, constructSchemaError(`/${propertyPath}`, "type", "must be boolean")],
          [CaseType.Failure, "not boolean", "foo", constructSchemaError(`/${propertyPath}`, "type", "must be boolean")],
          [
            CaseType.Failure,
            "string (true)",
            "true",
            constructSchemaError(`/${propertyPath}`, "type", "must be boolean"),
          ],
          [
            CaseType.Failure,
            "string (false)",
            "false",
            constructSchemaError(`/${propertyPath}`, "type", "must be boolean"),
          ],
          [CaseType.Success, "true", true, undefined],
          [CaseType.Success, "false", false, undefined],
        ])(`(%s) Validate '%s' when it is %s`, (caseType, _description, givenValue, failureMessages) => {
          // GIVEN an object with the given value
          const givenObject = {
            exportProcessState: [
              {
                result: {
                  [propertyName]: givenValue,
                },
              },
            ],
          };
          // THEN expect the object to validate accordingly
          assertCaseForProperty(
            propertyPath,
            givenObject,
            ModelInfoAPISpecs.Schemas.POST.Response.Payload,
            caseType,
            failureMessages,
            [LocaleAPISpecs.Schemas.Payload]
          );
        });
      });

      describe("Test validation of 'exportProcessState/downloadUrl'", () => {
        test.each(
          getStdURIFieldTestCases("/exportProcessState/0/downloadUrl", ModelInfoConstants.MAX_URI_LENGTH, true)
        )(`(%s) Validate downloadUrl when it is %s`, (caseType, _description, givenValue, failureMessages) => {
          // GIVEN an object with the given value
          const givenObject = {
            exportProcessState: [
              {
                downloadUrl: givenValue,
              },
            ],
          };
          // THEN expect the object to validate accordingly
          assertCaseForProperty(
            "/exportProcessState/0/downloadUrl",
            givenObject,
            ModelInfoAPISpecs.Schemas.POST.Response.Payload,
            caseType,
            failureMessages,
            [LocaleAPISpecs.Schemas.Payload]
          );
        });
      });

      describe("Test validation of 'exportProcessState/timestamp'", () => {
        test.each(getStdTimestampFieldTestCases("/exportProcessState/0/timestamp"))(
          `(%s) Validate timestamp when it is %s`,
          (caseType, _description, givenValue, failureMessages) => {
            // GIVEN an object with the given value
            const givenObject = {
              exportProcessState: [
                {
                  timestamp: givenValue,
                },
              ],
            };
            // THEN expect the object to validate accordingly
            assertCaseForProperty(
              "/exportProcessState/0/timestamp",
              givenObject,
              ModelInfoAPISpecs.Schemas.POST.Response.Payload,
              caseType,
              failureMessages,
              [LocaleAPISpecs.Schemas.Payload]
            );
          }
        );
      });
      describe("Test validation of 'exportProcessState/createdAt'", () => {
        test.each(getStdTimestampFieldTestCases("/exportProcessState/0/createdAt"))(
          `(%s) Validate createdAt when it is %s`,
          (caseType, _description, givenValue, failureMessages) => {
            // GIVEN an object with the given value
            const givenObject = {
              exportProcessState: [
                {
                  createdAt: givenValue,
                },
              ],
            };
            // THEN expect the object to validate accordingly
            assertCaseForProperty(
              "/exportProcessState/0/createdAt",
              givenObject,
              ModelInfoAPISpecs.Schemas.POST.Response.Payload,
              caseType,
              failureMessages,
              [LocaleAPISpecs.Schemas.Payload]
            );
          }
        );
      });
      describe("Test validation of 'exportProcessState/updatedAt'", () => {
        test.each(getStdTimestampFieldTestCases("/exportProcessState/0/updatedAt"))(
          `(%s) Validate updatedAt when it is %s`,
          (caseType, _description, givenValue, failureMessages) => {
            // GIVEN an object with the given value
            const givenObject = {
              exportProcessState: [
                {
                  updatedAt: givenValue,
                },
              ],
            };
            // THEN expect the object to validate accordingly
            assertCaseForProperty(
              "/exportProcessState/0/updatedAt",
              givenObject,
              ModelInfoAPISpecs.Schemas.POST.Response.Payload,
              caseType,
              failureMessages,
              [LocaleAPISpecs.Schemas.Payload]
            );
          }
        );
      });
    });

    describe("Test validation of 'importProcessState'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'importProcessState'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/importProcessState", "type", "must be object")],
        [CaseType.Failure, "a string", "foo", constructSchemaError("/importProcessState", "type", "must be object")],
        [
          CaseType.Failure,
          "an array",
          ["foo", "bar"],
          constructSchemaError("/importProcessState", "type", "must be object"),
        ],
        [
          CaseType.Success,
          "a valid importProcessState object",
          {
            id: getMockId(1),
            status: ImportProcessState.Enums.Status.PENDING,
            result: {
              errored: false,
              parsingErrors: false,
              parsingWarnings: false,
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          undefined,
        ],
      ])("(%s) Validate 'importProcessState' when it is %s", (caseType, _description, givenValue, failureMessages) => {
        // GIVEN an object with the given value
        const givenObject = {
          importProcessState: givenValue,
        };
        // THEN expect the object to validate accordingly
        assertCaseForProperty(
          "importProcessState",
          givenObject,
          ModelInfoAPISpecs.Schemas.POST.Response.Payload,
          caseType,
          failureMessages,
          [LocaleAPISpecs.Schemas.Payload]
        );
      });
    });

    describe("Test validation of importProcessState fields", () => {
      describe("Test validation of 'importProcessState/id'", () => {
        testObjectIdField("importProcessState/id", ModelInfoAPISpecs.Schemas.POST.Response.Payload, [
          LocaleAPISpecs.Schemas.Payload,
        ]);
      });

      describe("Test validation of 'importProcessState/status'", () => {
        testEnumField(
          "importProcessState/status",
          ModelInfoAPISpecs.Schemas.POST.Response.Payload,
          Object.values(ImportProcessState.Enums.Status),
          [LocaleAPISpecs.Schemas.Payload]
        );
      });

      describe("Test validation of 'importProcessState/result'", () => {
        testBooleanField("importProcessState/result/errored", ModelInfoAPISpecs.Schemas.POST.Response.Payload, [
          LocaleAPISpecs.Schemas.Payload,
        ]);
        testBooleanField("importProcessState/result/parsingErrors", ModelInfoAPISpecs.Schemas.POST.Response.Payload, [
          LocaleAPISpecs.Schemas.Payload,
        ]);
        testBooleanField("importProcessState/result/parsingWarnings", ModelInfoAPISpecs.Schemas.POST.Response.Payload, [
          LocaleAPISpecs.Schemas.Payload,
        ]);
      });

      describe("Test validation of 'importProcessState/createdAt'", () => {
        test.each([
          // we are using the standard stdTimestampFieldTestCases but we are filtering out the cases that are not applicable
          // in this case, since the createdAt field can be undefined, we filter out the "undefined" case
          // and override it with our own case
          ...getStdTimestampFieldTestCases("/importProcessState/createdAt").filter(
            (testCase) => testCase[1] !== "undefined"
          ),
          [CaseType.Success, "undefined", undefined, undefined],
        ])(`(%s) Validate createdAt when it is %s`, (caseType, _description, givenValue, failureMessages) => {
          // GIVEN an object with the given value
          const givenObject = {
            importProcessState: {
              createdAt: givenValue,
            },
          };
          // THEN expect the object to validate accordingly
          assertCaseForProperty(
            "/importProcessState/createdAt",
            givenObject,
            ModelInfoAPISpecs.Schemas.POST.Response.Payload,
            caseType,
            failureMessages,
            [LocaleAPISpecs.Schemas.Payload]
          );
        });
      });

      describe("Test validation of 'importProcessState/updatedAt'", () => {
        test.each([
          // we are using the standard stdTimestampFieldTestCases but we are filtering out the cases that are not applicable
          // in this case, since the updatedAt field can be undefined, we filter out the "undefined" case
          // and override it with our own case
          ...getStdTimestampFieldTestCases("/importProcessState/updatedAt").filter(
            (testCase) => testCase[1] !== "undefined"
          ),
          [CaseType.Success, "undefined", undefined, undefined],
        ])(`(%s) Validate updatedAt when it is %s`, (caseType, _description, givenValue, failureMessages) => {
          // GIVEN an object with the given value
          const givenObject = {
            importProcessState: {
              updatedAt: givenValue,
            },
          };
          // THEN expect the object to validate accordingly
          assertCaseForProperty(
            "/importProcessState/updatedAt",
            givenObject,
            ModelInfoAPISpecs.Schemas.POST.Response.Payload,
            caseType,
            failureMessages,
            [LocaleAPISpecs.Schemas.Payload]
          );
        });
      });
    });
  });
});
