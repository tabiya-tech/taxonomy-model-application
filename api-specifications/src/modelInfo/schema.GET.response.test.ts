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
  testArraySchemaFailureWithValidObject,
  testEnumField,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import {
  getStdObjectIdTestCases,
  getStdTimestampFieldTestCases,
  getStdURIFieldTestCases,
  getStdEnumTestCases,
} from "_test_utilities/stdSchemaTestCases";
import ModelInfoAPISpecs from "./index";
import { getTestString } from "_test_utilities/specialCharacters";
import { getMockId } from "_test_utilities/mockMongoId";
import { randomUUID } from "crypto";
import LocaleAPISpecs from "locale";
import ImportProcessState from "importProcessState";
import { ExportProcessState } from "exportProcessState/enums";
import ExportProcessStateAPISpecs from "exportProcessState";
import ModelInfoConstants from "./constants";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";

describe("Test ModelInfoAPISpecs Schema validity", () => {
  // WHEN the ModelInfoAPISpecs.Schemas.GET.Response.Schema.Payload schema
  // THEN expect the givenSchema to be valid
  testValidSchema(
    "ModelInfoAPISpecs.Schemas.GET.Response.Schema.Payload",
    ModelInfoAPISpecs.Schemas.GET.Response.Payload,
    [LocaleAPISpecs.Schemas.Payload]
  );
});

