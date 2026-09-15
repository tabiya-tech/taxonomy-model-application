import LanguageAPISpecs from "api-specifications/language";
import { setConfiguration } from "server/config/config";
import { getAcceptLanguageHeader, resolveLanguage, resolveLanguageConfig } from "./resolveLanguage";

const FALL_BACK_SHORT_CODE = LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.shortCode;

describe("Test resolveLanguage()", () => {
  beforeEach(() => {
    // the environment is not configured, the fall back language is the one of the registry
    // @ts-ignore
    setConfiguration(undefined);
  });

  describe("Test the resolution of the language the client asks for", () => {
    test("should return the language the client asks for when the model has it", () => {
      // GIVEN a client that asks for french
      const givenAcceptLanguageHeader = "fr";
      // AND a model that has english and french
      const givenAvailableLanguages = ["en", "fr"];

      // WHEN the language is resolved
      const actualLanguage = resolveLanguage(givenAcceptLanguageHeader, givenAvailableLanguages);

      // THEN expect french to be served
      expect(actualLanguage).toBe("fr");
    });

    test("should return the language of the highest quality the model has", () => {
      // GIVEN a client that prefers french over english
      const givenAcceptLanguageHeader = "fr;q=0.9, en;q=0.8";
      // AND a model that has english and french
      const givenAvailableLanguages = ["en", "fr"];

      // WHEN the language is resolved
      const actualLanguage = resolveLanguage(givenAcceptLanguageHeader, givenAvailableLanguages);

      // THEN expect french to be served
      expect(actualLanguage).toBe("fr");
    });

    test("should return the language of the highest quality even when it is not the first of the header", () => {
      // GIVEN a client that lists english first but prefers french
      const givenAcceptLanguageHeader = "en;q=0.2, fr;q=0.9";
      // AND a model that has english and french
      const givenAvailableLanguages = ["en", "fr"];

      // WHEN the language is resolved
      const actualLanguage = resolveLanguage(givenAcceptLanguageHeader, givenAvailableLanguages);

      // THEN expect french to be served
      expect(actualLanguage).toBe("fr");
    });

    test("should keep the order of the header for the languages of equal quality", () => {
      // GIVEN a client that asks for spanish and french with the same quality
      const givenAcceptLanguageHeader = "es;q=0.5, fr;q=0.5";
      // AND a model that has french and spanish
      const givenAvailableLanguages = ["fr", "es"];

      // WHEN the language is resolved
      const actualLanguage = resolveLanguage(givenAcceptLanguageHeader, givenAvailableLanguages);

      // THEN expect spanish, the first of the header, to be served
      expect(actualLanguage).toBe("es");
    });

    test("should return the next language the client accepts when the model does not have the preferred one", () => {
      // GIVEN a client that prefers spanish over french
      const givenAcceptLanguageHeader = "es, fr;q=0.5";
      // AND a model that has english and french only
      const givenAvailableLanguages = ["en", "fr"];

      // WHEN the language is resolved
      const actualLanguage = resolveLanguage(givenAcceptLanguageHeader, givenAvailableLanguages);

      // THEN expect french to be served
      expect(actualLanguage).toBe("fr");
    });

    test("should match a regional language tag to the language of the registry", () => {
      // GIVEN a client that asks for swiss french
      const givenAcceptLanguageHeader = "fr-CH";
      // AND a model that has english and french
      const givenAvailableLanguages = ["en", "fr"];

      // WHEN the language is resolved
      const actualLanguage = resolveLanguage(givenAcceptLanguageHeader, givenAvailableLanguages);

      // THEN expect french to be served
      expect(actualLanguage).toBe("fr");
    });

    test("should ignore the case and the whitespace of the language tags of the header", () => {
      // GIVEN a client that asks for french in a sloppy spelling
      const givenAcceptLanguageHeader = "  FR ; q=0.9 ";
      // AND a model that has english and french
      const givenAvailableLanguages = ["en", "fr"];

      // WHEN the language is resolved
      const actualLanguage = resolveLanguage(givenAcceptLanguageHeader, givenAvailableLanguages);

      // THEN expect french to be served
      expect(actualLanguage).toBe("fr");
    });

    test("should ignore the parameters of a language tag other than the quality", () => {
      // GIVEN a client that sends a language tag with an unknown parameter
      const givenAcceptLanguageHeader = "fr;foo=bar";
      // AND a model that has english and french
      const givenAvailableLanguages = ["en", "fr"];

      // WHEN the language is resolved
      const actualLanguage = resolveLanguage(givenAcceptLanguageHeader, givenAvailableLanguages);

      // THEN expect french to be served
      expect(actualLanguage).toBe("fr");
    });
  });

  describe("Test the resolution of a client that accepts any language", () => {
    test("should return the fall back language when the client accepts any language and the model has it", () => {
      // GIVEN a client that accepts any language
      const givenAcceptLanguageHeader = "*";
      // AND a model that has french and english
      const givenAvailableLanguages = ["fr", "en"];

      // WHEN the language is resolved
      const actualLanguage = resolveLanguage(givenAcceptLanguageHeader, givenAvailableLanguages);

      // THEN expect the fall back language to be served
      expect(actualLanguage).toBe(FALL_BACK_SHORT_CODE);
    });

    test("should return the first language of the model when the client accepts any language and the model does not have the fall back language", () => {
      // GIVEN a client that accepts any language
      const givenAcceptLanguageHeader = "*";
      // AND a model that has french and spanish only
      const givenAvailableLanguages = ["fr", "es"];

      // WHEN the language is resolved
      const actualLanguage = resolveLanguage(givenAcceptLanguageHeader, givenAvailableLanguages);

      // THEN expect the first language of the model to be served
      expect(actualLanguage).toBe("fr");
    });

    test("should prefer a language the client asks for explicitly over the wildcard of a lower quality", () => {
      // GIVEN a client that asks for spanish and accepts any language with a lower quality
      const givenAcceptLanguageHeader = "es;q=0.9, *;q=0.1";
      // AND a model that has english and spanish
      const givenAvailableLanguages = ["en", "es"];

      // WHEN the language is resolved
      const actualLanguage = resolveLanguage(givenAcceptLanguageHeader, givenAvailableLanguages);

      // THEN expect spanish to be served
      expect(actualLanguage).toBe("es");
    });
  });

  describe("Test the fall back to the fall back language", () => {
    test.each([
      ["the header is missing", undefined],
      ["the header is null", null],
      ["the header is empty", ""],
      ["the header is blank", "   "],
      ["the header carries empty language tags only", ",,"],
    ])("should return the fall back language when %s", (_description, givenAcceptLanguageHeader) => {
      // GIVEN a model that has english and french
      const givenAvailableLanguages = ["en", "fr"];

      // WHEN the language is resolved
      const actualLanguage = resolveLanguage(givenAcceptLanguageHeader, givenAvailableLanguages);

      // THEN expect the fall back language to be served
      expect(actualLanguage).toBe(FALL_BACK_SHORT_CODE);
    });

    test("should return the fall back language when the client asks for a language tag that is not in the registry", () => {
      // GIVEN a client that asks for a language the platform does not know about
      const givenAcceptLanguageHeader = "tlh";
      // AND a model that has english and french
      const givenAvailableLanguages = ["en", "fr"];

      // WHEN the language is resolved
      const actualLanguage = resolveLanguage(givenAcceptLanguageHeader, givenAvailableLanguages);

      // THEN expect the fall back language to be served
      expect(actualLanguage).toBe(FALL_BACK_SHORT_CODE);
    });

    test("should return the fall back language when the client asks for a language the model does not have", () => {
      // GIVEN a client that asks for spanish
      const givenAcceptLanguageHeader = "es";
      // AND a model that has english and french only
      const givenAvailableLanguages = ["en", "fr"];

      // WHEN the language is resolved
      const actualLanguage = resolveLanguage(givenAcceptLanguageHeader, givenAvailableLanguages);

      // THEN expect the fall back language to be served
      expect(actualLanguage).toBe(FALL_BACK_SHORT_CODE);
    });

    test.each([
      ["the quality is not a number", "fr;q=foo, es"],
      ["the quality is greater than one", "fr;q=2, es"],
      ["the quality is negative", "fr;q=-1, es"],
      ["the quality is empty", "fr;q=, es"],
      ["the language is not acceptable", "fr;q=0, es"],
    ])("should skip a language tag when %s", (_description, givenAcceptLanguageHeader) => {
      // GIVEN a model that has french and spanish
      const givenAvailableLanguages = ["fr", "es"];

      // WHEN the language is resolved
      const actualLanguage = resolveLanguage(givenAcceptLanguageHeader, givenAvailableLanguages);

      // THEN expect spanish, the language of the tag that is not malformed, to be served
      expect(actualLanguage).toBe("es");
    });

    test.each([
      ["the model has no language", []],
      ["the languages of the model are missing", undefined],
      ["the languages of the model are null", null],
      ["the languages of the model are not a list", "fr"],
      ["the model has languages that are not in the registry", ["tlh"]],
      ["the languages of the model are not strings", [1, null]],
    ])("should return the fall back language when %s", (_description, givenAvailableLanguages) => {
      // GIVEN a client that asks for french
      const givenAcceptLanguageHeader = "fr";

      // WHEN the language is resolved
      // @ts-ignore
      const actualLanguage = resolveLanguage(givenAcceptLanguageHeader, givenAvailableLanguages);

      // THEN expect the fall back language to be served
      expect(actualLanguage).toBe(FALL_BACK_SHORT_CODE);
    });

    test("should return the configured fall back language when the client and the model agree on no language", () => {
      // GIVEN the environment falls back to french
      // @ts-ignore
      setConfiguration({ fallbackLanguage: "fr" });
      // AND a client that asks for a language the model does not have
      const givenAcceptLanguageHeader = "es";
      // AND a model that has english and french
      const givenAvailableLanguages = ["en", "fr"];

      // WHEN the language is resolved
      const actualLanguage = resolveLanguage(givenAcceptLanguageHeader, givenAvailableLanguages);

      // THEN expect french, the configured fall back language, to be served
      expect(actualLanguage).toBe("fr");
    });
  });

  describe("Test the languages of the model", () => {
    test("should ignore the case and the whitespace of the languages of the model", () => {
      // GIVEN a client that asks for french
      const givenAcceptLanguageHeader = "fr";
      // AND a model that has french in a sloppy spelling
      const givenAvailableLanguages = [" FR "];

      // WHEN the language is resolved
      const actualLanguage = resolveLanguage(givenAcceptLanguageHeader, givenAvailableLanguages);

      // THEN expect french to be served
      expect(actualLanguage).toBe("fr");
    });

    test("should serve a language the model has more than once only once", () => {
      // GIVEN a client that accepts any language
      const givenAcceptLanguageHeader = "*";
      // AND a model that has french twice and no other language
      const givenAvailableLanguages = ["fr", "fr"];

      // WHEN the language is resolved
      const actualLanguage = resolveLanguage(givenAcceptLanguageHeader, givenAvailableLanguages);

      // THEN expect french to be served
      expect(actualLanguage).toBe("fr");
    });
  });
});

