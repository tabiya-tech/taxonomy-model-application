import {
  testArraySchemaFailureWithValidObject,
  testNonEmptyStringField,
  testObjectIdField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testStringField,
  testTimestampField,
  testURIField,
  testUUIDField,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import OccupationGroupAPISpecs from "./index";
import { getTestString } from "_test_utilities/specialCharacters";
import { getMockId } from "_test_utilities/mockMongoId";
import { randomUUID } from "crypto";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import OccupationGroupEnums from "./enums";
import ModelInfoAPISpecs from "modelInfo";
import {
  getStdNonEmptyStringTestCases,
  getStdStringTestCases,
  getStdUUIDTestCases,
} from "_test_utilities/stdSchemaTestCases";
import LocaleAPISpecs from "locale";
import ModelInfoConstants from "modelInfo/constants";

describe("Test OccupationGroup Schema Validity", () => {
  testValidSchema(
    "OccupationGroupAPISpecs.Schemas.GET.Response.Schema.Payload",
    OccupationGroupAPISpecs.Schemas.GET.Response.Payload,
    [LocaleAPISpecs.Schemas.Payload, ModelInfoAPISpecs.Schemas.GET.Response.Payload]
  );
});

describe("Test objects against the OccupationGroupAPISpecs.Schemas.GET.Response.Payload schema", () => {
  const givenModel = {
    id: getMockId(1),
    UUID: randomUUID(),
    name: getTestString(ModelInfoConstants.NAME_MAX_LENGTH),
    localeShortCode: getTestString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
    version: getTestString(ModelInfoConstants.VERSION_MAX_LENGTH),
  };

  const givenValidOccupationGroupGETResponse = {
    id: getMockId(1),
    modelId: givenModel,
    UUID: randomUUID(),
    code: getTestString(10),
    preferredLabel: getTestString(20),
    originUri: "https://foo/bar",
    path: "https://path/to/tabiya",
    tabiyaPath: "https://path/to/tabiya",
    description: getTestString(50),
    altLabels: [getTestString(15), getTestString(25)],
    groupType: OccupationGroupEnums.ENUMS.GroupType.ISCOGroup,
    importId: getTestString(10),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  testSchemaWithValidObject(
    "OccupationGroupAPISpecs.Schema.GET.Response.Payload",
    OccupationGroupAPISpecs.Schemas.GET.Response.Payload,
    [givenValidOccupationGroupGETResponse],
    [LocaleAPISpecs.Schemas.Payload]
  );

  testSchemaWithAdditionalProperties(
    "OccupationGroupAPISpecs.Schema.GET.Response.Payload",
    OccupationGroupAPISpecs.Schemas.GET.Response.Payload,
    [givenValidOccupationGroupGETResponse],
    [LocaleAPISpecs.Schemas.Payload]
  );

  testArraySchemaFailureWithValidObject(
    "OccupationGroupAPISpecs.Schema.GET.Response.Payload",
    OccupationGroupAPISpecs.Schemas.GET.Response.Payload,
    givenValidOccupationGroupGETResponse,
    [LocaleAPISpecs.Schemas.Payload]
  );

  describe("Validate OccupationGroupAPISpecs.Schemas.GET.Response.Payload fields", () => {
    // spread the items of the schema into the schema itself
    // we do this because we want to test the fields, not the fact that they are in an array
    // and in cases where we use reusable test functions we do not have control over the givenObject
    const { items, ...rest } = OccupationGroupAPISpecs.Schemas.GET.Response.Payload;
    const givenSchema = { ...rest, ...items };

    describe("Test validate of 'id' ", () => {
      testObjectIdField("id", givenSchema, [LocaleAPISpecs.Schemas.Payload]);
    });

    describe("Test Validate of 'UUID'", () => {
      testUUIDField<OccupationGroupAPISpecs.Types.GET.Response.Payload>("UUID", givenSchema, [
        LocaleAPISpecs.Schemas.Payload,
      ]);
    });

    describe("Test validate of 'path'", () => {
      testURIField<OccupationGroupAPISpecs.Types.GET.Response.Payload>(
        "path",
        OccupationGroupAPISpecs.Constants.MAX_URI_LENGTH,
        givenSchema,
        [LocaleAPISpecs.Schemas.Payload]
      );
    });

    describe("Test validate of 'tabiyaPath'", () => {
      testURIField<OccupationGroupAPISpecs.Types.GET.Response.Payload>(
        "tabiyaPath",
        OccupationGroupAPISpecs.Constants.MAX_URI_LENGTH,
        givenSchema,
        [LocaleAPISpecs.Schemas.Payload]
      );
    });

    describe("Test validate of 'originUri'", () => {
      testURIField<OccupationGroupAPISpecs.Types.GET.Response.Payload>(
        "originUri",
        OccupationGroupAPISpecs.Constants.MAX_URI_LENGTH,
        givenSchema,
        [LocaleAPISpecs.Schemas.Payload]
      );
    });

    describe("Test validate of 'code'", () => {
      testNonEmptyStringField<OccupationGroupAPISpecs.Types.GET.Response.Payload>(
        "code",
        OccupationGroupAPISpecs.Constants.CODE_MAX_LENGTH,
        givenSchema,
        [LocaleAPISpecs.Schemas.Payload]
      );
    });

    describe("Test validate of 'description'", () => {
      testStringField<OccupationGroupAPISpecs.Types.GET.Response.Payload>(
        "description",
        OccupationGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH,
        givenSchema,
        [LocaleAPISpecs.Schemas.Payload]
      );
    });
    describe("Test validate of 'preferredLabel'", () => {
      testNonEmptyStringField<OccupationGroupAPISpecs.Types.GET.Response.Payload>(
        "preferredLabel",
        OccupationGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH,
        givenSchema,
        [LocaleAPISpecs.Schemas.Payload]
      );
    });
    describe("Test validate of 'createdAt'", () => {
      testTimestampField<OccupationGroupAPISpecs.Types.GET.Response.Payload>("createdAt", givenSchema, [
        LocaleAPISpecs.Schemas.Payload,
      ]);
    });
    describe("Test validate of 'updatedAt'", () => {
      testTimestampField<OccupationGroupAPISpecs.Types.GET.Response.Payload>("updatedAt", givenSchema, [
        LocaleAPISpecs.Schemas.Payload,
      ]);
    });

    describe("Test validate of 'importId'", () => {
      testStringField<OccupationGroupAPISpecs.Types.GET.Response.Payload>(
        "importId",
        OccupationGroupAPISpecs.Constants.IMPORT_ID_MAX_LENGTH,
        givenSchema,
        [LocaleAPISpecs.Schemas.Payload]
      );
    });

    describe("Test validate of 'groupType'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'groupType'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/groupType", "type", "must be string")],
        [
          CaseType.Failure,
          "empty string",
          "",
          constructSchemaError("/groupType", "enum", "must be equal to one of the allowed values"),
        ],
        [
          CaseType.Failure,
          "an invalid groupType",
          "invalidGroupType",
          constructSchemaError("/groupType", "enum", "must be equal to one of the allowed values"),
        ],
        [CaseType.Success, "a valid groupType", OccupationGroupEnums.ENUMS.GroupType.ISCOGroup, undefined],
      ])("%s Validate 'groupType' when it is %s", (caseType, __description, givenValue, failureMessage) => {
        // GIVEN an object with given value
        const givenObject = {
          groupType: givenValue,
        };

        // THEN export the object to validate accordingly
        assertCaseForProperty("groupType", givenObject, givenSchema, caseType, failureMessage, [
          LocaleAPISpecs.Schemas.Payload,
        ]);
      });
    });

    describe("Test validate of 'altLabels'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'altLabels'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/altLabels", "type", "must be array")],
        [CaseType.Failure, "empty string", "", constructSchemaError("/altLabels", "type", "must be array")],
        [
          CaseType.Failure,
          "an array of objects",
          [{}, {}],
          [
            constructSchemaError("/altLabels/0", "type", "must be string"),
            constructSchemaError("/altLabels/1", "type", "must be string"),
          ],
        ],
        [
          CaseType.Success,
          "an array of valid altLabels strings",
          [
            getTestString(OccupationGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH),
            getTestString(OccupationGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH),
          ],
          undefined,
        ],
      ])("%s Validate 'altLabels' when it is %s", (caseType, __description, givenValue, failureMessage) => {
        // GIVEN an object with given value
        const givenObject = {
          altLabels: givenValue,
        };

        // THEN export the array to validate accordingly
        assertCaseForProperty("altLabels", givenObject, givenSchema, caseType, failureMessage, [
          LocaleAPISpecs.Schemas.Payload,
        ]);
      });
    });

    describe("Test validation of 'modelId'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'modelId'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/modelId", "type", "must be object")],
        [CaseType.Failure, "a string", "foo", constructSchemaError("/modelId", "type", "must be object")],
        [CaseType.Failure, "an array", ["foo", "bar"], constructSchemaError("/modelId", "type", "must be object")],
        [CaseType.Success, "a valid modelId object", givenValidOccupationGroupGETResponse.modelId, undefined],
      ])("(%s) Validate 'modelId' when it is %s", (caseType, _description, givenValue, failureMessages) => {
        const givenObject = {
          modelId: givenValue,
        };

        assertCaseForProperty("modelId", givenObject, givenSchema, caseType, failureMessages, [
          LocaleAPISpecs.Schemas.Payload,
        ]);
      });
    });
    describe("Test validate of 'modelId' properties", () => {
      describe("Test validation of 'modelId/id'", () => {
        testObjectIdField("modelId/id", givenSchema, [LocaleAPISpecs.Schemas.Payload]);
      });

      describe("Test validation of 'modelId/UUID'", () => {
        test.each([...getStdUUIDTestCases("/modelId/UUID")])(
          `(%s) Validate 'UUID' when it is %s`,
          (caseType, _description, givenValue, failureMessages) => {
            // GIVEN an object with the given value
            const givenObject = {
              modelId: {
                UUID: givenValue,
              },
            };
            // THEN expect the object to validate accordingly
            assertCaseForProperty("/modelId/UUID", givenObject, givenSchema, caseType, failureMessages, [
              LocaleAPISpecs.Schemas.Payload,
            ]);
          }
        );
      });

      describe("Test validation of 'modelId/name'", () => {
        // filter out the null case since the field can be null, and then replace it with our own case
        const testCases = getStdNonEmptyStringTestCases(
          "/modelId/name",
          ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH
        ).filter((testCase) => testCase[1] !== "null");
        test.each([
          ...testCases,
          [CaseType.Failure, "null", null, constructSchemaError("/modelId/name", "type", "must be string")],
        ])(`(%s) Validate 'name' when it is %s`, (caseType, _description, givenValue, failureMessages) => {
          // GIVEN an object with the given value
          const givenObject = {
            modelId: {
              name: givenValue,
            },
          };
          // THEN expect the object to validate accordingly
          assertCaseForProperty("/modelId/name", givenObject, givenSchema, caseType, failureMessages, [
            LocaleAPISpecs.Schemas.Payload,
          ]);
        });
      });

      describe("Test validation of 'modelId/localeShortCode'", () => {
        const testCases = getStdNonEmptyStringTestCases(
          "/modelId/localeShortCode",
          LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH
        ).filter((testCase) => testCase[1] !== "null");
        test.each([
          ...testCases,
          [CaseType.Failure, "null", null, constructSchemaError("/modelId/localeShortCode", "type", "must be string")],
        ])(`(%s) Validate 'localeShortCode' when it is %s`, (caseType, _description, givenValue, failureMessages) => {
          // GIVEN an object with the given value
          const givenObject = {
            modelId: {
              localeShortCode: givenValue,
            },
          };
          // THEN expect the object to validate accordingly
          assertCaseForProperty("/modelId/localeShortCode", givenObject, givenSchema, caseType, failureMessages, [
            LocaleAPISpecs.Schemas.Payload,
          ]);
        });
      });

      describe("Test validation of 'modelId/version'", () => {
        // filter out the null case since the field can be null, and then replace it with our own case
        const testCases = getStdStringTestCases(
          "/modelId/version",
          ModelInfoAPISpecs.Constants.VERSION_MAX_LENGTH
        ).filter((testCase) => testCase[1] !== "null");
        test.each([
          ...testCases,
          [CaseType.Failure, "null", null, constructSchemaError("/modelId/version", "type", "must be string")],
        ])(`(%s) Validate 'version' when it is %s`, (caseType, _description, givenValue, failureMessages) => {
          // GIVEN an object with the given value
          const givenObject = {
            modelId: {
              version: givenValue,
            },
          };
          // THEN expect the object to validate accordingly
          assertCaseForProperty("/modelId/version", givenObject, givenSchema, caseType, failureMessages, [
            LocaleAPISpecs.Schemas.Payload,
          ]);
        });
      });
    });
  });
});