describe("Test objects against the ModelInfoAPISpecs.Schemas.GET.Response.Payload schema", () => {
  // GIVEN the valid ModelInfoGETResponse objects
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
  const givenValidModelInfoGETResponse = {
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
    language: getTestString(ModelInfoAPISpecs.Constants.LANGUAGE_MAX_LENGTH),
    exportProcessState: [givenExportProcessState],
    importProcessState: givenImportProcessState,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "ModelInfoAPISpecs.Schemas.GET.Response.Payload",
    ModelInfoAPISpecs.Schemas.GET.Response.Payload,
    [givenValidModelInfoGETResponse],
    [LocaleAPISpecs.Schemas.Payload]
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "ModelInfoAPISpecs.Schemas.GET.Response.Payload",
    ModelInfoAPISpecs.Schemas.GET.Response.Payload,
    [givenValidModelInfoGETResponse],
    [LocaleAPISpecs.Schemas.Payload]
  );

  // AND WHEN the schema is called with an object instead of an array
  // THEN expect the object not to validate
  testArraySchemaFailureWithValidObject(
    "ModelInfoAPISpecs.Schemas.GET.Response.Payload",
    ModelInfoAPISpecs.Schemas.GET.Response.Payload,
    givenValidModelInfoGETResponse,
    [LocaleAPISpecs.Schemas.Payload]
  );

  describe("Validate ModelInfoAPISpecs.Schemas.GET.Response.Payload fields", () => {
    // spread the items of the schema into the schema itself
    // we do this because we want to test the fields, not the fact that they are in an array
    // and in cases where we use reusable test functions we do not have control over the givenObject
    const { items, ...rest } = ModelInfoAPISpecs.Schemas.GET.Response.Payload;
    const givenSchema = { ...rest, ...items };

    describe("Test validation of 'id'", () => {
      testObjectIdField("id", givenSchema, [LocaleAPISpecs.Schemas.Payload]);
    });

    describe("Test validation of 'UUID'", () => {
      testUUIDField<ModelInfoAPISpecs.Types.GET.Response.Payload>("UUID", givenSchema, [
        LocaleAPISpecs.Schemas.Payload,
      ]);
    });

    describe("Test validation of 'path'", () => {
      testURIField<ModelInfoAPISpecs.Types.GET.Response.Payload>(
        "path",
        ModelInfoConstants.MAX_URI_LENGTH,
        givenSchema,
        [LocaleAPISpecs.Schemas.Payload]
      );
    });

    describe("Test validation of 'tabiyaPath'", () => {
      testURIField<ModelInfoAPISpecs.Types.GET.Response.Payload>(
        "tabiyaPath",
        ModelInfoConstants.MAX_URI_LENGTH,
        givenSchema,
        [LocaleAPISpecs.Schemas.Payload]
      );
    });

    describe("Test validation of 'released'", () => {
      testBooleanField("released", givenSchema, [LocaleAPISpecs.Schemas.Payload]);
    });

    describe("Test validation of 'releaseNotes'", () => {
      testStringField<ModelInfoAPISpecs.Types.GET.Response.Payload>(
        "releaseNotes",
        ModelInfoConstants.RELEASE_NOTES_MAX_LENGTH,
        givenSchema,
        [LocaleAPISpecs.Schemas.Payload]
      );
    });

    describe("Test validation of 'version'", () => {
      testStringField<ModelInfoAPISpecs.Types.GET.Response.Payload>(
        "version",
        ModelInfoConstants.VERSION_MAX_LENGTH,
        givenSchema,
        [LocaleAPISpecs.Schemas.Payload]
      );
    });

    describe("Test validation of 'createdAt'", () => {
      testTimestampField<ModelInfoAPISpecs.Types.GET.Response.Payload>("createdAt", givenSchema, [
        LocaleAPISpecs.Schemas.Payload,
      ]);
    });

    describe("Test validation of 'updatedAt'", () => {
      testTimestampField<ModelInfoAPISpecs.Types.GET.Response.Payload>("updatedAt", givenSchema, [
        LocaleAPISpecs.Schemas.Payload,
      ]);
    });

    describe("Test validation of 'name'", () => {
      testNonEmptyStringField<ModelInfoAPISpecs.Types.GET.Response.Payload>(
        "name",
        ModelInfoConstants.NAME_MAX_LENGTH,
        givenSchema,
        [LocaleAPISpecs.Schemas.Payload]
      );
    });

    describe("Test validation of 'description'", () => {
      testStringField<ModelInfoAPISpecs.Types.GET.Response.Payload>(
        "description",
        ModelInfoConstants.DESCRIPTION_MAX_LENGTH,
        givenSchema,
        [LocaleAPISpecs.Schemas.Payload]
      );
    });

    describe("Test validation of 'UUIDHistory'", () => {
      testUUIDArray<ModelInfoAPISpecs.Types.GET.Response.Payload>(
        "UUIDHistory",
        givenSchema,
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
      testRefSchemaField("locale", givenSchema, validLocale, LocaleAPISpecs.Schemas.Payload);
    });

    describe("Test validation of 'language'", () => {
      testNonEmptyStringField<ModelInfoAPISpecs.Types.POST.Response.Payload>(
        "language",
        ModelInfoConstants.LANGUAGE_MAX_LENGTH,
        ModelInfoAPISpecs.Schemas.POST.Response.Payload,
        [LocaleAPISpecs.Schemas.Payload]
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
          "a valid exportProcessState object",
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
        assertCaseForProperty("exportProcessState", givenObject, givenSchema, caseType, failureMessages, [
          LocaleAPISpecs.Schemas.Payload,
        ]);
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
            assertCaseForProperty("/exportProcessState/0/id", givenObject, givenSchema, caseType, failureMessages, [
              LocaleAPISpecs.Schemas.Payload,
            ]);
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
            assertCaseForProperty("/exportProcessState/0/status", givenObject, givenSchema, caseType, failureMessages, [
              LocaleAPISpecs.Schemas.Payload,
            ]);
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
          assertCaseForProperty(propertyPath, givenObject, givenSchema, caseType, failureMessages, [
            LocaleAPISpecs.Schemas.Payload,
          ]);
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
            givenSchema,
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
              givenSchema,
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
              givenSchema,
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
              givenSchema,
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
          givenValidModelInfoGETResponse.importProcessState,
          undefined,
        ],
      ])("(%s) Validate 'importProcessState' when it is %s", (caseType, _description, givenValue, failureMessages) => {
        // GIVEN an object with the given value
        const givenObject = {
          importProcessState: givenValue,
        };
        // THEN expect the object to validate accordingly
        assertCaseForProperty("importProcessState", givenObject, givenSchema, caseType, failureMessages, [
          LocaleAPISpecs.Schemas.Payload,
        ]);
      });
    });

    describe("Test validation of importProcessState fields", () => {
      describe("Test validation of 'importProcessState/id'", () => {
        testObjectIdField("importProcessState/id", givenSchema, [LocaleAPISpecs.Schemas.Payload]);
      });

      describe("Test validation of 'importProcessState/status'", () => {
        testEnumField("importProcessState/status", givenSchema, Object.values(ImportProcessState.Enums.Status), [
          LocaleAPISpecs.Schemas.Payload,
        ]);
      });

      describe("Test validation of 'importProcessState/result'", () => {
        testBooleanField("importProcessState/result/errored", givenSchema, [LocaleAPISpecs.Schemas.Payload]);
        testBooleanField("importProcessState/result/parsingErrors", givenSchema, [LocaleAPISpecs.Schemas.Payload]);
        testBooleanField("importProcessState/result/parsingWarnings", givenSchema, [LocaleAPISpecs.Schemas.Payload]);
      });

      describe("Test validation of 'importProcessState/createdAt'", () => {
        test.each([
          // we are using the standard stdTimestampFieldTestCases but we are filtering out the cases that are not applicable
          // in this case, since the createdAt field can be undefined we filter out the "undefined" case
          // and override it with our own case
          ...(getStdTimestampFieldTestCases("/importProcessState/createdAt").filter(testCase => testCase[1] !== "undefined")),
          [CaseType.Success, "undefined", undefined, undefined],
        ])(
          `(%s) Validate createdAt when it is %s`,
          (caseType, _description, givenValue, failureMessages) => {
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
              givenSchema,
              caseType,
              failureMessages,
              [LocaleAPISpecs.Schemas.Payload]
            );
          }
        );
      });

      describe("Test validation of 'importProcessState/updatedAt'", () => {
        test.each(
          [
            // we are using the standard stdTimestampFieldTestCases but we are filtering out the cases that are not applicable
            // in this case, since the updatedAt field can be undefined, we filter out the "undefined" case
            // and override them with our own cases
            ...(getStdTimestampFieldTestCases("/importProcessState/updatedAt").filter(testCase => testCase[1] !== "undefined")),
            [CaseType.Success, "undefined", undefined, undefined]
          ]
        )(
          `(%s) Validate createdAt when it is %s`,
          (caseType, _description, givenValue, failureMessages) => {
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
              givenSchema,
              caseType,
              failureMessages,
              [LocaleAPISpecs.Schemas.Payload]
            );
          }
        );
      });
    });
  });
});
