import Ajv from "ajv";
import addFormats from "ajv-formats";
import { randomUUID } from "crypto";
import ModelInfoAPISpecs from "../../index";
import ModelInfoConstants from "../../constants";
import LocaleAPISpecs from "locale";
import { getTestString } from "_test_utilities/specialCharacters";
import LanguageAPISpecs from "language";
import {
  testValidSchema,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
} from "_test_utilities/stdSchemaTests";
import PATCHModelConstants from "./constants";

// A minimal valid locale object used throughout these tests.
const givenValidLocale = {
  UUID: randomUUID(),
  shortCode: "en",
  name: "English",
};

describe("Test the ModelInfo PATCH Request Schema", () => {
  // GIVEN the ModelInfoAPISpecs.ModelInfo.PATCH.Schemas.Request.Payload schema
  // WHEN the schema is validated (with the locale schema registered as a dependency)
  // THEN expect the schema to be valid
  testValidSchema(
    "ModelInfoAPISpecs.ModelInfo.PATCH.Schemas.Request.Payload",
    ModelInfoAPISpecs.ModelInfo.PATCH.Schemas.Request.Payload,
    [LocaleAPISpecs.Schemas.Payload]
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
    givenValidModelInfoPATCHRequest,
    [LocaleAPISpecs.Schemas.Payload]
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "ModelInfoAPISpecs.ModelInfo.PATCH.Schemas.Request.Payload",
    ModelInfoAPISpecs.ModelInfo.PATCH.Schemas.Request.Payload,
    givenValidModelInfoPATCHRequest,
    [LocaleAPISpecs.Schemas.Payload]
  );

  describe("Validate the ModelInfo PATCH Request fields", () => {
    let ajvInstance: Ajv;

    beforeEach(() => {
      ajvInstance = new Ajv({ validateSchema: true, allErrors: true, strict: true });
      addFormats(ajvInstance);
      // The locale $ref inside the PATCH request schema must be resolvable.
      ajvInstance.addSchema(LocaleAPISpecs.Schemas.Payload, LocaleAPISpecs.Schemas.Payload.$id);
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

    // ─── empty / no-op bodies ───────────────────────────────────────────────────

    test("a payload that asks for nothing fails validation", () => {
      expect(validate({})).toBe(false);
    });

    test("a payload that only carries releaseNotes fails validation", () => {
      expect(validate({ releaseNotes: getTestString(10) })).toBe(false);
    });

    test("a payload with releaseNotes and name but without released fails validation", () => {
      expect(validate({ name: "foo", releaseNotes: getTestString(10) })).toBe(false);
    });

    test("a payload with releaseNotes and availableLanguages but without released fails validation", () => {
      expect(
        validate({
          availableLanguages: [LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.shortCode],
          releaseNotes: getTestString(10),
        })
      ).toBe(false);
    });

    test("a payload with releaseNotes and released: false fails validation", () => {
      expect(validate({ released: false, releaseNotes: getTestString(10) })).toBe(false);
    });

    test("a payload with releaseNotes, released: true, and name validates successfully", () => {
      expect(validate({ name: "foo", released: true, releaseNotes: getTestString(10) })).toBe(true);
    });

    // ─── released ────────────────────────────────────────────────────────────────

    test("released: true validates successfully", () => {
      expect(validate({ released: true })).toBe(true);
    });

    test("released: false fails validation", () => {
      expect(validate({ released: false })).toBe(false);
    });

    test("releaseNotes is optional when released: true", () => {
      expect(validate({ released: true })).toBe(true);
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

    // ─── availableLanguages ──────────────────────────────────────────────────────

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

    // ─── name ────────────────────────────────────────────────────────────────────

    test("name alone with a valid non-empty string validates successfully", () => {
      expect(validate({ name: "My taxonomy" })).toBe(true);
    });

    test("name at the max length validates successfully", () => {
      expect(validate({ name: getTestString(ModelInfoConstants.NAME_MAX_LENGTH) })).toBe(true);
    });

    test("name exceeding the max length fails validation", () => {
      expect(validate({ name: getTestString(ModelInfoConstants.NAME_MAX_LENGTH + 1) })).toBe(false);
    });

    test("name that is an empty string fails validation (NotEmptyString pattern)", () => {
      expect(validate({ name: "" })).toBe(false);
    });

    test("name that is only whitespace fails validation", () => {
      expect(validate({ name: "   " })).toBe(false);
    });

    // ─── description ─────────────────────────────────────────────────────────────

    test("description alone with a valid string validates successfully", () => {
      expect(validate({ description: "A detailed description." })).toBe(true);
    });

    test("description as an empty string validates successfully (description may be empty)", () => {
      // description has no NotEmptyString constraint — it may be blank
      expect(validate({ description: "" })).toBe(true);
    });

    test("description at the max length validates successfully", () => {
      expect(validate({ description: getTestString(ModelInfoConstants.DESCRIPTION_MAX_LENGTH) })).toBe(true);
    });

    test("description exceeding the max length fails validation", () => {
      expect(validate({ description: getTestString(ModelInfoConstants.DESCRIPTION_MAX_LENGTH + 1) })).toBe(false);
    });

    // ─── locale ──────────────────────────────────────────────────────────────────

    test("locale alone with a valid locale object validates successfully", () => {
      expect(validate({ locale: givenValidLocale })).toBe(true);
    });

    test("locale with a missing UUID field fails validation", () => {
      expect(validate({ locale: { shortCode: "en", name: "English" } })).toBe(false);
    });

    test("locale with a missing shortCode field fails validation", () => {
      expect(validate({ locale: { UUID: randomUUID(), name: "English" } })).toBe(false);
    });

    test("locale with a missing name field fails validation", () => {
      expect(validate({ locale: { UUID: randomUUID(), shortCode: "en" } })).toBe(false);
    });

    test("locale with an invalid UUID fails validation", () => {
      expect(validate({ locale: { UUID: "not-a-uuid", shortCode: "en", name: "English" } })).toBe(false);
    });

    test("locale with additional properties fails validation", () => {
      expect(validate({ locale: { ...givenValidLocale, extra: "field" } })).toBe(false);
    });

    // ─── license ─────────────────────────────────────────────────────────────────

    test("license alone with a valid string validates successfully", () => {
      expect(validate({ license: "MIT" })).toBe(true);
    });

    test("license as an empty string validates successfully (license may be empty)", () => {
      expect(validate({ license: "" })).toBe(true);
    });

    test("license at the max length validates successfully", () => {
      expect(validate({ license: getTestString(ModelInfoConstants.LICENSE_MAX_LENGTH) })).toBe(true);
    });

    test("license exceeding the max length fails validation", () => {
      expect(validate({ license: getTestString(ModelInfoConstants.LICENSE_MAX_LENGTH + 1) })).toBe(false);
    });

    // ─── UUIDHistory ─────────────────────────────────────────────────────────────

    test("UUIDHistory alone with one valid UUID validates successfully", () => {
      expect(validate({ UUIDHistory: [randomUUID()] })).toBe(true);
    });

    test("UUIDHistory with multiple valid UUIDs validates successfully", () => {
      expect(validate({ UUIDHistory: [randomUUID(), randomUUID(), randomUUID()] })).toBe(true);
    });

    test("UUIDHistory as an empty array fails validation (minItems: 1)", () => {
      expect(validate({ UUIDHistory: [] })).toBe(false);
    });

    test("UUIDHistory with a non-UUID string fails validation", () => {
      expect(validate({ UUIDHistory: ["not-a-uuid"] })).toBe(false);
    });

    test("UUIDHistory with duplicate UUIDs fails validation (uniqueItems)", () => {
      const givenUUID = randomUUID();
      expect(validate({ UUIDHistory: [givenUUID, givenUUID] })).toBe(false);
    });

    test("UUIDHistory with 10,000 unique UUIDs validates successfully (at maxItems)", () => {
      const uuids = Array.from({ length: 10_000 }, () => randomUUID());
      expect(validate({ UUIDHistory: uuids })).toBe(true);
    });

    test("UUIDHistory with 10,001 items fails validation (exceeds maxItems)", () => {
      const uuids = Array.from({ length: 10_001 }, () => randomUUID());
      expect(validate({ UUIDHistory: uuids })).toBe(false);
    });

    // ─── Combinations ────────────────────────────────────────────────────────────

    test("name and description together validate successfully", () => {
      expect(validate({ name: "My taxonomy", description: "A description" })).toBe(true);
    });

    test("name, released:true, and availableLanguages together validate successfully", () => {
      expect(
        validate({
          name: "My taxonomy",
          released: true,
          availableLanguages: [LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.shortCode],
        })
      ).toBe(true);
    });

    test("all supported fields together validate successfully", () => {
      expect(
        validate({
          name: "My taxonomy",
          description: "A description",
          locale: givenValidLocale,
          license: "MIT",
          UUIDHistory: [randomUUID()],
          availableLanguages: [LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.shortCode],
          released: true,
          releaseNotes: "Initial release",
        })
      ).toBe(true);
    });

    test("an unknown property fails validation (additionalProperties: false)", () => {
      expect(validate({ released: true, foo: "bar" })).toBe(false);
    });

    // ─── Payload size ────────────────────────────────────────────────────────────

    test("the maximum valid serialized payload fits within MAX_PATCH_PAYLOAD_LENGTH", () => {
      // Build the absolute largest valid payload: every field at its max size.
      const maxPayload = {
        name: getTestString(ModelInfoConstants.NAME_MAX_LENGTH),
        description: getTestString(ModelInfoConstants.DESCRIPTION_MAX_LENGTH),
        license: getTestString(ModelInfoConstants.LICENSE_MAX_LENGTH),
        releaseNotes: getTestString(ModelInfoConstants.RELEASE_NOTES_MAX_LENGTH),
        locale: givenValidLocale,
        UUIDHistory: Array.from({ length: 10_000 }, () => randomUUID()),
        availableLanguages: LanguageAPISpecs.Constants.Languages.map((l) => l.shortCode),
        released: true as const,
      };
      // Validate it passes schema first
      expect(validate(maxPayload)).toBe(true);
      // Then verify its serialized size is within the declared limit
      expect(JSON.stringify(maxPayload).length).toBeLessThanOrEqual(
        PATCHModelConstants.MAX_PATCH_PAYLOAD_LENGTH
      );
    });
  });
});
