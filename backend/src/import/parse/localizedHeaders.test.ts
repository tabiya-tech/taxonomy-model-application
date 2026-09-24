// mute console.log
import "_test_utilities/consoleMock";

import {
  assembleTranslatedArray,
  assembleTranslatedString,
  checkPreferredLabelInAltLabels,
  detectHeaderMode,
  getLocalizedHeadersValidator,
  LocalizedParseContext,
} from "./localizedHeaders";
import errorLogger from "common/errorLogger/errorLogger";
import LanguageAPISpecs from "api-specifications/language";
import { ITranslatedStringDoc } from "common/language/translatedString.types";
import { getFallbackLanguageConfig } from "common/language/fallbackLanguage";

// Two real language configs from the platform registry
const EN = LanguageAPISpecs.Constants.Languages[0]; // shortCode: "en", dbKeyName: "en", csvSuffix: "EN"
const FR = LanguageAPISpecs.Constants.Languages[1]; // shortCode: "fr", dbKeyName: "fr", csvSuffix: "FR"

const LOCALIZABLE_FIELDS = ["PREFERREDLABEL", "ALTLABELS", "DESCRIPTION"] as const;
const NON_LOCALIZABLE_HEADERS = ["ID", "CODE"] as const;

// Build a complete set of legacy (unsuffixed) headers
function getLegacyHeaders(...extras: string[]): string[] {
  return ["ID", "CODE", "PREFERREDLABEL", "ALTLABELS", "DESCRIPTION", ...extras];
}

// Build a complete set of localized (suffixed) headers for the given languages
function getLocalizedHeaders(languages: LanguageAPISpecs.Types.ILanguageConfig[], ...extras: string[]): string[] {
  return ["ID", "CODE", ...LOCALIZABLE_FIELDS.flatMap((f) => languages.map((l) => `${f}_${l.csvSuffix}`)), ...extras];
}