describe("Test resolveLanguageConfig()", () => {
  beforeEach(() => {
    // the environment is not configured, the fall back language is the one of the registry
    // @ts-ignore
    setConfiguration(undefined);
  });

  test("should return the configuration of the language the client asks for", () => {
    // GIVEN a client that asks for french
    const givenAcceptLanguageHeader = "fr";
    // AND a model that has english and french
    const givenAvailableLanguages = ["en", "fr"];
    // AND the configuration of french in the registry
    const expectedLanguage = LanguageAPISpecs.Helpers.getLanguageByShortCode("fr");

    // WHEN the language is resolved
    const actualLanguage = resolveLanguageConfig(givenAcceptLanguageHeader, givenAvailableLanguages);

    // THEN expect the very configuration of the registry to be returned, so that the dbKeyName of the language is
    // available to the caller as well
    expect(actualLanguage).toBe(expectedLanguage);
  });

  test("should return the configuration of the fall back language when the client and the model agree on no language", () => {
    // GIVEN a client that asks for a language the model does not have
    const givenAcceptLanguageHeader = "es";
    // AND a model that has french only
    const givenAvailableLanguages = ["fr"];

    // WHEN the language is resolved
    const actualLanguage = resolveLanguageConfig(givenAcceptLanguageHeader, givenAvailableLanguages);

    // THEN expect the configuration of the fall back language to be returned
    expect(actualLanguage).toBe(LanguageAPISpecs.Constants.FALLBACK_LANGUAGE);
  });
});

