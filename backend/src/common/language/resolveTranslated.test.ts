import LanguageAPISpecs from "api-specifications/language";
import { setConfiguration } from "server/config/config";
import { resolveTranslated, resolveTranslatedArray } from "./resolveTranslated";

describe("Test resolveTranslated()", () => {
  beforeEach(() => {
    // the environment is not configured, the fall back language is english, the one of the registry
    // @ts-ignore
    setConfiguration(undefined);
  });

  test("should return the value of the language when the value is translated in that language", () => {
    // GIVEN a value that is translated in english and in french
    const givenTranslatedValue: LanguageAPISpecs.Types.ITranslatedString = { en: "Cook", fr: "Cuisinier" };

    // WHEN the value is resolved to french
    const actualValue = resolveTranslated(givenTranslatedValue, "fr");

    // THEN expect the french value to be returned
    expect(actualValue).toBe("Cuisinier");
  });

  test("should return the value of the language when the value is a map, as mongoose hydrates it", () => {
    // GIVEN a value that is hydrated as a map
    const givenTranslatedValue = new Map([
      ["en", "Cook"],
      ["fr", "Cuisinier"],
    ]);

    // WHEN the value is resolved to french
    const actualValue = resolveTranslated(givenTranslatedValue, "fr");

    // THEN expect the french value to be returned
    expect(actualValue).toBe("Cuisinier");
  });

  test("should fall back to the fall back language when the value is not translated in the language", () => {
    // GIVEN a value that is translated in english only
    const givenTranslatedValue: LanguageAPISpecs.Types.ITranslatedString = { en: "Cook" };

    // WHEN the value is resolved to french
    const actualValue = resolveTranslated(givenTranslatedValue, "fr");

    // THEN expect the english value to be returned
    expect(actualValue).toBe("Cook");
  });

  test("should fall back to the fall back language when the value is a map that is not translated in the language", () => {
    // GIVEN a value that is hydrated as a map and is translated in english only
    const givenTranslatedValue = new Map([["en", "Cook"]]);

    // WHEN the value is resolved to french
    const actualValue = resolveTranslated(givenTranslatedValue, "fr");

    // THEN expect the english value to be returned
    expect(actualValue).toBe("Cook");
  });

  test.each([
    ["is empty", ""],
    ["is blank", "   "],
    ["is not a string", 1],
  ])("should fall back to the fall back language when the value of the language %s", (_description, givenValue) => {
    // GIVEN a value whose french translation is the given value
    const givenTranslatedValue = { en: "Cook", fr: givenValue };

    // WHEN the value is resolved to french
    // @ts-ignore
    const actualValue = resolveTranslated(givenTranslatedValue, "fr");

    // THEN expect the english value to be returned
    expect(actualValue).toBe("Cook");
  });

  test("should fall back to the given fall back language instead of the configured one", () => {
    // GIVEN a value that is translated in english and in spanish
    const givenTranslatedValue: LanguageAPISpecs.Types.ITranslatedString = { en: "Cook", es: "Cocinero" };

    // WHEN the value is resolved to french and falls back to spanish
    const actualValue = resolveTranslated(givenTranslatedValue, "fr", "es");

    // THEN expect the spanish value to be returned
    expect(actualValue).toBe("Cocinero");
  });

  test("should fall back to the configured fall back language", () => {
    // GIVEN the environment falls back to french
    // @ts-ignore
    setConfiguration({ fallbackLanguage: "fr" });
    // AND a value that is translated in english and in french
    const givenTranslatedValue: LanguageAPISpecs.Types.ITranslatedString = { en: "Cook", fr: "Cuisinier" };

    // WHEN the value is resolved to spanish
    const actualValue = resolveTranslated(givenTranslatedValue, "es");

    // THEN expect the french value to be returned
    expect(actualValue).toBe("Cuisinier");
  });

  test("should return an empty string when the value is translated in neither the language nor the fall back language", () => {
    // GIVEN a value that is translated in spanish only
    const givenTranslatedValue: LanguageAPISpecs.Types.ITranslatedString = { es: "Cocinero" };

    // WHEN the value is resolved to french
    const actualValue = resolveTranslated(givenTranslatedValue, "fr");

    // THEN expect an empty string to be returned
    expect(actualValue).toBe("");
  });

  test.each([
    ["the value is missing", undefined],
    ["the value is null", null],
    ["the value is not translated in any language", {}],
  ])("should return an empty string when %s", (_description, givenTranslatedValue) => {
    // GIVEN the given translated value

    // WHEN the value is resolved to french
    const actualValue = resolveTranslated(givenTranslatedValue, "fr");

    // THEN expect an empty string to be returned
    expect(actualValue).toBe("");
  });

  test("should fall back to the fall back language when no language is given", () => {
    // GIVEN a value that is translated in english
    const givenTranslatedValue: LanguageAPISpecs.Types.ITranslatedString = { en: "Cook" };

    // WHEN the value is resolved without a language
    // @ts-ignore
    const actualValue = resolveTranslated(givenTranslatedValue, undefined);

    // THEN expect the english value to be returned
    expect(actualValue).toBe("Cook");
  });
});