describe("detectHeaderMode", () => {
  beforeAll(() => {
    jest.spyOn(errorLogger, "logError");
    jest.spyOn(errorLogger, "logWarning");
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return legacy mode when all localizable fields are present as unsuffixed columns", () => {
    // GIVEN headers with all localizable fields unsuffixed
    const givenHeaders = getLegacyHeaders();
    // AND a single available language
    const givenAvailableLanguages = [EN.shortCode];

    // WHEN detectHeaderMode is called with the given headers and available languages
    const actualResult = detectHeaderMode(givenHeaders, LOCALIZABLE_FIELDS, givenAvailableLanguages, "Entity");

    // THEN the mode should be legacy
    expect(actualResult).toEqual({ mode: "legacy", languages: [EN] });
    // AND a legacy-mode warning should be logged
    expect(errorLogger.logWarning).toHaveBeenCalledWith(expect.stringContaining("legacy unsuffixed columns"));
    // AND no error should be logged
    expect(errorLogger.logError).not.toHaveBeenCalled();
  });

  test("should return localized mode when all localizable fields are present as suffixed columns", () => {
    // GIVEN headers with all localizable fields suffixed for EN and FR
    const givenHeaders = getLocalizedHeaders([EN, FR]);
    // AND both languages available
    const givenAvailableLanguages = [EN.shortCode, FR.shortCode];

    // WHEN detectHeaderMode is called with the given headers and available languages
    const actualResult = detectHeaderMode(givenHeaders, LOCALIZABLE_FIELDS, givenAvailableLanguages, "Entity");

    // THEN the mode should be localized with both language configs
    expect(actualResult).toEqual({ mode: "localized", languages: [EN, FR] });
    // AND no error should be logged
    expect(errorLogger.logError).not.toHaveBeenCalled();
    // AND no warning should be logged
    expect(errorLogger.logWarning).not.toHaveBeenCalled();
  });

  test("should return null and log error when availableLanguages contains an unknown short code", () => {
    // GIVEN headers that look valid
    const givenHeaders = getLegacyHeaders();
    // AND an unknown language short code not in the platform registry
    const givenAvailableLanguages = ["xx"];

    // WHEN detectHeaderMode is called with the given headers and available languages
    const actualResult = detectHeaderMode(givenHeaders, LOCALIZABLE_FIELDS, givenAvailableLanguages, "Entity");

    // THEN null should be returned
    expect(actualResult).toBeNull();
    // AND an error should be logged
    expect(errorLogger.logError).toHaveBeenCalledWith(expect.stringContaining("unknown language short code 'xx'"));
  });

  test("should return null and log error when a CSV column uses an unknown language suffix", () => {
    // GIVEN a header with an unrecognised suffix on a localizable field
    const givenHeaders = ["ID", "CODE", "PREFERREDLABEL_XX", "ALTLABELS_EN", "DESCRIPTION_EN"];
    // AND EN as the only available language
    const givenAvailableLanguages = [EN.shortCode];

    // WHEN detectHeaderMode is called with the given headers and available languages
    const actualResult = detectHeaderMode(givenHeaders, LOCALIZABLE_FIELDS, givenAvailableLanguages, "Entity");

    // THEN null should be returned
    expect(actualResult).toBeNull();
    // AND an error should be logged
    expect(errorLogger.logError).toHaveBeenCalledWith(expect.stringContaining("unknown language suffix 'XX'"));
  });

  test("should return null and log error when a CSV column uses a suffix for a language not in availableLanguages", () => {
    // GIVEN only EN in availableLanguages
    const givenAvailableLanguages = [EN.shortCode];
    // AND headers that include a FR-suffixed column not declared in availableLanguages
    const givenHeaders = ["ID", "CODE", "PREFERREDLABEL_EN", "ALTLABELS_EN", "DESCRIPTION_EN", "PREFERREDLABEL_FR"];

    // WHEN detectHeaderMode is called with the given headers and available languages
    const actualResult = detectHeaderMode(givenHeaders, LOCALIZABLE_FIELDS, givenAvailableLanguages, "Entity");

    // THEN null should be returned
    expect(actualResult).toBeNull();
    // AND an error should be logged
    expect(errorLogger.logError).toHaveBeenCalledWith(expect.stringContaining("not in the model's availableLanguages"));
  });

  test("should return null and log error when a field has both an unsuffixed and a suffixed form", () => {
    // GIVEN PREFERREDLABEL appears both unsuffixed and as PREFERREDLABEL_EN (mixed for the same field)
    const givenHeaders = ["ID", "CODE", "PREFERREDLABEL", "PREFERREDLABEL_EN", "ALTLABELS", "DESCRIPTION"];
    // AND EN as the available language
    const givenAvailableLanguages = [EN.shortCode];

    // WHEN detectHeaderMode is called with the given headers and available languages
    const actualResult = detectHeaderMode(givenHeaders, LOCALIZABLE_FIELDS, givenAvailableLanguages, "Entity");

    // THEN null should be returned
    expect(actualResult).toBeNull();
    // AND an error should be logged
    expect(errorLogger.logError).toHaveBeenCalledWith(expect.stringContaining("mixing is not allowed"));
  });

  test("should return null and log error when some localizable fields are legacy and others are localized", () => {
    // GIVEN PREFERREDLABEL and ALTLABELS are unsuffixed but DESCRIPTION is suffixed
    const givenHeaders = ["ID", "CODE", "PREFERREDLABEL", "ALTLABELS", "DESCRIPTION_EN"];
    // AND EN as the available language
    const givenAvailableLanguages = [EN.shortCode];

    // WHEN detectHeaderMode is called with the given headers and available languages
    const actualResult = detectHeaderMode(givenHeaders, LOCALIZABLE_FIELDS, givenAvailableLanguages, "Entity");

    // THEN null should be returned
    expect(actualResult).toBeNull();
    // AND an error should be logged
    expect(errorLogger.logError).toHaveBeenCalledWith(expect.stringContaining("mixes legacy unsuffixed columns"));
  });

  test("should return legacy mode with a warning when all localizable fields are absent", () => {
    // GIVEN headers with no localizable fields at all
    const givenHeaders = ["ID", "CODE"];
    // AND EN as the available language
    const givenAvailableLanguages = [EN.shortCode];

    // WHEN detectHeaderMode is called with the given headers and available languages
    const actualResult = detectHeaderMode(givenHeaders, LOCALIZABLE_FIELDS, givenAvailableLanguages, "Entity");

    // THEN legacy mode should be returned (nothing to detect as localized)
    expect(actualResult).toEqual({ mode: "legacy", languages: [EN] });
    // AND a legacy-mode warning should be logged
    expect(errorLogger.logWarning).toHaveBeenCalledWith(expect.stringContaining("legacy unsuffixed columns"));
  });

  test("should ignore suffixed columns whose base field is not a localizable field", () => {
    // GIVEN legacy localizable headers plus a CODE_EN column (CODE is not a localizable field)
    const givenHeaders = getLegacyHeaders("CODE_EN");
    // AND EN as the available language
    const givenAvailableLanguages = [EN.shortCode];

    // WHEN detectHeaderMode is called with the given headers and available languages
    const actualResult = detectHeaderMode(givenHeaders, LOCALIZABLE_FIELDS, givenAvailableLanguages, "Entity");

    // THEN legacy mode should be returned without error
    expect(actualResult).toEqual({ mode: "legacy", languages: [EN] });
    // AND no error should be logged
    expect(errorLogger.logError).not.toHaveBeenCalled();
  });
});

