import { randomUUID } from "crypto";
import {
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
import OccupationGroupAPISpecs from ".";
import { getMockId } from "_test_utilities/mockMongoId";
import OccupationGroupEnums from "./enums";
import { getTestString } from "_test_utilities/specialCharacters";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import ModelInfoAPISpecs from "modelInfo";
import {
  getStdNonEmptyStringTestCases,
  getStdStringTestCases,
  getStdUUIDTestCases,
} from "_test_utilities/stdSchemaTestCases";
import LocaleAPISpecs from "locale";
import ModelInfoConstants from "modelInfo/constants";

describe("Test OccupationGroupAPISpecs schema validity", () => {
  // WHEN the OccupationGroupAPISpecs.POST.Response.Schema.Payload schema
  // THEN expect the givenSchema to be valid
  testValidSchema(
    "OccupationGroupAPISpecs.Schemas.POST.Request.Payload",
    OccupationGroupAPISpecs.Schemas.POST.Request.Payload,
    [LocaleAPISpecs.Schemas.Payload, ModelInfoAPISpecs.Schemas.GET.Response.Payload]
  );
});

describe("Test objects against the OccupationGroupAPISpecs.Schemas.POST.Response.Payload schema", () => {
  const givenModel = {
    id: getMockId(1),
    UUID: randomUUID(),
    name: getTestString(ModelInfoConstants.NAME_MAX_LENGTH),
    localeShortCode: getTestString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
    version: getTestString(ModelInfoConstants.VERSION_MAX_LENGTH),
  };

  const givenValidOccupationGroupPOSTResponse = {
    id: getMockId(1),
    UUID: randomUUID(),
    path: "https://path/to/tabiya",
    tabiyaPath: "https://path/to/tabiya",
    groupType: OccupationGroupEnums.ENUMS.GroupType.LocalGroup,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    originUri: "https://foo/bar",
    code: getTestString(10),
    description: getTestString(50),
    preferredLabel: getTestString(20),
    altLabels: [getTestString(15), getTestString(25)],
    importId: getTestString(10),
    modelId: givenModel,
  };

  // WHEN the object is valid
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "OccupationGroupAPISpecs.Schemas.POST.Response.Payload",
    OccupationGroupAPISpecs.Schemas.POST.Response.Payload,
    givenValidOccupationGroupPOSTResponse,
    [LocaleAPISpecs.Schemas.Payload]
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "OccupationGroupAPISpecs.Schemas.POST.Response.Payload",
    OccupationGroupAPISpecs.Schemas.POST.Response.Payload,
    givenValidOccupationGroupPOSTResponse,
    [LocaleAPISpecs.Schemas.Payload]
  );

  describe("Validate OccupationGroupAPISpecs.Schemas.POST.Response.Payload fields", () => {
    describe("Test validate of 'id'", () => {
      testObjectIdField("id", OccupationGroupAPISpecs.Schemas.POST.Response.Payload, [LocaleAPISpecs.Schemas.Payload]);
    });

    describe("Test validate of 'UUID'", () => {
      testUUIDField<OccupationGroupAPISpecs.Types.POST.Response.Payload>(
        "UUID",
        OccupationGroupAPISpecs.Schemas.POST.Response.Payload,
        [LocaleAPISpecs.Schemas.Payload]
      );
    });

    describe("Test validation of 'path'", () => {
      testURIField<OccupationGroupAPISpecs.Types.POST.Response.Payload>(
        "path",
        OccupationGroupAPISpecs.Constants.MAX_URI_LENGTH,
        OccupationGroupAPISpecs.Schemas.POST.Response.Payload,
        [LocaleAPISpecs.Schemas.Payload]
      );
    });

    describe("Test validation of 'tabiyaPath'", () => {
      testURIField<OccupationGroupAPISpecs.Types.POST.Response.Payload>(
        "tabiyaPath",
        OccupationGroupAPISpecs.Constants.MAX_URI_LENGTH,
        OccupationGroupAPISpecs.Schemas.POST.Response.Payload,
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
        assertCaseForProperty(
          "groupType",
          givenObject,
          OccupationGroupAPISpecs.Schemas.POST.Response.Payload,
          caseType,
          failureMessage,
          [LocaleAPISpecs.Schemas.Payload]
        );
      });
    });

    describe("Test validate of 'createdAt'", () => {
      testTimestampField<OccupationGroupAPISpecs.Types.POST.Response.Payload>(
        "createdAt",
        OccupationGroupAPISpecs.Schemas.POST.Response.Payload,
        [LocaleAPISpecs.Schemas.Payload]
      );
    });
    describe("Test validate of 'updatedAt'", () => {
      testTimestampField<OccupationGroupAPISpecs.Types.POST.Response.Payload>(
        "updatedAt",
        OccupationGroupAPISpecs.Schemas.POST.Response.Payload,
        [LocaleAPISpecs.Schemas.Payload]
      );
    });
    describe("Test validation of 'originUri'", () => {
      testURIField<OccupationGroupAPISpecs.Types.POST.Response.Payload>(
        "originUri",
        OccupationGroupAPISpecs.Constants.MAX_URI_LENGTH,
        OccupationGroupAPISpecs.Schemas.POST.Response.Payload,
        [LocaleAPISpecs.Schemas.Payload]
      );
    });
    describe("Test validate of 'code'", () => {
      testNonEmptyStringField<OccupationGroupAPISpecs.Types.POST.Response.Payload>(
        "code",
        OccupationGroupAPISpecs.Constants.CODE_MAX_LENGTH,
        OccupationGroupAPISpecs.Schemas.POST.Response.Payload,
        [LocaleAPISpecs.Schemas.Payload]
      );
    });
    describe("Test validate of 'description'", () => {
      testStringField<OccupationGroupAPISpecs.Types.POST.Response.Payload>(
        "description",
        OccupationGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH,
        OccupationGroupAPISpecs.Schemas.POST.Response.Payload,
        [LocaleAPISpecs.Schemas.Payload]
      );
    });
    describe("Test validate of 'preferredLabel'", () => {
      testNonEmptyStringField<OccupationGroupAPISpecs.Types.POST.Response.Payload>(
        "preferredLabel",
        OccupationGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH,
        OccupationGroupAPISpecs.Schemas.POST.Response.Payload,
        [LocaleAPISpecs.Schemas.Payload]
      );
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
        assertCaseForProperty(
          "altLabels",
          givenObject,
          OccupationGroupAPISpecs.Schemas.POST.Response.Payload,
          caseType,
          failureMessage,
          [LocaleAPISpecs.Schemas.Payload]
        );
      });
    });

    describe("Test validate of 'importId'", () => {
      testStringField<OccupationGroupAPISpecs.Types.POST.Response.Payload>(
        "importId",
        OccupationGroupAPISpecs.Constants.IMPORT_ID_MAX_LENGTH,
        OccupationGroupAPISpecs.Schemas.POST.Response.Payload,
        [LocaleAPISpecs.Schemas.Payload]
      );
    });
    describe("Test validate of 'modelId'", () => {
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
        [CaseType.Success, "a valid modelId object", givenValidOccupationGroupPOSTResponse.modelId, undefined],
      ])("(%s) Validate 'modelId' when it is %s", (caseType, _description, givenValue, failureMessages) => {
        const givenObject = {
          modelId: givenValue,
        };

        assertCaseForProperty(
          "modelId",
          givenObject,
          OccupationGroupAPISpecs.Schemas.POST.Response.Payload,
          caseType,
          failureMessages,
          [LocaleAPISpecs.Schemas.Payload]
        );
      });
    });

    describe("Test validate of 'modelId' properties", () => {
      describe("Test validation of 'modelId/id'", () => {
        testObjectIdField("modelId/id", OccupationGroupAPISpecs.Schemas.POST.Response.Payload, [
          LocaleAPISpecs.Schemas.Payload,
        ]);
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
            assertCaseForProperty(
              "/modelId/UUID",
              givenObject,
              OccupationGroupAPISpecs.Schemas.POST.Response.Payload,
              caseType,
              failureMessages,
              [LocaleAPISpecs.Schemas.Payload]
            );
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
          assertCaseForProperty(
            "/modelId/name",
            givenObject,
            OccupationGroupAPISpecs.Schemas.POST.Response.Payload,
            caseType,
            failureMessages,
            [LocaleAPISpecs.Schemas.Payload]
          );
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
          assertCaseForProperty(
            "/modelId/localeShortCode",
            givenObject,
            OccupationGroupAPISpecs.Schemas.POST.Response.Payload,
            caseType,
            failureMessages,
            [LocaleAPISpecs.Schemas.Payload]
          );
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
          assertCaseForProperty(
            "/modelId/version",
            givenObject,
            OccupationGroupAPISpecs.Schemas.POST.Response.Payload,
            caseType,
            failureMessages,
            [LocaleAPISpecs.Schemas.Payload]
          );
        });
      });
    });
  });
});