describe("Test resolveTranslatedArray()", () => {
  beforeEach(() => {
    // the environment is not configured, the fall back language is english, the one of the registry
    // @ts-ignore
    setConfiguration(undefined);
  });

  test("should resolve every item of the list to the language", () => {
    // GIVEN a list of values that are translated in english and in french
    const givenTranslatedValues: LanguageAPISpecs.Types.ITranslatedStringArray = [
      { en: "Cook", fr: "Cuisinier" },
      { en: "Chef", fr: "Chef de cuisine" },
    ];

    // WHEN the list is resolved to french
    const actualValues = resolveTranslatedArray(givenTranslatedValues, "fr");

    // THEN expect the french values to be returned, in the order of the list
    expect(actualValues).toEqual(["Cuisinier", "Chef de cuisine"]);
  });

  test("should fall back per item when an item is not translated in the language", () => {
    // GIVEN a list where the second item is translated in english only
    const givenTranslatedValues: LanguageAPISpecs.Types.ITranslatedStringArray = [
      { en: "Cook", fr: "Cuisinier" },
      { en: "Chef" },
    ];

    // WHEN the list is resolved to french
    const actualValues = resolveTranslatedArray(givenTranslatedValues, "fr");

    // THEN expect the french value of the first item and the english value of the second one
    expect(actualValues).toEqual(["Cuisinier", "Chef"]);
  });

  test("should drop an item that is translated in neither the language nor the fall back language", () => {
    // GIVEN a list where the second item is translated in spanish only
    const givenTranslatedValues: LanguageAPISpecs.Types.ITranslatedStringArray = [
      { en: "Cook", fr: "Cuisinier" },
      { es: "Cocinero" },
    ];

    // WHEN the list is resolved to french
    const actualValues = resolveTranslatedArray(givenTranslatedValues, "fr");

    // THEN expect the untranslated item to be dropped
    expect(actualValues).toEqual(["Cuisinier"]);
  });

  test("should fall back to the given fall back language instead of the configured one", () => {
    // GIVEN a list of values that are translated in english and in spanish
    const givenTranslatedValues: LanguageAPISpecs.Types.ITranslatedStringArray = [{ en: "Cook", es: "Cocinero" }];

    // WHEN the list is resolved to french and falls back to spanish
    const actualValues = resolveTranslatedArray(givenTranslatedValues, "fr", "es");

    // THEN expect the spanish values to be returned
    expect(actualValues).toEqual(["Cocinero"]);
  });

  test.each([
    ["the list is missing", undefined],
    ["the list is null", null],
    ["the list is empty", []],
    ["the list is not a list", { en: "Cook" }],
  ])("should return an empty list when %s", (_description, givenTranslatedValues) => {
    // GIVEN the given list of translated values

    // WHEN the list is resolved to french
    // @ts-ignore
    const actualValues = resolveTranslatedArray(givenTranslatedValues, "fr");

    // THEN expect an empty list to be returned
    expect(actualValues).toEqual([]);
  });
});
