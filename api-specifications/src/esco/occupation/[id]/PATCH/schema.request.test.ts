import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
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
import OccupationEnums from "../../_shared/enums";
import { RegExp_Str_ID } from "../../../../regex";
import LanguageAPISpecs from "language";

const givenFallbackDbKeyName = LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.dbKeyName;

// GIVEN a function to test a translatable field of the PATCH request schema (merge semantics: the field
// itself is optional, each present language is optional except the fallback, which can never be null)
function testPatchTranslatedStringField(fieldName: string, maxLength: number) {
  test.each([
    [CaseType.Success, "the field entirely absent", undefined, undefined],
    [CaseType.Failure, "null", null, constructSchemaError(`/${fieldName}`, "type", "must be object")],
    [CaseType.Success, "a single language value", { [givenFallbackDbKeyName]: getTestString(maxLength) }, undefined],
    [
      CaseType.Success,
      "a multi language value",
      { [givenFallbackDbKeyName]: getTestString(maxLength), fr: getTestString(maxLength) },
      undefined,
    ],
    [
      CaseType.Success,
      "only a non-fallback language, fallback omitted (merge leaves the fallback untouched)",
      { fr: getTestString(maxLength) },
      undefined,
    ],
    [
      CaseType.Success,
      "a non-fallback language explicitly set to null (deletes that language)",
      { fr: null },
      undefined,
    ],
    [
      CaseType.Failure,
      "the fallback language explicitly set to null",
      { [givenFallbackDbKeyName]: null },
      constructSchemaError(`/${fieldName}/${givenFallbackDbKeyName}`, "type", "must be string"),
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
      OccupationAPISpecs.Occupation.PATCH.Schemas.Request.Payload,
      caseType,
      failure
    );
  });
}

describe("OccupationAPISpecs.Occupation.PATCH.Schemas.Request.Payload schema", () => {
  testValidSchema(
    "OccupationAPISpecs.Occupation.PATCH.Schemas.Request.Payload",
    OccupationAPISpecs.Occupation.PATCH.Schemas.Request.Payload
  );
});

