import LanguageAPISpecs from "api-specifications/language";
import { setConfiguration } from "server/config/config";
import {
  readExistingTranslations,
  readFallbackLanguageValue,
  readFallbackLanguageValues,
  wrapTranslatableFields,
  wrapTranslated,
  wrapTranslatedArray,
} from "./translatedFields";

const FALLBACK_DB_KEY_NAME = LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.dbKeyName;
const OTHER_LANGUAGE_DB_KEY_NAME = LanguageAPISpecs.Constants.Languages.find(
  (language) => language.dbKeyName !== FALLBACK_DB_KEY_NAME
)!.dbKeyName;

beforeEach(() => {
  // the environment is not configured, the fall back language is the one of the registry
  // @ts-ignore
  setConfiguration(undefined);
});

describe("Test readFallbackLanguageValue()", () => {
  test("should return the value of the fall back language when the value is a plain object", () => {
    // GIVEN a translated value that is translated in the fall back language and in another language
    const givenFallbackValue = "Cook";
    const givenTranslatedValue = {
      [FALLBACK_DB_KEY_NAME]: givenFallbackValue,
      [OTHER_LANGUAGE_DB_KEY_NAME]: "Cuisinier",
    };

    // WHEN the fall back language is read
    const actualValue = readFallbackLanguageValue(givenTranslatedValue, FALLBACK_DB_KEY_NAME);

    // THEN expect the value of the fall back language to be returned
    expect(actualValue).toBe(givenFallbackValue);
  });

  test("should return the value of the fall back language when the value is a map, as mongoose hydrates it", () => {
    // GIVEN a translated value that is hydrated as a map
    const givenFallbackValue = "Cook";
    const givenTranslatedValue = new Map([
      [FALLBACK_DB_KEY_NAME, givenFallbackValue],
      [OTHER_LANGUAGE_DB_KEY_NAME, "Cuisinier"],
    ]);

    // WHEN the fall back language is read
    const actualValue = readFallbackLanguageValue(givenTranslatedValue, FALLBACK_DB_KEY_NAME);

    // THEN expect the value of the fall back language to be returned
    expect(actualValue).toBe(givenFallbackValue);
  });

  test("should return the value as-is when it is a flat string, e.g. from a document that predates the localized fields migration", () => {
    // GIVEN a value that was never localized
    const givenFlatValue = "Cook";

    // WHEN the fall back language is read
    const actualValue = readFallbackLanguageValue(givenFlatValue, FALLBACK_DB_KEY_NAME);

    // THEN expect the value to be passed through as-is
    expect(actualValue).toBe(givenFlatValue);
  });

  test("should return an empty value as-is, without treating it as untranslated", () => {
    // GIVEN a translated value whose fall back language is a whitespace only value
    const givenWhitespaceOnlyValue = "   ";
    const givenTranslatedValue = { [FALLBACK_DB_KEY_NAME]: givenWhitespaceOnlyValue };

    // WHEN the fall back language is read
    const actualValue = readFallbackLanguageValue(givenTranslatedValue, FALLBACK_DB_KEY_NAME);

    // THEN expect the stored value to be returned, not swapped for another language's value
    expect(actualValue).toBe(givenWhitespaceOnlyValue);
  });

  test.each([
    ["is a plain object that lacks the fall back language", { [OTHER_LANGUAGE_DB_KEY_NAME]: "Cuisinier" }],
    ["is a map that lacks the fall back language", new Map([[OTHER_LANGUAGE_DB_KEY_NAME, "Cuisinier"]])],
    ["is translated to something that is not a string", { [FALLBACK_DB_KEY_NAME]: 1 }],
    ["is an array, which is never a translated value", ["Cook"]],
    ["is undefined, e.g. a path that was never written", undefined],
    ["is null", null],
  ])("should return an empty string when the value %s", (_description, givenTranslatedValue) => {
    // GIVEN a value that carries no fall back language

    // WHEN the fall back language is read
    const actualValue = readFallbackLanguageValue(givenTranslatedValue, FALLBACK_DB_KEY_NAME);

    // THEN expect an empty string to be returned
    expect(actualValue).toBe("");
  });
});

