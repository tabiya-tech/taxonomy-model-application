import Ajv from "ajv";
import addFormats from "ajv-formats";
import ModelInfoAPISpecs from "../../index";
import ModelInfoConstants from "../../constants";
import { getTestString } from "_test_utilities/specialCharacters";
import LanguageAPISpecs from "language";
import {
  testValidSchema,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
} from "_test_utilities/stdSchemaTests";

describe("Test the ModelInfo PATCH Request Schema", () => {
  // GIVEN the ModelInfoAPISpecs.ModelInfo.PATCH.Schemas.Request.Payload schema
  // WHEN the schema is validated
  // THEN expect the schema to be valid
  testValidSchema(
    "ModelInfoAPISpecs.ModelInfo.PATCH.Schemas.Request.Payload",
    ModelInfoAPISpecs.ModelInfo.PATCH.Schemas.Request.Payload
  );
});

describe("Validate JSON against the ModelInfo PATCH Request Schema", () => {
  // GIVEN a valid ModelInfo PATCH Request object
  const givenValidModelInfoPATCHRequest: ModelInfoAPISpecs.ModelInfo.PATCH.Types.Request.Payload = {
    released: true,
    releaseNotes: getTestString(10),
  };

  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "ModelInfoAPISpecs.ModelInfo.PATCH.Schemas.Request.Payload",
    ModelInfoAPISpecs.ModelInfo.PATCH.Schemas.Request.Payload,
    givenValidModelInfoPATCHRequest
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "ModelInfoAPISpecs.ModelInfo.PATCH.Schemas.Request.Payload",
    ModelInfoAPISpecs.ModelInfo.PATCH.Schemas.Request.Payload,
    givenValidModelInfoPATCHRequest
  );

  describe("Validate the ModelInfo PATCH Request fields", () => {
    let ajvInstance: Ajv;

    beforeEach(() => {
      ajvInstance = new Ajv({ validateSchema: true, allErrors: true, strict: true });
      addFormats(ajvInstance);
      ajvInstance.addSchema(
        ModelInfoAPISpecs.ModelInfo.PATCH.Schemas.Request.Payload,
        ModelInfoAPISpecs.ModelInfo.PATCH.Schemas.Request.Payload.$id
      );
    });

    function validate(payload: unknown) {
      const validateFunction = ajvInstance.getSchema(
        ModelInfoAPISpecs.ModelInfo.PATCH.Schemas.Request.Payload.$id as string
      );
      if (typeof validateFunction !== "function") {
        throw new Error("Schema was not found in AJV instance.");
      }
      return validateFunction(payload);
    }

    test("a payload that asks for nothing fails validation", () => {
      expect(validate({})).toBe(false);
    });

    test("a payload that only carries releaseNotes fails validation", () => {
      expect(validate({ releaseNotes: getTestString(10) })).toBe(false);
    });

    test("released: true validates successfully", () => {
      expect(validate({ released: true })).toBe(true);
    });

    test("released: false fails validation", () => {
      expect(validate({ released: false })).toBe(false);
    });

    test("releaseNotes is optional", () => {
      expect(validate({ released: true })).toBe(true);
    });

    test("availableLanguages on its own validates successfully", () => {
      expect(validate({ availableLanguages: [LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.shortCode] })).toBe(true);
    });

    test("availableLanguages together with released validates successfully", () => {
      expect(
        validate({ released: true, availableLanguages: [LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.shortCode] })
      ).toBe(true);
    });

    test("every registered language validates successfully", () => {
      expect(
        validate({ availableLanguages: LanguageAPISpecs.Constants.Languages.map((language) => language.shortCode) })
      ).toBe(true);
    });

    test("an empty availableLanguages fails validation", () => {
      expect(validate({ availableLanguages: [] })).toBe(false);
    });

    test("an availableLanguages with a language that is not registered fails validation", () => {
      expect(validate({ availableLanguages: ["not-a-registered-language"] })).toBe(false);
    });

    test("an availableLanguages with a duplicate language fails validation", () => {
      const givenShortCode = LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.shortCode;
      expect(validate({ availableLanguages: [givenShortCode, givenShortCode] })).toBe(false);
    });

    test("releaseNotes exceeding the max length fails validation", () => {
      expect(
        validate({ released: true, releaseNotes: getTestString(ModelInfoConstants.RELEASE_NOTES_MAX_LENGTH + 1) })
      ).toBe(false);
    });

    test("releaseNotes at the max length validates successfully", () => {
      expect(
        validate({ released: true, releaseNotes: getTestString(ModelInfoConstants.RELEASE_NOTES_MAX_LENGTH) })
      ).toBe(true);
    });
  });
});