describe("getLocalizedHeadersValidator", () => {
  beforeAll(() => {
    jest.spyOn(errorLogger, "logError");
    jest.spyOn(errorLogger, "logWarning");
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return true and populate ctx when headers are valid legacy headers", async () => {
    // GIVEN valid legacy headers
    const givenHeaders = getLegacyHeaders();
    // AND a shared parse context
    const givenCtx: LocalizedParseContext = {};
    // AND EN as the available language
    const givenAvailableLanguages = [EN.shortCode];

    // WHEN the validator is invoked
    const givenValidator = getLocalizedHeadersValidator(
      "V",
      NON_LOCALIZABLE_HEADERS,
      LOCALIZABLE_FIELDS,
      givenAvailableLanguages,
      givenCtx
    );
    const actualResult = await givenValidator(givenHeaders);

    // THEN it should return true
    expect(actualResult).toBe(true);
    // AND ctx should be populated with legacy mode and the EN language config
    expect(givenCtx.mode).toBe("legacy");
    expect(givenCtx.languages).toEqual([EN]);
    // AND no error should be logged
    expect(errorLogger.logError).not.toHaveBeenCalled();
  });

  test("should return true and populate ctx when headers are valid localized headers", async () => {
    // GIVEN valid localized headers for EN and FR
    const givenHeaders = getLocalizedHeaders([EN, FR]);
    // AND a shared parse context
    const givenCtx: LocalizedParseContext = {};
    // AND both languages available
    const givenAvailableLanguages = [EN.shortCode, FR.shortCode];

    // WHEN the validator is invoked
    const givenValidator = getLocalizedHeadersValidator(
      "V",
      NON_LOCALIZABLE_HEADERS,
      LOCALIZABLE_FIELDS,
      givenAvailableLanguages,
      givenCtx
    );
    const actualResult = await givenValidator(givenHeaders);

    // THEN it should return true
    expect(actualResult).toBe(true);
    // AND ctx should be populated with localized mode and both language configs
    expect(givenCtx.mode).toBe("localized");
    expect(givenCtx.languages).toEqual([EN, FR]);
    // AND no error should be logged
    expect(errorLogger.logError).not.toHaveBeenCalled();
  });

  test("should return false and not touch ctx when a non-localizable required header is missing", async () => {
    // GIVEN headers where the required non-localizable header "ID" is absent
    const givenHeaders = getLegacyHeaders().filter((h) => h !== "ID");
    // AND an empty parse context
    const givenCtx: LocalizedParseContext = {};
    // AND EN as the available language
    const givenAvailableLanguages = [EN.shortCode];

    // WHEN the validator is invoked
    const givenValidator = getLocalizedHeadersValidator(
      "V",
      NON_LOCALIZABLE_HEADERS,
      LOCALIZABLE_FIELDS,
      givenAvailableLanguages,
      givenCtx
    );
    const actualResult = await givenValidator(givenHeaders);

    // THEN it should return false
    expect(actualResult).toBe(false);
    // AND an error should be logged
    expect(errorLogger.logError).toHaveBeenCalledWith(expect.stringContaining("expected to include header ID"));
    // AND ctx should remain unpopulated
    expect(givenCtx.mode).toBeUndefined();
    expect(givenCtx.languages).toBeUndefined();
  });

  test("should return false and not touch ctx when detectHeaderMode returns null", async () => {
    // GIVEN headers with a column whose suffix is unrecognised
    const givenHeaders = ["ID", "CODE", "PREFERREDLABEL_XX", "ALTLABELS_EN", "DESCRIPTION_EN"];
    // AND an empty parse context
    const givenCtx: LocalizedParseContext = {};
    // AND EN as the available language
    const givenAvailableLanguages = [EN.shortCode];

    // WHEN the validator is invoked
    const givenValidator = getLocalizedHeadersValidator(
      "V",
      NON_LOCALIZABLE_HEADERS,
      LOCALIZABLE_FIELDS,
      givenAvailableLanguages,
      givenCtx
    );
    const actualResult = await givenValidator(givenHeaders);

    // THEN it should return false
    expect(actualResult).toBe(false);
    // AND ctx should remain unpopulated
    expect(givenCtx.mode).toBeUndefined();
    expect(givenCtx.languages).toBeUndefined();
  });

  test("should return false and not touch ctx when a required suffixed column is missing in localized mode", async () => {
    // GIVEN localized headers for EN and FR but with ALTLABELS_FR removed
    const givenHeaders = getLocalizedHeaders([EN, FR]).filter((h) => h !== "ALTLABELS_FR");
    // AND an empty parse context
    const givenCtx: LocalizedParseContext = {};
    // AND both languages available
    const givenAvailableLanguages = [EN.shortCode, FR.shortCode];

    // WHEN the validator is invoked
    const givenValidator = getLocalizedHeadersValidator(
      "V",
      NON_LOCALIZABLE_HEADERS,
      LOCALIZABLE_FIELDS,
      givenAvailableLanguages,
      givenCtx
    );
    const actualResult = await givenValidator(givenHeaders);

    // THEN it should return false
    expect(actualResult).toBe(false);
    // AND an error should be logged naming the missing column
    expect(errorLogger.logError).toHaveBeenCalledWith(expect.stringContaining("ALTLABELS_FR"));
    // AND ctx should remain unpopulated
    expect(givenCtx.mode).toBeUndefined();
    expect(givenCtx.languages).toBeUndefined();
  });
});