describe("Test readFallbackLanguageValues()", () => {
  test("should return the value of the fall back language of every item, in the order of the list", () => {
    // GIVEN a list of translated values
    const givenTranslatedValues = [
      { [FALLBACK_DB_KEY_NAME]: "first" },
      new Map([[FALLBACK_DB_KEY_NAME, "second"]]),
      "third",
    ];

    // WHEN the fall back language is read
    const actualValues = readFallbackLanguageValues(givenTranslatedValues, FALLBACK_DB_KEY_NAME);

    // THEN expect the values of the fall back language, in the order of the list
    expect(actualValues).toEqual(["first", "second", "third"]);
  });

  test("should read an item that lacks the fall back language as an empty string, instead of dropping it", () => {
    // GIVEN a list whose second item lacks the fall back language, e.g. data written before validation existed
    const givenTranslatedValues = [
      { [FALLBACK_DB_KEY_NAME]: "kept" },
      { [OTHER_LANGUAGE_DB_KEY_NAME]: "sans anglais" },
    ];

    // WHEN the fall back language is read
    const actualValues = readFallbackLanguageValues(givenTranslatedValues, FALLBACK_DB_KEY_NAME);

    // THEN expect the list to keep its length and its order
    expect(actualValues).toEqual(["kept", ""]);
  });

  test.each([
    ["undefined, e.g. a path that was never written", undefined],
    ["null", null],
    ["not a list", { [FALLBACK_DB_KEY_NAME]: "Cook" }],
  ])("should return an empty list when the values are %s", (_description, givenTranslatedValues) => {
    // GIVEN no list of translated values

    // WHEN the fall back language is read
    const actualValues = readFallbackLanguageValues(givenTranslatedValues, FALLBACK_DB_KEY_NAME);

    // THEN expect an empty list to be returned
    expect(actualValues).toEqual([]);
  });
});

describe("Test wrapTranslated()", () => {
  test("should wrap a flat string into a translated value keyed by the fall back language", () => {
    // GIVEN a flat string
    const givenValue = "Cook";

    // WHEN the value is wrapped
    const actualTranslatedValue = wrapTranslated(givenValue);

    // THEN expect a map keyed by the fall back language, the shape a translated path is stored in
    expect(actualTranslatedValue).toEqual(new Map([[FALLBACK_DB_KEY_NAME, givenValue]]));
  });
});

describe("Test wrapTranslatedArray()", () => {
  test("should wrap every flat string of a list, in the order of the list", () => {
    // GIVEN a list of flat strings
    const givenValues = ["first", "second"];

    // WHEN the values are wrapped
    const actualTranslatedValues = wrapTranslatedArray(givenValues);

    // THEN expect every item to be keyed by the fall back language, in the order of the list
    expect(actualTranslatedValues).toEqual([
      new Map([[FALLBACK_DB_KEY_NAME, "first"]]),
      new Map([[FALLBACK_DB_KEY_NAME, "second"]]),
    ]);
  });

  test("should return an empty list when the list is empty", () => {
    // GIVEN an empty list of flat strings
    const givenValues: string[] = [];

    // WHEN the values are wrapped
    const actualTranslatedValues = wrapTranslatedArray(givenValues);

    // THEN expect an empty list to be returned
    expect(actualTranslatedValues).toEqual([]);
  });
});

describe("Test readExistingTranslations()", () => {
  test("should return a copy of the value when it is a map, as mongoose hydrates a translated path", () => {
    // GIVEN a stored value that is hydrated as a map
    const givenStoredValue = new Map([
      [FALLBACK_DB_KEY_NAME, "Cook"],
      [OTHER_LANGUAGE_DB_KEY_NAME, "Cuisinier"],
    ]);

    // WHEN the existing translations are read
    const actualTranslations = readExistingTranslations(givenStoredValue);

    // THEN expect every language of the map to be returned, as a copy so that the stored value is not mutated later
    expect(actualTranslations).toEqual(givenStoredValue);
    expect(actualTranslations).not.toBe(givenStoredValue);
  });

  test("should return the entries of the value when it is a plain object, as a lean query hands it over", () => {
    // GIVEN a stored value that is a plain object
    const givenStoredValue = { [FALLBACK_DB_KEY_NAME]: "Cook", [OTHER_LANGUAGE_DB_KEY_NAME]: "Cuisinier" };

    // WHEN the existing translations are read
    const actualTranslations = readExistingTranslations(givenStoredValue);

    // THEN expect its entries to be returned as a map
    expect(actualTranslations).toEqual(
      new Map([
        [FALLBACK_DB_KEY_NAME, "Cook"],
        [OTHER_LANGUAGE_DB_KEY_NAME, "Cuisinier"],
      ])
    );
  });

  test.each([
    ["undefined, e.g. a path of a brand new, unsaved document", undefined],
    ["null", null],
    ["a flat string, e.g. from a document that predates the localized fields migration", "Cook"],
    ["an array, which is never a single translated value", [{ en: "Cook" }]],
  ])("should return no translations when the value is %s", (_description, givenStoredValue) => {
    // GIVEN a stored value that carries no translations

    // WHEN the existing translations are read
    const actualTranslations = readExistingTranslations(givenStoredValue);

    // THEN expect no translations to be returned
    expect(actualTranslations).toEqual(new Map());
  });
});

