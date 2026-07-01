import {
  testBooleanField,
  testNonEmptyStringField,
  testObjectIdField,
  testRefSchemaField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testStringField,
  testTimestampField,
  testUUIDField,
  testURIField,
  testEnumField,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import {
  getStdObjectIdTestCases,
  getStdTimestampFieldTestCases,
  getStdURIFieldTestCases,
  getStdEnumTestCases,
  getStdUUIDTestCases,
  getStdNonEmptyStringTestCases,
  getStdStringTestCases,
} from "_test_utilities/stdSchemaTestCases";
import { _baseResponseSchema } from "./schemas.base";
import { getTestString } from "_test_utilities/specialCharacters";
import { getMockId } from "_test_utilities/mockMongoId";
import { randomUUID } from "crypto";
import LocaleAPISpecs from "locale";
import ImportProcessState from "importProcessState";
import { ExportProcessState } from "exportProcessState/enums";
import ExportProcessStateAPISpecs from "exportProcessState";
import ModelInfoConstants from "./constants";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";

// _baseResponseSchema is the shared base schema reused (via deep copy) by the modelInfo GET/POST response
// schemas as well as by every entity endpoint that returns a full ModelInfo object (e.g. the occupation
// history endpoint). It has no $id of its own since it is only ever spread into other schemas.
// To exercise it directly here we give a local copy a $id so it can be registered/compiled by AJV.
const baseResponseSchemaWithId = {
  ...JSON.parse(JSON.stringify(_baseResponseSchema)),
  $id: "/components/schemas/ModelInfoBaseResponseSchema",
};

describe("Test ModelInfo _baseResponseSchema validity", () => {
  // WHEN the _baseResponseSchema
  // THEN expect the givenSchema to be valid
  testValidSchema("ModelInfo _baseResponseSchema", baseResponseSchemaWithId, [LocaleAPISpecs.Schemas.Payload]);
});

describe("Test objects against the ModelInfo _baseResponseSchema", () => {
  // GIVEN a valid full ModelInfo response object
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
  const givenModelHistory = {
    id: getMockId(1),
    UUID: randomUUID(),
    name: getTestString(ModelInfoConstants.NAME_MAX_LENGTH),
    version: getTestString(ModelInfoConstants.VERSION_MAX_LENGTH),
    localeShortCode: getTestString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
  };

  const givenValidModelInfoResponse = {
    id: getMockId(1),
    UUID: randomUUID(),
    modelHistory: [givenModelHistory],
    path: "https://path/to/tabiya",
    tabiyaPath: "https://path/to/tabiya",
    name: getTestString(ModelInfoConstants.NAME_MAX_LENGTH),
    description: getTestString(ModelInfoConstants.NAME_MAX_LENGTH),
    license: getTestString(ModelInfoConstants.LICENSE_MAX_LENGTH),
    locale: {
      name: getTestString(ModelInfoConstants.NAME_MAX_LENGTH),
      UUID: randomUUID(),
      shortCode: getTestString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
    },
    releaseNotes: getTestString(ModelInfoConstants.RELEASE_NOTES_MAX_LENGTH),
    released: false,
    version: getTestString(ModelInfoConstants.VERSION_MAX_LENGTH),
    exportProcessState: [givenExportProcessState],
    importProcessState: givenImportProcessState,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject("ModelInfo _baseResponseSchema", baseResponseSchemaWithId, givenValidModelInfoResponse, [
    LocaleAPISpecs.Schemas.Payload,
  ]);

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "ModelInfo _baseResponseSchema",
    baseResponseSchemaWithId,
    givenValidModelInfoResponse,
    [LocaleAPISpecs.Schemas.Payload]
  );

  describe("Validate ModelInfo _baseResponseSchema fields", () => {
    const givenSchema = baseResponseSchemaWithId;

    describe("Test validation of 'id'", () => {
      testObjectIdField("id", givenSchema, [LocaleAPISpecs.Schemas.Payload]);
    });

    describe("Test validation of 'UUID'", () => {
      testUUIDField("UUID", givenSchema, [LocaleAPISpecs.Schemas.Payload]);
    });

    describe("Test validation of 'path'", () => {
      testURIField("path", ModelInfoConstants.MAX_URI_LENGTH, givenSchema, [LocaleAPISpecs.Schemas.Payload]);
    });

    describe("Test validation of 'tabiyaPath'", () => {
      testURIField("tabiyaPath", ModelInfoConstants.MAX_URI_LENGTH, givenSchema, [LocaleAPISpecs.Schemas.Payload]);
    });

    describe("Test validation of 'released'", () => {
      testBooleanField("released", givenSchema, [LocaleAPISpecs.Schemas.Payload]);
    });

    describe("Test validation of 'releaseNotes'", () => {
      testStringField("releaseNotes", ModelInfoConstants.RELEASE_NOTES_MAX_LENGTH, givenSchema, [
        LocaleAPISpecs.Schemas.Payload,
      ]);
    });

    describe("Test validation of 'version'", () => {
      testStringField("version", ModelInfoConstants.VERSION_MAX_LENGTH, givenSchema, [LocaleAPISpecs.Schemas.Payload]);
    });

    describe("Test validation of 'createdAt'", () => {
      testTimestampField("createdAt", givenSchema, [LocaleAPISpecs.Schemas.Payload]);
    });

    describe("Test validation of 'updatedAt'", () => {
      testTimestampField("updatedAt", givenSchema, [LocaleAPISpecs.Schemas.Payload]);
    });

    describe("Test validation of 'name'", () => {
      testNonEmptyStringField("name", ModelInfoConstants.NAME_MAX_LENGTH, givenSchema, [
        LocaleAPISpecs.Schemas.Payload,
      ]);
    });

    describe("Test validation of 'description'", () => {
      testStringField("description", ModelInfoConstants.DESCRIPTION_MAX_LENGTH, givenSchema, [
        LocaleAPISpecs.Schemas.Payload,
      ]);
    });

    describe("Test validation of 'license'", () => {
      testStringField("license", ModelInfoConstants.LICENSE_MAX_LENGTH, givenSchema, [LocaleAPISpecs.Schemas.Payload]);
    });

    describe("Test validation of 'locale'", () => {
      const validLocale = {
        name: getTestString(ModelInfoConstants.NAME_MAX_LENGTH),
        UUID: randomUUID(),
        shortCode: getTestString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
      };
      testRefSchemaField("locale", givenSchema, validLocale, LocaleAPISpecs.Schemas.Payload);
    });

    describe("Test validation of 'modelHistory'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'modelHistory'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/modelHistory", "type", "must be array")],
        [CaseType.Failure, "empty string", "", constructSchemaError("/modelHistory", "type", "must be array")],
        [
          CaseType.Failure,
          "an array of strings",
          ["foo", "bar"],
          [
            constructSchemaError("/modelHistory/0", "type", "must be object"),
            constructSchemaError("/modelHistory/1", "type", "must be object"),
          ],
        ],
        [
          CaseType.Success,
          "an array of valid modelHistory objects",
          [
            {
              UUID: randomUUID(),
              name: getTestString(ModelInfoConstants.NAME_MAX_LENGTH),
              version: getTestString(ModelInfoConstants.VERSION_MAX_LENGTH),
              localeShortCode: getTestString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
            },
          ],
          undefined,
        ],
      ])("(%s) Validate 'modelHistory' when it is %s", (caseType, _description, givenValue, failureMessages) => {
        const givenObject = {
          modelHistory: givenValue,
        };
        assertCaseForProperty("modelHistory", givenObject, givenSchema, caseType, failureMessages, [
          LocaleAPISpecs.Schemas.Payload,
        ]);
      });
    });

    describe("Test validation of modelHistory fields", () => {
      describe("Test validation of 'modelHistory/id'", () => {
        // filter out the null case since the field can be null, and then replace it with our own case
        const testCases = getStdObjectIdTestCases("/modelHistory/0/id").filter((testCase) => testCase[1] !== "null");
        test.each([...testCases, [CaseType.Success, "null", null, undefined]])(
          "(%s) Validate 'id' when it is %s",
          (caseType, _description, givenValue, failureMessages) => {
            const givenObject = {
              modelHistory: [
                {
                  id: givenValue,
                },
              ],
            };
            assertCaseForProperty("/modelHistory/0/id", givenObject, givenSchema, caseType, failureMessages, [
              LocaleAPISpecs.Schemas.Payload,
            ]);
          }
        );
      });

      describe("Test validation of 'modelHistory/UUID'", () => {
        test.each([...getStdUUIDTestCases("/modelHistory/0/UUID")])(
          `(%s) Validate 'UUID' when it is %s`,
          (caseType, _description, givenValue, failureMessages) => {
            const givenObject = {
              modelHistory: [
                {
                  UUID: givenValue,
                },
              ],
            };
            assertCaseForProperty("/modelHistory/0/UUID", givenObject, givenSchema, caseType, failureMessages, [
              LocaleAPISpecs.Schemas.Payload,
            ]);
          }
        );
      });

      describe("Test validation of 'modelHistory/name'", () => {
        // filter out the null case since the field can be null, and then replace it with our own case
        const testCases = getStdNonEmptyStringTestCases(
          "/modelHistory/0/name",
          ModelInfoConstants.NAME_MAX_LENGTH
        ).filter((testCase) => testCase[1] !== "null");
        test.each([...testCases, [CaseType.Success, "null", null, undefined]])(
          `(%s) Validate 'name' when it is %s`,
          (caseType, _description, givenValue, failureMessages) => {
            const givenObject = {
              modelHistory: [
                {
                  name: givenValue,
                },
              ],
            };
            assertCaseForProperty("/modelHistory/0/name", givenObject, givenSchema, caseType, failureMessages, [
              LocaleAPISpecs.Schemas.Payload,
            ]);
          }
        );
      });

      describe("Test validation of 'modelHistory/version'", () => {
        // filter out the null case since the field can be null, and then replace it with our own case
        const testCases = getStdStringTestCases(
          "/modelHistory/0/version",
          ModelInfoConstants.VERSION_MAX_LENGTH
        ).filter((testCase) => testCase[1] !== "null");
        test.each([...testCases, [CaseType.Success, "null", null, undefined]])(
          `(%s) Validate 'version' when it is %s`,
          (caseType, _description, givenValue, failureMessages) => {
            //@ts-ignore
            const givenObject = {
              modelHistory: [
                {
                  version: givenValue,
                },
              ],
            };
            assertCaseForProperty("/modelHistory/0/version", givenObject, givenSchema, caseType, failureMessages, [
              LocaleAPISpecs.Schemas.Payload,
            ]);
          }
        );
      });

      describe("Test validation of 'modelHistory/localeShortCode'", () => {
        // filter out the null case since the field can be null, and then replace it with our own case
        const testCases = getStdNonEmptyStringTestCases(
          "/modelHistory/0/localeShortCode",
          LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH
        ).filter((testCase) => testCase[1] !== "null");
        test.each([...testCases, [CaseType.Success, "null", null, undefined]])(
          "(%s) Validate 'localeShortCode' when it is %s",
          (caseType, _description, givenValue, failureMessages) => {
            const givenObject = {
              modelHistory: [
                {
                  localeShortCode: givenValue,
                },
              ],
            };
            assertCaseForProperty(
              "/modelHistory/0/localeShortCode",
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
        const givenObject = {
          exportProcessState: givenValue,
        };
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
            const givenObject = {
              exportProcessState: [
                {
                  id: givenValue,
                },
              ],
            };
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
            const givenObject = {
              exportProcessState: [
                {
                  status: givenValue,
                },
              ],
            };
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
          const givenObject = {
            exportProcessState: [
              {
                result: {
                  [propertyName]: givenValue,
                },
              },
            ],
          };
          assertCaseForProperty(propertyPath, givenObject, givenSchema, caseType, failureMessages, [
            LocaleAPISpecs.Schemas.Payload,
          ]);
        });
      });

      describe("Test validation of 'exportProcessState/downloadUrl'", () => {
        test.each(
          getStdURIFieldTestCases("/exportProcessState/0/downloadUrl", ModelInfoConstants.MAX_URI_LENGTH, true)
        )(`(%s) Validate downloadUrl when it is %s`, (caseType, _description, givenValue, failureMessages) => {
          const givenObject = {
            exportProcessState: [
              {
                downloadUrl: givenValue,
              },
            ],
          };
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

      describe.each([
        ["/exportProcessState/0/timestamp", "timestamp"],
        ["/exportProcessState/0/createdAt", "createdAt"],
        ["/exportProcessState/0/updatedAt", "updatedAt"],
      ])(`Test validation of '%s'`, (propertyPath, propertyName) => {
        test.each(getStdTimestampFieldTestCases(propertyPath))(
          `(%s) Validate ${propertyName} when it is %s`,
          (caseType, _description, givenValue, failureMessages) => {
            const givenObject = {
              exportProcessState: [
                {
                  [propertyName]: givenValue,
                },
              ],
            };
            assertCaseForProperty(propertyPath, givenObject, givenSchema, caseType, failureMessages, [
              LocaleAPISpecs.Schemas.Payload,
            ]);
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
          givenValidModelInfoResponse.importProcessState,
          undefined,
        ],
      ])("(%s) Validate 'importProcessState' when it is %s", (caseType, _description, givenValue, failureMessages) => {
        const givenObject = {
          importProcessState: givenValue,
        };
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

      describe.each([
        ["/importProcessState/createdAt", "createdAt"],
        ["/importProcessState/updatedAt", "updatedAt"],
      ])(`Test validation of '%s'`, (propertyPath, propertyName) => {
        test.each([
          // createdAt/updatedAt can be undefined, so filter out the "undefined" failure case and override it with a success
          ...getStdTimestampFieldTestCases(propertyPath).filter((testCase) => testCase[1] !== "undefined"),
          [CaseType.Success, "undefined", undefined, undefined],
        ])(`(%s) Validate ${propertyName} when it is %s`, (caseType, _description, givenValue, failureMessages) => {
          const givenObject = {
            importProcessState: {
              [propertyName]: givenValue,
            },
          };
          assertCaseForProperty(propertyPath, givenObject, givenSchema, caseType, failureMessages, [
            LocaleAPISpecs.Schemas.Payload,
          ]);
        });
      });
    });
  });
});
