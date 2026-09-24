import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
  testObjectIdField,
  testUUIDArray,
  testNonEmptyURIStringField,
} from "_test_utilities/stdSchemaTests";

import { randomUUID } from "crypto";
import { getTestString } from "../../../../_test_utilities/specialCharacters";
import {
  getTestLocalGroupCode,
  getTestESCOOccupationCode,
  getTestISCOGroupCode,
  getTestLocalOccupationCode,
  getTestESCOLocalOccupationCode,
} from "../../../_test_utilities/testUtils";
import { CaseType, assertCaseForProperty, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import OccupationAPISpecs from "../../index";
import OccupationConstants from "../../_shared/constants";
import { getMockId } from "_test_utilities/mockMongoId";
import LocaleAPISpecs from "locale";
import ModelInfoAPISpecs from "modelInfo";
import OccupationEnums from "../../_shared/enums";
import LanguageAPISpecs from "language";

const givenFallbackDbKeyName = LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.dbKeyName;

// GIVEN a function to test a translatable field of the PUT request schema (an object keyed by language)
function testTranslatedStringField(fieldName: string, maxLength: number) {
  test.each([
    [
      CaseType.Failure,
      "undefined",
      undefined,
      constructSchemaError("", "required", `must have required property '${fieldName}'`),
    ],
    [CaseType.Failure, "null", null, constructSchemaError(`/${fieldName}`, "type", "must be object")],
    [CaseType.Success, "a single language value", { [givenFallbackDbKeyName]: getTestString(maxLength) }, undefined],
    [
      CaseType.Success,
      "a multi language value",
      { [givenFallbackDbKeyName]: getTestString(maxLength), fr: getTestString(maxLength) },
      undefined,
    ],
    [
      CaseType.Failure,
      "a value missing the fallback language",
      { fr: getTestString(maxLength) },
      constructSchemaError(`/${fieldName}`, "required", `must have required property '${givenFallbackDbKeyName}'`),
    ],
    [
      CaseType.Failure,
      "a value translated in a language that is not in the registry",
      { [givenFallbackDbKeyName]: getTestString(maxLength), tlh: "nuqneH" },
      constructSchemaError(`/${fieldName}`, "additionalProperties", "must NOT have additional properties"),
    ],
    [
      CaseType.Failure,
      "a value longer than the maximum length in one language only",
      { [givenFallbackDbKeyName]: getTestString(maxLength), fr: getTestString(maxLength + 1) },
      constructSchemaError(`/${fieldName}/fr`, "maxLength", "must NOT have more than " + maxLength + " characters"),
    ],
  ] as const)(`(%s) Validate '${fieldName}' when it is %s`, (caseType, _description, givenValue, failure) => {
    assertCaseForProperty(
      fieldName,
      { [fieldName]: givenValue },
      OccupationAPISpecs.Occupation.PUT.Schemas.Request.Payload,
      caseType,
      failure
    );
  });
}

describe("OccupationAPISpecs.Occupation.PUT.Schemas.Request.Payload schema", () => {
  testValidSchema(
    "OccupationAPISpecs.Occupation.PUT.Schemas.Request.Payload",
    OccupationAPISpecs.Occupation.PUT.Schemas.Request.Payload
  );
});

describe("Test objects against the OccupationAPISpecs.Occupation.PUT.Schemas.Request.Payload schema", () => {
  const createValidRequestPayload = (occupationType: OccupationEnums.OccupationType) => ({
    code:
      occupationType === OccupationEnums.OccupationType.ESCOOccupation
        ? getTestESCOOccupationCode()
        : getTestLocalOccupationCode(),
    originUri: "https://example.com",
    occupationGroupCode:
      occupationType === OccupationEnums.OccupationType.ESCOOccupation
        ? getTestISCOGroupCode()
        : getTestLocalGroupCode(),
    description: { [givenFallbackDbKeyName]: getTestString(OccupationConstants.DESCRIPTION_MAX_LENGTH) },
    preferredLabel: { [givenFallbackDbKeyName]: getTestString(OccupationConstants.PREFERRED_LABEL_MAX_LENGTH) },
    altLabels: [{ [givenFallbackDbKeyName]: getTestString(OccupationConstants.ALT_LABEL_MAX_LENGTH) }],
    definition: { [givenFallbackDbKeyName]: getTestString(OccupationConstants.DEFINITION_MAX_LENGTH) },
    regulatedProfessionNote: {
      [givenFallbackDbKeyName]: getTestString(OccupationConstants.REGULATED_PROFESSION_NOTE_MAX_LENGTH),
    },
    scopeNote: { [givenFallbackDbKeyName]: getTestString(OccupationConstants.SCOPE_NOTE_MAX_LENGTH) },
    modelId: getMockId(1),
    UUIDHistory: [randomUUID(), randomUUID()],
    occupationType,
    isLocalized: true,
  });

  const validPayload = createValidRequestPayload(OccupationEnums.OccupationType.ESCOOccupation);

  testSchemaWithValidObject("valid payload", OccupationAPISpecs.Occupation.PUT.Schemas.Request.Payload, validPayload, [
    LocaleAPISpecs.Schemas.Payload,
    ModelInfoAPISpecs.Schemas.POST.Request.Payload,
  ]);

  const payloadWithEmptyUUIDHistory = { ...validPayload, UUIDHistory: [] };
  testSchemaWithValidObject(
    "payload with empty UUIDHistory",
    OccupationAPISpecs.Occupation.PUT.Schemas.Request.Payload,
    payloadWithEmptyUUIDHistory
  );

  testSchemaWithAdditionalProperties(
    "payload with additional properties",
    OccupationAPISpecs.Occupation.PUT.Schemas.Request.Payload,
    {
      ...validPayload,
      extraProperty: "extra test property (not defined in schema) for testing additionalProperties",
    }
  );

  describe("OccupationAPISpecs.Occupation.PUT.Schemas.Request.Payload fields", () => {
    describe("Test validation of 'originUri'", () => {
      testNonEmptyURIStringField<OccupationAPISpecs.Occupation.PUT.Types.Request.Payload>(
        "originUri",
        OccupationAPISpecs.Constants.ORIGIN_URI_MAX_LENGTH,
        OccupationAPISpecs.Occupation.PUT.Schemas.Request.Payload
      );
    });

    describe("Test validation of 'code'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          OccupationEnums.OccupationType.ESCOOccupation,
          constructSchemaError("", "required", "must have required property 'code'"),
        ],
        [
          CaseType.Failure,
          "null",
          null,
          OccupationEnums.OccupationType.ESCOOccupation,
          constructSchemaError("/code", "type", "must be string"),
        ],
        [
          CaseType.Failure,
          "empty string",
          "",
          OccupationEnums.OccupationType.ESCOOccupation,
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
          OccupationEnums.OccupationType.ESCOOccupation,
          constructSchemaError(
            "/code",
            "pattern",
            `must match pattern "${OccupationAPISpecs.Patterns.Str.ESCO_OCCUPATION_CODE}"`
          ),
        ],
        [
          CaseType.Failure,
          "a valid code of different type",
          getTestLocalOccupationCode(),
          OccupationEnums.OccupationType.ESCOOccupation,
          constructSchemaError(
            "/code",
            "pattern",
            `must match pattern "${OccupationAPISpecs.Patterns.Str.ESCO_OCCUPATION_CODE}"`
          ),
        ],
        [
          CaseType.Success,
          "a valid code",
          getTestESCOOccupationCode(),
          OccupationEnums.OccupationType.ESCOOccupation,
          undefined,
        ],
        [
          CaseType.Failure,
          "empty string",
          "",
          OccupationEnums.OccupationType.LocalOccupation,
          constructSchemaError(
            "/code",
            "pattern",
            `must match pattern "${OccupationAPISpecs.Patterns.Str.ESCO_LOCAL_OR_LOCAL_OCCUPATION_CODE}"`
          ),
        ],
        [
          CaseType.Failure,
          "an invalid code",
          "1234",
          OccupationEnums.OccupationType.LocalOccupation,
          constructSchemaError(
            "/code",
            "pattern",
            `must match pattern "${OccupationAPISpecs.Patterns.Str.ESCO_LOCAL_OR_LOCAL_OCCUPATION_CODE}"`
          ),
        ],
        [
          CaseType.Failure,
          "a valid code of different type",
          getTestESCOOccupationCode(),
          OccupationEnums.OccupationType.LocalOccupation,
          constructSchemaError(
            "/code",
            "pattern",
            `must match pattern "${OccupationAPISpecs.Patterns.Str.ESCO_LOCAL_OR_LOCAL_OCCUPATION_CODE}"`
          ),
        ],
        [
          CaseType.Success,
          "a valid local occupation code",
          getTestLocalOccupationCode(),
          OccupationEnums.OccupationType.LocalOccupation,
          undefined,
        ],
        [
          CaseType.Success,
          "a valid ESCO local occupation code",
          getTestESCOLocalOccupationCode(),
          OccupationEnums.OccupationType.LocalOccupation,
          undefined,
        ],
      ] as const)(
        "%s Validate 'code' when it is %s with %s occupationType",
        (caseType, _description, givenValue, occupationType, failureMessage) => {
          const givenObject = {
            ...createValidRequestPayload(occupationType),
            code: givenValue,
          };

          assertCaseForProperty(
            "code",
            givenObject,
            OccupationAPISpecs.Occupation.PUT.Schemas.Request.Payload,
            caseType,
            failureMessage
          );
        }
      );
    });

    describe("Test validation of 'occupationGroupCode'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          OccupationEnums.OccupationType.ESCOOccupation,
          constructSchemaError("", "required", "must have required property 'occupationGroupCode'"),
        ],
        [
          CaseType.Failure,
          "null",
          null,
          OccupationEnums.OccupationType.ESCOOccupation,
          constructSchemaError("/occupationGroupCode", "type", "must be string"),
        ],
        [
          CaseType.Failure,
          "empty string",
          "",
          OccupationEnums.OccupationType.ESCOOccupation,
          constructSchemaError(
            "/occupationGroupCode",
            "pattern",
            `must match pattern "${OccupationAPISpecs.Patterns.Str.ISCO_GROUP_CODE}"`
          ),
        ],
        [
          CaseType.Failure,
          "an invalid code",
          "abcd",
          OccupationEnums.OccupationType.ESCOOccupation,
          constructSchemaError(
            "/occupationGroupCode",
            "pattern",
            `must match pattern "${OccupationAPISpecs.Patterns.Str.ISCO_GROUP_CODE}"`
          ),
        ],
        [
          CaseType.Failure,
          "a valid code of different type",
          getTestLocalGroupCode(),
          OccupationEnums.OccupationType.ESCOOccupation,
          constructSchemaError(
            "/occupationGroupCode",
            "pattern",
            `must match pattern "${OccupationAPISpecs.Patterns.Str.ISCO_GROUP_CODE}"`
          ),
        ],
        [
          CaseType.Success,
          "a valid code",
          getTestISCOGroupCode(),
          OccupationEnums.OccupationType.ESCOOccupation,
          undefined,
        ],
        [
          CaseType.Failure,
          "empty string",
          "",
          OccupationEnums.OccupationType.LocalOccupation,
          constructSchemaError(
            "/occupationGroupCode",
            "pattern",
            `must match pattern "${OccupationAPISpecs.Patterns.Str.LOCAL_GROUP_CODE}|${OccupationAPISpecs.Patterns.Str.ISCO_GROUP_CODE}"`
          ),
        ],
        [
          CaseType.Success,
          "a valid ISCO numeric code",
          "1234",
          OccupationEnums.OccupationType.LocalOccupation,
          undefined,
        ],
        [
          CaseType.Success,
          "a valid ISCO group code",
          getTestISCOGroupCode(),
          OccupationEnums.OccupationType.LocalOccupation,
          undefined,
        ],
        [
          CaseType.Success,
          "a valid local group code",
          getTestLocalGroupCode(),
          OccupationEnums.OccupationType.LocalOccupation,
          undefined,
        ],
      ] as const)(
        "%s Validate 'occupationGroupCode' when it is %s with %s occupationType",
        (caseType, _description, givenValue, occupationType, failureMessage) => {
          const givenObject = {
            ...createValidRequestPayload(occupationType),
            occupationGroupCode: givenValue,
          };

          assertCaseForProperty(
            "occupationGroupCode",
            givenObject,
            OccupationAPISpecs.Occupation.PUT.Schemas.Request.Payload,
            caseType,
            failureMessage
          );
        }
      );
    });

    describe("Test validation of description", () => {
      testTranslatedStringField("description", OccupationAPISpecs.Constants.DESCRIPTION_MAX_LENGTH);
    });

    describe("Test validation of preferredLabel", () => {
      testTranslatedStringField("preferredLabel", OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH);
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
          "array of items missing the fallback language",
          [{ fr: "foo" }],
          constructSchemaError("/altLabels/0", "required", `must have required property '${givenFallbackDbKeyName}'`),
        ],
        [
          CaseType.Failure,
          "an array of the same translated value",
          [{ [givenFallbackDbKeyName]: "foo" }, { [givenFallbackDbKeyName]: "foo" }],
          constructSchemaError(
            "/altLabels",
            "uniqueItems",
            "must NOT have duplicate items (items ## 0 and 1 are identical)"
          ),
        ],
        [
          CaseType.Success,
          "an array of single language values",
          [
            { [givenFallbackDbKeyName]: getTestString(OccupationAPISpecs.Constants.ALT_LABEL_MAX_LENGTH) },
            { [givenFallbackDbKeyName]: getTestString(OccupationAPISpecs.Constants.ALT_LABEL_MAX_LENGTH - 1) },
          ],
          undefined,
        ],
        [
          CaseType.Success,
          "an array of multi language values",
          [{ [givenFallbackDbKeyName]: "Chef", fr: "Chef" }],
          undefined,
        ],
        [
          CaseType.Failure,
          "an array with an item translated in a language that is not in the registry",
          [{ [givenFallbackDbKeyName]: "Chef", tlh: "nuqneH" }],
          constructSchemaError("/altLabels/0", "additionalProperties", "must NOT have additional properties"),
        ],
      ])("(%s) Validate 'altLabels' when %s", (caseType, _desc, value, failure) => {
        assertCaseForProperty(
          "altLabels",
          { altLabels: value },
          OccupationAPISpecs.Occupation.PUT.Schemas.Request.Payload,
          caseType,
          failure
        );
      });
    });

    describe("Test validation of 'definition'", () => {
      testTranslatedStringField("definition", OccupationAPISpecs.Constants.DEFINITION_MAX_LENGTH);
    });

    describe("Test validation of 'regulatedProfessionNote'", () => {
      testTranslatedStringField(
        "regulatedProfessionNote",
        OccupationAPISpecs.Constants.REGULATED_PROFESSION_NOTE_MAX_LENGTH
      );
    });

    describe("Test validation of 'scopeNote'", () => {
      testTranslatedStringField("scopeNote", OccupationAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH);
    });

    describe("Test validation of 'modelId'", () => {
      testObjectIdField("modelId", OccupationAPISpecs.Occupation.PUT.Schemas.Request.Payload);
    });

    describe("Test validation of 'UUIDHistory'", () => {
      testUUIDArray<OccupationAPISpecs.Occupation.PUT.Types.Request.Payload>(
        "UUIDHistory",
        OccupationAPISpecs.Occupation.PUT.Schemas.Request.Payload,
        [],
        true,
        true
      );
    });

    describe("Test validation of occupationType", () => {
      const givenSchema = OccupationAPISpecs.Occupation.PUT.Schemas.Request.Payload;

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
          OccupationAPISpecs.Occupation.PUT.Schemas.Request.Payload,
          caseType,
          failure
        );
      });
    });
  });
});