describe("assembleTranslatedString", () => {
  const fallback = getFallbackLanguageConfig();

  test("should return a map keyed by the fallback language dbKeyName in legacy mode", () => {
    // GIVEN a row with an unsuffixed PREFERREDLABEL value
    const givenRow = { PREFERREDLABEL: "hello", ALTLABELS: "", DESCRIPTION: "" };

    // WHEN assembleTranslatedString is called in legacy mode
    const actualResult = assembleTranslatedString(givenRow, "PREFERREDLABEL", "legacy", [EN]);

    // THEN the map should contain the value under the fallback language key
    expect(actualResult).toEqual(new Map([[fallback.dbKeyName, "hello"]]));
  });

  test("should return an empty string under the fallback key when the legacy field is empty", () => {
    // GIVEN a row with an empty PREFERREDLABEL value
    const givenRow = { PREFERREDLABEL: "", ALTLABELS: "", DESCRIPTION: "" };

    // WHEN assembleTranslatedString is called in legacy mode
    const actualResult = assembleTranslatedString(givenRow, "PREFERREDLABEL", "legacy", [EN]);

    // THEN the map should contain an empty string under the fallback key
    expect(actualResult).toEqual(new Map([[fallback.dbKeyName, ""]]));
  });

  test("should return a map with one entry per language in localized mode", () => {
    // GIVEN a row with EN and FR suffixed values for PREFERREDLABEL
    const givenRow = {
      PREFERREDLABEL: "",
      ALTLABELS: "",
      DESCRIPTION: "",
      PREFERREDLABEL_EN: "hello",
      PREFERREDLABEL_FR: "bonjour",
    };

    // WHEN assembleTranslatedString is called in localized mode
    const actualResult = assembleTranslatedString(givenRow, "PREFERREDLABEL", "localized", [EN, FR]);

    // THEN the map should contain one entry per language
    expect(actualResult).toEqual(
      new Map([
        [EN.dbKeyName, "hello"],
        [FR.dbKeyName, "bonjour"],
      ])
    );
  });

  test("should store an empty string for a missing suffixed column in localized mode", () => {
    // GIVEN a row where PREFERREDLABEL_FR is absent
    const givenRow = { PREFERREDLABEL: "", ALTLABELS: "", DESCRIPTION: "", PREFERREDLABEL_EN: "hello" };

    // WHEN assembleTranslatedString is called in localized mode
    const actualResult = assembleTranslatedString(givenRow, "PREFERREDLABEL", "localized", [EN, FR]);

    // THEN the EN entry should have the value
    expect(actualResult.get(EN.dbKeyName as LanguageAPISpecs.Types.LanguageDbKeyName)).toBe("hello");
    // AND the FR entry should be an empty string
    expect(actualResult.get(FR.dbKeyName as LanguageAPISpecs.Types.LanguageDbKeyName)).toBe("");
  });
});

