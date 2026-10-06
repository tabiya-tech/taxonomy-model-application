import LanguageAPISpecs from "api-specifications/language";
import {
  decodeSearchCursor,
  encodeSearchCursor,
  parseSearchCursor,
  SearchCursorLanguageMismatchError,
} from "./searchCursor";

const FALLBACK_DB_KEY_NAME = LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.dbKeyName;

describe("search cursor", () => {
  describe("encodeSearchCursor / decodeSearchCursor round-trip", () => {
    test.each([
      [0, "en"],
      [5, "fr"],
      [100, "de"],
      [1_000_000, "en"],
    ])("should round-trip offset %s and language '%s'", (givenOffset, givenLanguage) => {
      // WHEN the offset and language are encoded and then decoded
      const actual = decodeSearchCursor(encodeSearchCursor(givenOffset, givenLanguage), givenLanguage);

      // THEN expect the original offset back
      expect(actual).toBe(givenOffset);
    });

    test("should produce an opaque (base64) cursor string containing both offset and language", () => {
      // GIVEN an offset and language
      const givenOffset = 10;
      const givenLanguage = "fr";

      // WHEN the cursor is encoded
      const actual = encodeSearchCursor(givenOffset, givenLanguage);

      // THEN expect a base64 string that decodes to a payload with both fields
      expect(typeof actual).toBe("string");
      expect(JSON.parse(Buffer.from(actual, "base64").toString("utf-8"))).toEqual({
        offset: givenOffset,
        language: givenLanguage,
      });
    });
  });

  describe("decodeSearchCursor language mismatch", () => {
    test("should throw SearchCursorLanguageMismatchError when the cursor language differs from the requested language", () => {
      // GIVEN a cursor issued for French
      const givenCursor = encodeSearchCursor(5, "fr");

      // WHEN decoding it with English as the requested language
      // THEN expect a language mismatch error
      expect(() => decodeSearchCursor(givenCursor, "en")).toThrow(SearchCursorLanguageMismatchError);
    });

    test("should include the cursor and requested languages in the mismatch error message", () => {
      // GIVEN a cursor issued for French
      const givenCursor = encodeSearchCursor(5, "fr");

      // WHEN decoding it with English as the requested language
      let actualError: Error | undefined;
      try {
        decodeSearchCursor(givenCursor, "en");
      } catch (e) {
        actualError = e as Error;
      }

      // THEN expect the error message to name both languages
      expect(actualError?.message).toContain("fr");
      expect(actualError?.message).toContain("en");
    });
  });

  describe("parseSearchCursor (structural validation only)", () => {
    test("should parse a well-formed cursor without checking language", () => {
      // GIVEN a cursor issued for French
      const givenCursor = encodeSearchCursor(7, "fr");

      // WHEN parsing it (no language to match)
      const actual = parseSearchCursor(givenCursor);

      // THEN expect the offset and language to be returned as-is
      expect(actual).toEqual({ offset: 7, language: "fr" });
    });

    test.each([
      ["malformed base64/JSON", "not-base64-json-!@#$%"],
      ["a negative offset", Buffer.from(JSON.stringify({ offset: -1, language: "en" })).toString("base64")],
      ["a non-integer offset", Buffer.from(JSON.stringify({ offset: 1.5, language: "en" })).toString("base64")],
      ["a non-numeric offset", Buffer.from(JSON.stringify({ offset: "x", language: "en" })).toString("base64")],
      ["a missing offset", Buffer.from(JSON.stringify({ language: "en" })).toString("base64")],
      ["an empty language", Buffer.from(JSON.stringify({ offset: 0, language: "" })).toString("base64")],
    ])("should throw when the cursor holds %s", (_description, givenCursor) => {
      // WHEN parsing an invalid cursor THEN expect it to throw
      expect(() => parseSearchCursor(givenCursor)).toThrow();
    });

    test("should fall back to the fallback language for a cursor with no language field (backward compat)", () => {
      // GIVEN a pre-migration cursor that has no language field
      const givenLegacyCursor = Buffer.from(JSON.stringify({ offset: 3 })).toString("base64");

      // WHEN parsing it
      const actual = parseSearchCursor(givenLegacyCursor);

      // THEN expect it to succeed, with language set to the fallback
      expect(actual.offset).toBe(3);
      expect(actual.language).toBe(FALLBACK_DB_KEY_NAME);
    });
  });

  describe("decodeSearchCursor structural validation", () => {
    test.each([
      ["malformed base64/JSON", "not-base64-json-!@#$%"],
      ["a negative offset", Buffer.from(JSON.stringify({ offset: -1, language: "en" })).toString("base64")],
      ["a non-integer offset", Buffer.from(JSON.stringify({ offset: 1.5, language: "en" })).toString("base64")],
      ["a non-numeric offset", Buffer.from(JSON.stringify({ offset: "x", language: "en" })).toString("base64")],
      ["a missing offset", Buffer.from(JSON.stringify({ language: "en" })).toString("base64")],
    ])("should throw when the cursor holds %s", (_description, givenCursor) => {
      // WHEN decoding an invalid cursor THEN expect it to throw
      expect(() => decodeSearchCursor(givenCursor, "en")).toThrow();
    });
  });
});