describe("Test wrapTranslatableFields()", () => {
  const givenTranslatableStringFields = ["preferredLabel", "description"] as const;

  test("should wrap every translatable field of the spec into the fall back language", () => {
    // GIVEN a spec whose translatable fields are flat strings
    const givenSpec = {
      preferredLabel: "Cook",
      description: "Prepares food",
      altLabels: ["Chef"],
      code: "1234",
    };

    // WHEN the translatable fields are wrapped, for a new entity
    const actualWrapped = wrapTranslatableFields(givenSpec, givenTranslatableStringFields);

    // THEN expect the translatable fields to be keyed by the fall back language, the rest untouched
    expect(actualWrapped).toEqual({
      preferredLabel: new Map([[FALLBACK_DB_KEY_NAME, "Cook"]]),
      description: new Map([[FALLBACK_DB_KEY_NAME, "Prepares food"]]),
      altLabels: [new Map([[FALLBACK_DB_KEY_NAME, "Chef"]])],
      code: "1234",
    });
  });

  test("should leave a translatable field the spec does not carry absent, so that a patch does not clear it", () => {
    // GIVEN a spec that carries one of the translatable fields only
    const givenSpec = { preferredLabel: "Cook" };

    // WHEN the translatable fields are wrapped
    const actualWrapped = wrapTranslatableFields(givenSpec, givenTranslatableStringFields);

    // THEN expect the field the spec does not carry to stay absent
    expect(actualWrapped).toEqual({ preferredLabel: new Map([[FALLBACK_DB_KEY_NAME, "Cook"]]) });
  });

  test("should merge the fall back language into the translations the document already carries", () => {
    // GIVEN a spec that carries a new value for the fall back language
    const givenSpec = { preferredLabel: "Cook" };
    // AND a document that is already translated in the fall back language and in another language
    const givenExistingDoc = {
      preferredLabel: new Map([
        [FALLBACK_DB_KEY_NAME, "Stale"],
        [OTHER_LANGUAGE_DB_KEY_NAME, "Cuisinier"],
      ]),
    };

    // WHEN the translatable fields are wrapped against that document
    const actualWrapped = wrapTranslatableFields(givenSpec, givenTranslatableStringFields, givenExistingDoc);

    // THEN expect the other language to be kept and the fall back language to be replaced
    expect(actualWrapped).toEqual({
      preferredLabel: new Map([
        [FALLBACK_DB_KEY_NAME, "Cook"],
        [OTHER_LANGUAGE_DB_KEY_NAME, "Cuisinier"],
      ]),
    });
  });

  test("should not mutate the translations of the document it is given", () => {
    // GIVEN a spec that carries a new value for the fall back language
    const givenSpec = { preferredLabel: "Cook" };
    // AND a document that is already translated in the fall back language
    const givenExistingTranslations = new Map([[FALLBACK_DB_KEY_NAME, "Stale"]]);
    const givenExistingDoc = { preferredLabel: givenExistingTranslations };

    // WHEN the translatable fields are wrapped against that document
    wrapTranslatableFields(givenSpec, givenTranslatableStringFields, givenExistingDoc);

    // THEN expect the translations of the document to be unchanged
    expect(givenExistingTranslations).toEqual(new Map([[FALLBACK_DB_KEY_NAME, "Stale"]]));
  });

  test("should replace altLabels wholesale, since an item has no identity to merge by", () => {
    // GIVEN a spec that carries new altLabels
    const givenSpec = { altLabels: ["Chef"] };
    // AND a document whose altLabels are translated in another language
    const givenExistingDoc = {
      altLabels: [new Map([[OTHER_LANGUAGE_DB_KEY_NAME, "Cuisinier"]])],
    };

    // WHEN the translatable fields are wrapped against that document
    const actualWrapped = wrapTranslatableFields(givenSpec, givenTranslatableStringFields, givenExistingDoc);

    // THEN expect the altLabels of the spec to replace the ones of the document
    expect(actualWrapped).toEqual({ altLabels: [new Map([[FALLBACK_DB_KEY_NAME, "Chef"]])] });
  });

  test("should not mutate the spec it is given", () => {
    // GIVEN a spec whose translatable fields are flat strings
    const givenSpec = { preferredLabel: "Cook", altLabels: ["Chef"] };

    // WHEN the translatable fields are wrapped
    wrapTranslatableFields(givenSpec, givenTranslatableStringFields);

    // THEN expect the spec to be unchanged
    expect(givenSpec).toEqual({ preferredLabel: "Cook", altLabels: ["Chef"] });
  });
});