describe("Test objects against the OccupationAPISpecs.Occupation.PATCH.Schemas.Request.Payload schema", () => {
  testSchemaWithValidObject(
    "empty payload (all fields optional)",
    OccupationAPISpecs.Occupation.PATCH.Schemas.Request.Payload,
    {}
  );

  testSchemaWithValidObject("single field payload", OccupationAPISpecs.Occupation.PATCH.Schemas.Request.Payload, {
    preferredLabel: { [givenFallbackDbKeyName]: "updated label" },
  });

  testSchemaWithValidObject("multi language payload", OccupationAPISpecs.Occupation.PATCH.Schemas.Request.Payload, {
    preferredLabel: { [givenFallbackDbKeyName]: "Cook", fr: "Cuisinier" },
    description: { fr: "Une description" },
  });

  testSchemaWithValidObject(
    "payload deleting a non fallback language via null",
    OccupationAPISpecs.Occupation.PATCH.Schemas.Request.Payload,
    {
      preferredLabel: { fr: null },
    }
  );

  testSchemaWithAdditionalProperties(
    "payload with additional properties",
    OccupationAPISpecs.Occupation.PATCH.Schemas.Request.Payload,
    {
      extraProperty: "extra test property (not defined in schema) for testing additionalProperties",
    }
  );

  describe("OccupationAPISpecs.Occupation.PATCH.Schemas.Request.Payload fields", () => {
    describe("Test validation of 'code' when occupationType is provided", () => {
      test.each([
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
          assertCaseForProperty(
            "code",
            { code: givenValue, occupationType },
            OccupationAPISpecs.Occupation.PATCH.Schemas.Request.Payload,
            caseType,
            failureMessage
          );
        }
      );
    });

    describe("Test validation of 'occupationGroupCode' when occupationType is provided", () => {
      test.each([
        [
          CaseType.Failure,
          "null",
          null,
          OccupationEnums.OccupationType.ESCOOccupation,
          constructSchemaError("/occupationGroupCode", "type", "must be string"),
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
          CaseType.Success,
          "a valid code",
          getTestLocalGroupCode(),
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
      ] as const)(
        "%s Validate 'occupationGroupCode' when it is %s with %s occupationType",
        (caseType, _description, givenValue, occupationType, failureMessage) => {
          assertCaseForProperty(
            "occupationGroupCode",
            { occupationGroupCode: givenValue, occupationType },
            OccupationAPISpecs.Occupation.PATCH.Schemas.Request.Payload,
            caseType,
            failureMessage
          );
        }
      );
    });

    describe("Test validation of description", () => {
      testPatchTranslatedStringField("description", OccupationConstants.DESCRIPTION_MAX_LENGTH);
    });

    describe("Test validation of preferredLabel", () => {
      testPatchTranslatedStringField("preferredLabel", OccupationConstants.PREFERRED_LABEL_MAX_LENGTH);
    });

    describe("Test validation of 'altLabels'", () => {
      test.each([
        [CaseType.Success, "undefined", undefined, undefined],
        [CaseType.Failure, "null", null, constructSchemaError("/altLabels", "type", "must be array")],
        [CaseType.Failure, "empty string", "", constructSchemaError("/altLabels", "type", "must be array")],
        [
          CaseType.Failure,
          "array of items missing the fallback language",
          [{ fr: "foo" }],
          constructSchemaError("/altLabels/0", "required", `must have required property '${givenFallbackDbKeyName}'`),
        ],
        [
          CaseType.Success,
          "an array of single language values",
          [
            { [givenFallbackDbKeyName]: getTestString(OccupationConstants.ALT_LABEL_MAX_LENGTH) },
            { [givenFallbackDbKeyName]: getTestString(OccupationConstants.ALT_LABEL_MAX_LENGTH - 1) },
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
          OccupationAPISpecs.Occupation.PATCH.Schemas.Request.Payload,
          caseType,
          failure
        );
      });
    });

    describe("Test validation of 'definition'", () => {
      testPatchTranslatedStringField("definition", OccupationConstants.DEFINITION_MAX_LENGTH);
    });

    describe("Test validation of 'originUri'", () => {
      test.each([
        [CaseType.Success, "undefined", undefined, undefined],
        [CaseType.Failure, "null", null, constructSchemaError("/originUri", "type", "must be string")],
        [
          CaseType.Failure,
          "empty string",
          "",
          constructSchemaError("/originUri", "pattern", `must match pattern "\\S"`),
        ],
        [
          CaseType.Failure,
          "invalid format",
          "not-a-uri",
          constructSchemaError("/originUri", "format", 'must match format "uri"'),
        ],
        [CaseType.Success, "a valid URI", "https://example.com", undefined],
      ])("(%s) Validate 'originUri' when it is %s", (caseType, _desc, value, failure) => {
        assertCaseForProperty(
          "originUri",
          { originUri: value },
          OccupationAPISpecs.Occupation.PATCH.Schemas.Request.Payload,
          caseType,
          failure
        );
      });
    });

    describe("Test validation of 'modelId'", () => {
      test.each([
        [CaseType.Success, "undefined", undefined, undefined],
        [CaseType.Failure, "null", null, constructSchemaError("/modelId", "type", "must be string")],
        [
          CaseType.Failure,
          "invalid ObjectId",
          "not-a-valid-id",
          constructSchemaError("/modelId", "pattern", `must match pattern "${RegExp_Str_ID}"`),
        ],
        [CaseType.Success, "a valid ObjectId", getMockId(1), undefined],
      ])("(%s) Validate 'modelId' when it is %s", (caseType, _desc, value, failure) => {
        assertCaseForProperty(
          "modelId",
          { modelId: value },
          OccupationAPISpecs.Occupation.PATCH.Schemas.Request.Payload,
          caseType,
          failure
        );
      });
    });

    describe("Test validation of 'UUIDHistory'", () => {
      test.each([
        [CaseType.Success, "undefined", undefined, undefined],
        [CaseType.Failure, "null", null, constructSchemaError("/UUIDHistory", "type", "must be array")],
        [CaseType.Failure, "empty string", "", constructSchemaError("/UUIDHistory", "type", "must be array")],
        [CaseType.Success, "empty array", [], undefined],
      ])("(%s) Validate 'UUIDHistory' when it is %s", (caseType, _desc, value, failure) => {
        assertCaseForProperty(
          "UUIDHistory",
          { UUIDHistory: value },
          OccupationAPISpecs.Occupation.PATCH.Schemas.Request.Payload,
          caseType,
          failure
        );
      });
    });

    describe("Test validation of 'regulatedProfessionNote'", () => {
      testPatchTranslatedStringField(
        "regulatedProfessionNote",
        OccupationConstants.REGULATED_PROFESSION_NOTE_MAX_LENGTH
      );
    });

    describe("Test validation of 'scopeNote'", () => {
      testPatchTranslatedStringField("scopeNote", OccupationConstants.SCOPE_NOTE_MAX_LENGTH);
    });

    describe("Test validation of 'isLocalized'", () => {
      test.each([
        [CaseType.Success, "undefined", undefined, undefined],
        [CaseType.Success, "true", true, undefined],
        [CaseType.Success, "false", false, undefined],
        [CaseType.Failure, "string", "true", constructSchemaError("/isLocalized", "type", "must be boolean")],
        [CaseType.Failure, "number", 1, constructSchemaError("/isLocalized", "type", "must be boolean")],
      ])("(%s) Validate 'isLocalized' when %s", (caseType, _desc, value, failure) => {
        assertCaseForProperty(
          "isLocalized",
          { isLocalized: value },
          OccupationAPISpecs.Occupation.PATCH.Schemas.Request.Payload,
          caseType,
          failure
        );
      });
    });

    describe("Test validation of occupationType", () => {
      test.each([
        [CaseType.Success, "undefined", undefined, undefined],
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
        assertCaseForProperty(
          "occupationType",
          { occupationType: value },
          OccupationAPISpecs.Occupation.PATCH.Schemas.Request.Payload,
          caseType,
          failure
        );
      });
    });
  });
});