describe("Test getAcceptLanguageHeader()", () => {
  test("should return the value of the header when the header name is lower cased, as API Gateway sends it", () => {
    // GIVEN a request that carries a lower cased Accept-Language header
    const givenHeaders = { "accept-language": "fr;q=0.9" };

    // WHEN the header is read
    const actualHeaderValue = getAcceptLanguageHeader(givenHeaders);

    // THEN expect the value of the header to be returned
    expect(actualHeaderValue).toBe("fr;q=0.9");
  });

  test("should return the value of the header when the header name is not lower cased", () => {
    // GIVEN a request that carries a canonically cased Accept-Language header
    const givenHeaders = { "Accept-Language": "fr;q=0.9" };

    // WHEN the header is read
    const actualHeaderValue = getAcceptLanguageHeader(givenHeaders);

    // THEN expect the value of the header to be returned
    expect(actualHeaderValue).toBe("fr;q=0.9");
  });

  test.each([
    ["the headers are missing", undefined],
    ["the headers are null", null],
    ["the request carries no Accept-Language header", { origin: "https://foo" }],
    ["the header carries no value", { "accept-language": undefined }],
  ])("should return undefined when %s", (_description, givenHeaders) => {
    // GIVEN the given headers of a request

    // WHEN the header is read
    const actualHeaderValue = getAcceptLanguageHeader(givenHeaders);

    // THEN expect no header value to be returned
    expect(actualHeaderValue).toBeUndefined();
  });
});