describe("assembleTranslatedArray", () => {
  const fallback = getFallbackLanguageConfig();

  beforeAll(() => {
    jest.spyOn(errorLogger, "logWarning");
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return a translated array keyed by the fallback language in legacy mode", () => {
    // GIVEN a row with a newline-separated ALTLABELS value
    const givenRow = { PREFERREDLABEL: "", ALTLABELS: "label1\nlabel2", DESCRIPTION: "" };

    // WHEN assembleTranslatedArray is called in legacy mode
    const { translatedArray, duplicateCounts } = assembleTranslatedArray(givenRow, "ALTLABELS", "legacy", [EN]);

    // THEN each label should be stored as a single-entry map under the fallback language key
    expect(translatedArray).toEqual([
      new Map([[fallback.dbKeyName, "label1"]]),
      new Map([[fallback.dbKeyName, "label2"]]),
    ]);
    // AND no duplicates should have been counted
    expect(duplicateCounts.size).toBe(0);
  });

  test("should deduplicate labels and populate duplicateCounts in legacy mode", () => {
    // GIVEN a row with a duplicate ALTLABELS entry
    const givenRow = { PREFERREDLABEL: "", ALTLABELS: "label1\nlabel1\nlabel2", DESCRIPTION: "" };

    // WHEN assembleTranslatedArray is called in legacy mode
    const { translatedArray, duplicateCounts } = assembleTranslatedArray(givenRow, "ALTLABELS", "legacy", [EN]);

    // THEN the duplicate should be removed
    expect(translatedArray).toHaveLength(2);
    // AND the duplicate count should be recorded for the fallback language
    expect(duplicateCounts.get(fallback.dbKeyName)).toBe(1);
  });

  test("should filter out empty strings from the result in legacy mode", () => {
    // GIVEN a row with an empty entry between two valid labels
    const givenRow = { PREFERREDLABEL: "", ALTLABELS: "label1\n\nlabel2", DESCRIPTION: "" };

    // WHEN assembleTranslatedArray is called in legacy mode
    const { translatedArray } = assembleTranslatedArray(givenRow, "ALTLABELS", "legacy", [EN]);

    // THEN only the two non-empty labels should remain
    expect(translatedArray).toHaveLength(2);
  });

  test("should return an empty array when the legacy field is empty", () => {
    // GIVEN a row with an empty ALTLABELS field
    const givenRow = { PREFERREDLABEL: "", ALTLABELS: "", DESCRIPTION: "" };

    // WHEN assembleTranslatedArray is called in legacy mode
    const { translatedArray, duplicateCounts } = assembleTranslatedArray(givenRow, "ALTLABELS", "legacy", [EN]);

    // THEN the array should be empty
    expect(translatedArray).toHaveLength(0);
    // AND no duplicates should have been counted
    expect(duplicateCounts.size).toBe(0);
  });

  test("should merge labels positionally across languages in localized mode", () => {
    // GIVEN EN and FR columns each with two labels
    const givenRow = {
      PREFERREDLABEL: "",
      ALTLABELS: "",
      DESCRIPTION: "",
      ALTLABELS_EN: "label1\nlabel2",
      ALTLABELS_FR: "étiquette1\nétiquette2",
    };

    // WHEN assembleTranslatedArray is called in localized mode
    const { translatedArray, duplicateCounts } = assembleTranslatedArray(givenRow, "ALTLABELS", "localized", [EN, FR]);

    // THEN each position should be a map with one entry per language
    expect(translatedArray).toEqual([
      new Map([
        [EN.dbKeyName, "label1"],
        [FR.dbKeyName, "étiquette1"],
      ]),
      new Map([
        [EN.dbKeyName, "label2"],
        [FR.dbKeyName, "étiquette2"],
      ]),
    ]);
    // AND no duplicates should have been counted
    expect(duplicateCounts.size).toBe(0);
  });

  test("should log a warning and produce sparse entries when language arrays have different lengths in localized mode", () => {
    // GIVEN EN has two labels but FR only has one
    const givenRow = {
      PREFERREDLABEL: "",
      ALTLABELS: "",
      DESCRIPTION: "",
      ALTLABELS_EN: "label1\nlabel2",
      ALTLABELS_FR: "étiquette1",
    };

    // WHEN assembleTranslatedArray is called in localized mode
    const { translatedArray } = assembleTranslatedArray(givenRow, "ALTLABELS", "localized", [EN, FR]);

    // THEN the array length should be the max (2)
    expect(translatedArray).toHaveLength(2);
    // AND the first entry should have both EN and FR
    expect(translatedArray[0].get(EN.dbKeyName as LanguageAPISpecs.Types.LanguageDbKeyName)).toBe("label1");
    expect(translatedArray[0].get(FR.dbKeyName as LanguageAPISpecs.Types.LanguageDbKeyName)).toBe("étiquette1");
    // AND the second entry should have EN but not FR (sparse)
    expect(translatedArray[1].get(EN.dbKeyName as LanguageAPISpecs.Types.LanguageDbKeyName)).toBe("label2");
    expect(translatedArray[1].has(FR.dbKeyName as LanguageAPISpecs.Types.LanguageDbKeyName)).toBe(false);
    // AND a warning should be logged
    expect(errorLogger.logWarning).toHaveBeenCalledWith(expect.stringContaining("different label counts per language"));
  });

  test("should deduplicate per language independently in localized mode", () => {
    // GIVEN EN has a duplicate entry, FR does not
    const givenRow = {
      PREFERREDLABEL: "",
      ALTLABELS: "",
      DESCRIPTION: "",
      ALTLABELS_EN: "label1\nlabel1",
      ALTLABELS_FR: "étiquette1\nétiquette2",
    };

    // WHEN assembleTranslatedArray is called in localized mode
    const { duplicateCounts } = assembleTranslatedArray(givenRow, "ALTLABELS", "localized", [EN, FR]);

    // THEN EN should report one duplicate
    expect(duplicateCounts.get(EN.dbKeyName)).toBe(1);
    // AND FR should have no duplicate count entry
    expect(duplicateCounts.has(FR.dbKeyName)).toBe(false);
  });

  test("should return an empty array when all localized columns are empty", () => {
    // GIVEN all suffixed ALTLABELS columns are empty strings
    const givenRow = {
      PREFERREDLABEL: "",
      ALTLABELS: "",
      DESCRIPTION: "",
      ALTLABELS_EN: "",
      ALTLABELS_FR: "",
    };

    // WHEN assembleTranslatedArray is called in localized mode
    const { translatedArray, duplicateCounts } = assembleTranslatedArray(givenRow, "ALTLABELS", "localized", [EN, FR]);

    // THEN the array should be empty
    expect(translatedArray).toHaveLength(0);
    // AND no duplicates should have been counted
    expect(duplicateCounts.size).toBe(0);
    // AND no warning should be logged
    expect(errorLogger.logWarning).not.toHaveBeenCalled();
  });
});

