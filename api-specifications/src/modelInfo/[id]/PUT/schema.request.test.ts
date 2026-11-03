import ModelInfoAPISpecs from "../../index";
import ModelInfoConstants from "../../constants";
import LocaleAPISpecs from "locale";
import LanguageAPISpecs from "language";
import { getTestString } from "_test_utilities/specialCharacters";
import { randomUUID } from "crypto";
import {
  testNonEmptyStringField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testStringField,
  testUUIDArray,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";

const givenValidModelInfoPUTRequest: ModelInfoAPISpecs.ModelInfo.PUT.Types.Request.Payload = {
  name: getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
  description: getTestString(ModelInfoAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
  license: getTestString(ModelInfoAPISpecs.Constants.LICENSE_MAX_LENGTH),
  UUIDHistory: [randomUUID()],
  locale: {
    name: getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
    UUID: randomUUID(),
    shortCode: getTestString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
  },
  availableLanguages: [LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.shortCode],
};

describe("Test the ModelInfo PUT Request Schema", () => {
  testValidSchema(
    "ModelInfoAPISpecs.ModelInfo.PUT.Schemas.Request.Payload",
    ModelInfoAPISpecs.ModelInfo.PUT.Schemas.Request.Payload,
    [LocaleAPISpecs.Schemas.Payload]
  );
});

describe("Validate JSON against the ModelInfo PUT Request Schema", () => {
  testSchemaWithValidObject(
    "ModelInfoAPISpecs.ModelInfo.PUT.Schemas.Request.Payload",
    ModelInfoAPISpecs.ModelInfo.PUT.Schemas.Request.Payload,
    givenValidModelInfoPUTRequest,
    [LocaleAPISpecs.Schemas.Payload]
  );

  testSchemaWithAdditionalProperties(
    "ModelInfoAPISpecs.ModelInfo.PUT.Schemas.Request.Payload",
    ModelInfoAPISpecs.ModelInfo.PUT.Schemas.Request.Payload,
    givenValidModelInfoPUTRequest,
    [LocaleAPISpecs.Schemas.Payload]
  );

  describe("Validate the ModelInfo PUT Request fields", () => {
    describe("Test validation of 'name'", () => {
      testNonEmptyStringField<ModelInfoAPISpecs.ModelInfo.PUT.Types.Request.Payload>(
        "name",
        ModelInfoConstants.NAME_MAX_LENGTH,
        ModelInfoAPISpecs.ModelInfo.PUT.Schemas.Request.Payload,
        [LocaleAPISpecs.Schemas.Payload]
      );
    });

    describe("Test validation of 'description'", () => {
      testStringField<ModelInfoAPISpecs.ModelInfo.PUT.Types.Request.Payload>(
        "description",
        ModelInfoConstants.DESCRIPTION_MAX_LENGTH,
        ModelInfoAPISpecs.ModelInfo.PUT.Schemas.Request.Payload,
        [LocaleAPISpecs.Schemas.Payload]
      );
    });

    describe("Test validation of 'license'", () => {
      testStringField<ModelInfoAPISpecs.ModelInfo.PUT.Types.Request.Payload>(
        "license",
        ModelInfoConstants.LICENSE_MAX_LENGTH,
        ModelInfoAPISpecs.ModelInfo.PUT.Schemas.Request.Payload,
        [LocaleAPISpecs.Schemas.Payload]
      );
    });

    describe("Test validation of 'availableLanguages'", () => {
      test.each([
        [
          CaseType.Failure,
          "omitted",
          undefined,
          constructSchemaError("", "required", "must have required property 'availableLanguages'"),
        ],
        [
          CaseType.Success,
          "an array with a single registered language",
          [LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.shortCode],
          undefined,
        ],
        [
          CaseType.Success,
          "every registered language",
          LanguageAPISpecs.Constants.Languages.map((language) => language.shortCode),
          undefined,
        ],
        [
          CaseType.Failure,
          "an empty array",
          [],
          constructSchemaError("/availableLanguages", "minItems", "must NOT have fewer than 1 items"),
        ],
        [
          CaseType.Failure,
          "an array with a language that is not registered",
          ["not-a-registered-language"],
          constructSchemaError("/availableLanguages/0", "enum", "must be equal to one of the allowed values"),
        ],
        [
          CaseType.Failure,
          "an array with a duplicate language",
          [
            LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.shortCode,
            LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.shortCode,
          ],
          constructSchemaError(
            "/availableLanguages",
            "uniqueItems",
            "must NOT have duplicate items (items ## 1 and 0 are identical)"
          ),
        ],
      ])("(%s) Validate 'availableLanguages' when it is %s", (caseType, _description, givenValue, failureMessages) => {
        const givenObject = {
          ...givenValidModelInfoPUTRequest,
          availableLanguages: givenValue,
        };
        assertCaseForProperty(
          "availableLanguages",
          givenObject,
          ModelInfoAPISpecs.ModelInfo.PUT.Schemas.Request.Payload,
          caseType,
          failureMessages,
          [LocaleAPISpecs.Schemas.Payload]
        );
      });
    });

    describe("Test validation of 'UUIDHistory'", () => {
      testUUIDArray<ModelInfoAPISpecs.ModelInfo.PUT.Types.Request.Payload>(
        "UUIDHistory",
        ModelInfoAPISpecs.ModelInfo.PUT.Schemas.Request.Payload,
        [LocaleAPISpecs.Schemas.Payload],
        false,
        true
      );
    });
  });
});
