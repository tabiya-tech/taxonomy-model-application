import {
  testStringField,
  testNonEmptyStringField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
  testObjectIdField,
  testUUIDArray,
  testNonEmptyURIStringField,
} from "_test_utilities/stdSchemaTests";

import { randomUUID } from "crypto";
import { getTestString } from "_test_utilities/specialCharacters";
import { getTestLocalGroupCode, getTestESCOOccupationCode, getTestISCOGroupCode } from "../_test_utilities/testUtils";
import { CaseType, assertCaseForProperty, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import OccupationAPISpecs from "./index";
import OccupationConstants from "./constants";
import { getMockId } from "_test_utilities/mockMongoId";
import LocaleAPISpecs from "locale";
import ModelInfoAPISpecs from "modelInfo";
import OccupationEnums from "./enums";

describe("OccupationAPISpecs.Schemas.POST.Request.Payload schema", () => {
  // WHEN the OccupationAPISpecs.POST.Request.Schema.Payload schema
  // THEN expect the givenSchema to be valid
  testValidSchema("OccupationAPISpecs.Schemas.POST.Request.Payload", OccupationAPISpecs.Schemas.POST.Request.Payload);
});

describe("Test objects against the OccupationAPISpecs.Schemas.POST.Request.Payload schema", () => {
  // GIVEN a valid request payload object
  const validPayload = {
    code: getTestESCOOccupationCode(),
    originUri: "https://example.com",
    occupationGroupCode: getTestISCOGroupCode(),
    description: getTestString(OccupationConstants.DESCRIPTION_MAX_LENGTH),
    preferredLabel: getTestString(OccupationConstants.PREFERRED_LABEL_MAX_LENGTH),
    altLabels: [getTestString(OccupationConstants.ALT_LABEL_MAX_LENGTH)],
    definition: getTestString(OccupationConstants.DEFINITION_MAX_LENGTH),
    regulatedProfessionNote: getTestString(OccupationConstants.REGULATED_PROFESSION_NOTE_MAX_LENGTH),
    scopeNote: getTestString(OccupationConstants.SCOPE_NOTE_MAX_LENGTH),
    modelId: getMockId(1),
    UUIDHistory: [randomUUID(), randomUUID()],
    occupationType: OccupationEnums.OccupationType.ESCOOccupation,
    isLocalized: true,
  };

  testSchemaWithValidObject("valid payload", OccupationAPISpecs.Schemas.POST.Request.Payload, validPayload, [
    LocaleAPISpecs.Schemas.Payload,
    ModelInfoAPISpecs.Schemas.POST.Request.Payload,
  ]);

  const payloadWithEmptyUUIDHistory = { ...validPayload, UUIDHistory: [] };
  testSchemaWithValidObject(
    "payload with empty UUIDHistory",
    OccupationAPISpecs.Schemas.POST.Request.Payload,
    payloadWithEmptyUUIDHistory
  );

  testSchemaWithAdditionalProperties(
    "payload with additional properties",
    OccupationAPISpecs.Schemas.POST.Request.Payload,
    {
      ...validPayload,
      extraProperty: "extra test property (not defined in schema) for testing additionalProperties",
    }
  );

  describe("OccupationAPISpecs.Schemas.POST.Request.Payload fields", () => {
    describe("Test validation of 'originUri'", () => {
      testNonEmptyURIStringField<OccupationAPISpecs.Types.POST.Request.Payload>(
        "originUri",
        OccupationAPISpecs.Constants.ORIGIN_URI_MAX_LENGTH,
        OccupationAPISpecs.Schemas.POST.Request.Payload
      );
    });

    describe("Test validation of 'code'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'code'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/code", "type", "must be string")],
        [
          CaseType.Failure,
          "empty string",
          "",
          constructSchemaError(
            "/code",
            "pattern",
            `must match pattern "${OccupationAPISpecs.Patterns.Str.ESCO_OCCUPATION_CODE}"`
          ),
        ],
        [
          CaseType.Failure,
          "an invalid code",
          "1234",
          constructSchemaError(
            "/code",
            "pattern",
            `must match pattern "${OccupationAPISpecs.Patterns.Str.ESCO_OCCUPATION_CODE}"`
          ),
        ],
        [CaseType.Success, "a valid code", getTestESCOOccupationCode(), undefined],
      ])("%s Validate 'code' when it is %s", (caseType, _description, givenValue, failureMessage) => {
        const givenObject = {
          ...validPayload,
          code: givenValue,
        };

        assertCaseForProperty(
          "code",
          givenObject,
          OccupationAPISpecs.Schemas.POST.Request.Payload,
          caseType,
          failureMessage
        );
      });
    });

    describe("Test validation of 'occupationGroupCode'", () => {
      describe("when occupationType is LocalOccupation (local-group rules)", () => {
        test.each([
          [
            CaseType.Failure,
            "undefined",
            undefined,
            constructSchemaError("", "required", "must have required property 'occupationGroupCode'"),
          ],
          [CaseType.Failure, "null", null, constructSchemaError("/occupationGroupCode", "type", "must be string")],
          [
            CaseType.Failure,
            "empty string",
            "",
            constructSchemaError(
              "/occupationGroupCode",
              "pattern",
              `must match pattern "${OccupationAPISpecs.Patterns.Str.LOCAL_GROUP_CODE}"`
            ),
          ],
          [
            CaseType.Failure,
            "an invalid occupationGroupCode",
            "1234",
            constructSchemaError(
              "/occupationGroupCode",
              "pattern",
              `must match pattern "${OccupationAPISpecs.Patterns.Str.LOCAL_GROUP_CODE}"`
            ),
          ],
          [CaseType.Success, "a valid occupationGroupCode", getTestLocalGroupCode(), undefined],
        ])(
          "%s Validate 'occupationGroupCode' when it is %s (LocalOccupation)",
          (caseType, _description, givenValue, failureMessage) => {
            const givenObject = {
              ...validPayload,
              occupationGroupCode: givenValue,
              occupationType: OccupationEnums.OccupationType.LocalOccupation, // force local branch
            };

            assertCaseForProperty(
              "occupationGroupCode",
              givenObject,
              OccupationAPISpecs.Schemas.POST.Request.Payload,
              caseType,
              failureMessage
            );
          }
        );
      });

      describe("when occupationType is ESCOOccupation (ISCO-group rules)", () => {
        test.each([
          [
            CaseType.Failure,
            "empty string",
            "",
            constructSchemaError(
              "/occupationGroupCode",
              "pattern",
              `must match pattern "${OccupationAPISpecs.Patterns.Str.ISCO_GROUP_CODE}"`
            ),
          ],
          [
            CaseType.Failure,
            "invalid code",
            "abcd",
            constructSchemaError(
              "/occupationGroupCode",
              "pattern",
              `must match pattern "${OccupationAPISpecs.Patterns.Str.ISCO_GROUP_CODE}"`
            ),
          ],
          [CaseType.Success, "valid ISCO code", getTestISCOGroupCode(), undefined],
        ])(
          "%s Validate 'occupationGroupCode' when it is %s (ESCOOccupation)",
          (caseType, _description, givenValue, failureMessage) => {
            const givenObject = {
              ...validPayload,
              occupationGroupCode: givenValue,
              occupationType: OccupationEnums.OccupationType.ESCOOccupation, // ensure ESCO branch
            };

            assertCaseForProperty(
              "occupationGroupCode",
              givenObject,
              OccupationAPISpecs.Schemas.POST.Request.Payload,
              caseType,
              failureMessage
            );
          }
        );
      });
    });

    describe("Test validation of description", () => {
      testStringField<OccupationAPISpecs.Types.POST.Request.Payload>(
        "description",
        OccupationAPISpecs.Constants.DESCRIPTION_MAX_LENGTH,
        OccupationAPISpecs.Schemas.POST.Request.Payload
      );
    });

    describe("Test validation of preferredLabel", () => {
      testNonEmptyStringField<OccupationAPISpecs.Types.POST.Request.Payload>(
        "preferredLabel",
        OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH,
        OccupationAPISpecs.Schemas.POST.Request.Payload
      );
    });

    describe("Test validation of 'altLabels'", () => {
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
          "array of objects",
          [{}, {}],
          [
            constructSchemaError("/altLabels/0", "type", "must be string"),
            constructSchemaError("/altLabels/1", "type", "must be string"),
          ],
        ],
        [
          CaseType.Failure,
          "an array of same strings",
          ["foo", "foo"],
          constructSchemaError(
            "/altLabels",
            "uniqueItems",
            "must NOT have duplicate items (items ## 1 and 0 are identical)"
          ),
        ],
        [
          CaseType.Success,
          "an array of valid strings",
          [
            getTestString(OccupationAPISpecs.Constants.ALT_LABEL_MAX_LENGTH),
            getTestString(OccupationAPISpecs.Constants.ALT_LABEL_MAX_LENGTH - 1),
          ],
          undefined,
        ],
      ])("(%s) Validate 'altLabels' when %s", (caseType, _desc, value, failure) => {
        assertCaseForProperty(
          "altLabels",
          { altLabels: value },
          OccupationAPISpecs.Schemas.POST.Request.Payload,
          caseType,
          failure
        );
      });
    });

    describe("Test validation of 'definition'", () => {
      testStringField<OccupationAPISpecs.Types.POST.Request.Payload>(
        "definition",
        OccupationAPISpecs.Constants.DEFINITION_MAX_LENGTH,
        OccupationAPISpecs.Schemas.POST.Request.Payload
      );
    });

    describe("Test validation of 'regulatedProfessionNote'", () => {
      testStringField<OccupationAPISpecs.Types.POST.Request.Payload>(
        "regulatedProfessionNote",
        OccupationAPISpecs.Constants.REGULATED_PROFESSION_NOTE_MAX_LENGTH,
        OccupationAPISpecs.Schemas.POST.Request.Payload
      );
    });

    describe("Test validation of 'scopeNote'", () => {
      testStringField<OccupationAPISpecs.Types.POST.Request.Payload>(
        "scopeNote",
        OccupationAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH,
        OccupationAPISpecs.Schemas.POST.Request.Payload
      );
    });

    describe("Test validation of 'modelId'", () => {
      testObjectIdField("modelId", OccupationAPISpecs.Schemas.POST.Request.Payload);
    });

    describe("Test validation of 'UUIDHistory'", () => {
      testUUIDArray<OccupationAPISpecs.Types.POST.Request.Payload>(
        "UUIDHistory",
        OccupationAPISpecs.Schemas.POST.Request.Payload,
        [],
        true
      );
    });

    describe("Test validation of occupationType", () => {
      const givenSchema = OccupationAPISpecs.Schemas.POST.Request.Payload;

      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'occupationType'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/occupationType", "type", "must be string")],
        [
          CaseType.Failure,
          "empty string",
          "",
          constructSchemaError("/occupationType", "enum", "must be equal to one of the allowed values"),
        ],
        [
          CaseType.Failure,
          "invalid",
          "invalidType",
          constructSchemaError("/occupationType", "enum", "must be equal to one of the allowed values"),
        ],
        [CaseType.Success, "ESCOOccupation", OccupationEnums.OccupationType.ESCOOccupation, undefined],
        [CaseType.Success, "LocalOccupation", OccupationEnums.OccupationType.LocalOccupation, undefined],
      ])("%s Validate 'occupationType' when it is %s", (caseType, _desc, value, failure) => {
        assertCaseForProperty("occupationType", { occupationType: value }, givenSchema, caseType, failure);
      });
    });

    describe("Test validation of isLocalized", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'isLocalized'"),
        ],
        [CaseType.Success, "true", true, undefined],
        [CaseType.Success, "false", false, undefined],
        [CaseType.Failure, "string", "true", constructSchemaError("/isLocalized", "type", "must be boolean")],
        [CaseType.Failure, "number", 1, constructSchemaError("/isLocalized", "type", "must be boolean")],
      ])("(%s) Validate 'isLocalized' when %s", (caseType, _desc, value, failure) => {
        assertCaseForProperty(
          "isLocalized",
          { isLocalized: value },
          OccupationAPISpecs.Schemas.POST.Request.Payload,
          caseType,
          failure
        );
      });
    });
  });
});