describe("checkPreferredLabelInAltLabels", () => {
  test("should return an empty set when all language preferred labels are present in altLabels", () => {
    // GIVEN a preferredLabel present in both EN and FR
    const givenPreferredLabel: ITranslatedStringDoc = new Map([
      [EN.dbKeyName as LanguageAPISpecs.Types.LanguageDbKeyName, "hello"],
      [FR.dbKeyName as LanguageAPISpecs.Types.LanguageDbKeyName, "bonjour"],
    ]);
    // AND altLabels that include the preferred label for each language
    const givenAltLabels = [
      new Map([
        [EN.dbKeyName as LanguageAPISpecs.Types.LanguageDbKeyName, "hello"],
        [FR.dbKeyName as LanguageAPISpecs.Types.LanguageDbKeyName, "bonjour"],
      ]),
      new Map([[EN.dbKeyName as LanguageAPISpecs.Types.LanguageDbKeyName, "other"]]),
    ];

    // WHEN checkPreferredLabelInAltLabels is called with the given preferred label and alt labels
    const actualResult = checkPreferredLabelInAltLabels(givenPreferredLabel, givenAltLabels);

    // THEN the set of missing languages should be empty
    expect(actualResult.size).toBe(0);
  });

  test("should return the language key when the preferred label is not found in altLabels for that language", () => {
    // GIVEN a preferredLabel in EN that is not present in any altLabel entry
    const givenPreferredLabel: ITranslatedStringDoc = new Map([
      [EN.dbKeyName as LanguageAPISpecs.Types.LanguageDbKeyName, "hello"],
    ]);
    // AND altLabels that do not include the EN preferred label
    const givenAltLabels = [new Map([[EN.dbKeyName as LanguageAPISpecs.Types.LanguageDbKeyName, "other"]])];

    // WHEN checkPreferredLabelInAltLabels is called with the given preferred label and alt labels
    const actualResult = checkPreferredLabelInAltLabels(givenPreferredLabel, givenAltLabels);

    // THEN EN should be reported as missing
    expect(actualResult).toEqual(new Set([EN.dbKeyName]));
  });

  test("should return both language keys when the preferred label is missing from altLabels for both languages", () => {
    // GIVEN a preferredLabel for EN and FR that is not present in any altLabel entry
    const givenPreferredLabel: ITranslatedStringDoc = new Map([
      [EN.dbKeyName as LanguageAPISpecs.Types.LanguageDbKeyName, "hello"],
      [FR.dbKeyName as LanguageAPISpecs.Types.LanguageDbKeyName, "bonjour"],
    ]);
    // AND altLabels that do not include either preferred label
    const givenAltLabels = [
      new Map([
        [EN.dbKeyName as LanguageAPISpecs.Types.LanguageDbKeyName, "other EN"],
        [FR.dbKeyName as LanguageAPISpecs.Types.LanguageDbKeyName, "other FR"],
      ]),
    ];

    // WHEN checkPreferredLabelInAltLabels is called with the given preferred label and alt labels
    const actualResult = checkPreferredLabelInAltLabels(givenPreferredLabel, givenAltLabels);

    // THEN both language keys should be reported as missing
    expect(actualResult).toEqual(new Set([EN.dbKeyName, FR.dbKeyName]));
  });

  test("should skip languages whose preferred label value is empty", () => {
    // GIVEN a preferredLabel with an empty EN value
    const givenPreferredLabel: ITranslatedStringDoc = new Map([
      [EN.dbKeyName as LanguageAPISpecs.Types.LanguageDbKeyName, ""],
    ]);
    // AND altLabels that do not contain an empty string
    const givenAltLabels = [new Map([[EN.dbKeyName as LanguageAPISpecs.Types.LanguageDbKeyName, "other"]])];

    // WHEN checkPreferredLabelInAltLabels is called with the given preferred label and alt labels
    const actualResult = checkPreferredLabelInAltLabels(givenPreferredLabel, givenAltLabels);

    // THEN the empty label should be skipped and nothing should be reported as missing
    expect(actualResult.size).toBe(0);
  });

  test("should return an empty set when altLabels is empty and preferredLabel is also empty", () => {
    // GIVEN a preferredLabel with an empty EN value
    const givenPreferredLabel: ITranslatedStringDoc = new Map([
      [EN.dbKeyName as LanguageAPISpecs.Types.LanguageDbKeyName, ""],
    ]);

    // WHEN checkPreferredLabelInAltLabels is called with an empty alt labels array
    const actualResult = checkPreferredLabelInAltLabels(givenPreferredLabel, []);

    // THEN nothing should be reported as missing
    expect(actualResult.size).toBe(0);
  });

  test("should return the language key when altLabels is empty but the preferred label is non-empty", () => {
    // GIVEN a non-empty preferredLabel in EN
    const givenPreferredLabel: ITranslatedStringDoc = new Map([
      [EN.dbKeyName as LanguageAPISpecs.Types.LanguageDbKeyName, "hello"],
    ]);

    // WHEN checkPreferredLabelInAltLabels is called with an empty alt labels array
    const actualResult = checkPreferredLabelInAltLabels(givenPreferredLabel, []);

    // THEN EN should be reported as missing
    expect(actualResult).toEqual(new Set([EN.dbKeyName]));
  });
});
