// mute the console during the test
import "_test_utilities/consoleMock";

jest.mock("./readCSVHeaders", () => ({
  readCSVHeadersFromUrl: jest.fn(),
}));

import ImportAPISpecs from "api-specifications/import";
import LanguageAPISpecs from "api-specifications/language";
import errorLogger from "common/errorLogger/errorLogger";
import { setConfiguration } from "server/config/config";
import { readCSVHeadersFromUrl } from "./readCSVHeaders";
import {
  detectLanguagesFromHeaders,
  resolveDeclaredLanguages,
  resolveFileLanguages,
  TRANSLATABLE_HEADERS,
  validateImportLanguages,
} from "./validateImportLanguages";

const getLanguage = (shortCode: string) => LanguageAPISpecs.Helpers.getLanguageByShortCode(shortCode)!;
const ENGLISH = getLanguage("en");
const FRENCH = getLanguage("fr");
const SPANISH = getLanguage("es");

const SKILLS = ImportAPISpecs.Constants.ImportFileTypes.ESCO_SKILLS;
const SKILL_TRANSLATABLE_HEADERS = TRANSLATABLE_HEADERS[SKILLS]!;

describe("test the validation of the import languages", () => {
  beforeAll(() => {
    jest.spyOn(errorLogger, "logError");
    jest.spyOn(errorLogger, "logWarning");
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // the environment falls back to english
    // @ts-ignore
    setConfiguration({ fallbackLanguage: ENGLISH.shortCode });
  });

  afterAll(() => {
    // @ts-ignore
    setConfiguration(undefined);
  });

  describe("test detectLanguagesFromHeaders()", () => {
    test("should detect the languages of the suffixed translatable columns", () => {
      // GIVEN the headers of a file with columns suffixed with english and french
      const givenHeaders = ["ID", "PREFERREDLABEL_EN", "PREFERREDLABEL_FR", "ALTLABELS_EN", "ALTLABELS_FR", "CODE"];

      // WHEN detecting the languages of the headers
      const actualDetected = detectLanguagesFromHeaders(givenHeaders, SKILL_TRANSLATABLE_HEADERS);

      // THEN expect english and french to be detected once each, in the order they appear
      expect(actualDetected).toEqual({
        languages: [ENGLISH, FRENCH],
        unknownLanguageHeaders: [],
        hasUnsuffixedHeaders: false,
      });
    });

    test("should report the translatable columns whose suffix is not a language of the registry", () => {
      // GIVEN the headers of a file with a column suffixed with an unknown language
      const givenUnknownHeader = "PREFERREDLABEL_XX";
      const givenHeaders = ["ID", "PREFERREDLABEL_EN", givenUnknownHeader];

      // WHEN detecting the languages of the headers
      const actualDetected = detectLanguagesFromHeaders(givenHeaders, SKILL_TRANSLATABLE_HEADERS);

      // THEN expect the unknown column to be reported
      expect(actualDetected.unknownLanguageHeaders).toEqual([givenUnknownHeader]);
      // AND only english to be detected
      expect(actualDetected.languages).toEqual([ENGLISH]);
    });

    test("should report the translatable columns without a suffix", () => {
      // GIVEN the headers of a file in the outdated format
      const givenHeaders = ["ID", "PREFERREDLABEL", "ALTLABELS", "DESCRIPTION"];

      // WHEN detecting the languages of the headers
      const actualDetected = detectLanguagesFromHeaders(givenHeaders, SKILL_TRANSLATABLE_HEADERS);

      // THEN expect the unsuffixed columns to be reported
      expect(actualDetected).toEqual({
        languages: [],
        unknownLanguageHeaders: [],
        hasUnsuffixedHeaders: true,
      });
    });

    test("should ignore the columns that are not translatable", () => {
      // GIVEN the headers of a file with only columns that are not translatable, one of them with an underscore
      const givenHeaders = ["ID", "ORIGINURI", "UUIDHISTORY", "SKILLTYPE", "SOME_COLUMN"];

      // WHEN detecting the languages of the headers
      const actualDetected = detectLanguagesFromHeaders(givenHeaders, SKILL_TRANSLATABLE_HEADERS);

      // THEN expect nothing to be detected
      expect(actualDetected).toEqual({
        languages: [],
        unknownLanguageHeaders: [],
        hasUnsuffixedHeaders: false,
      });
    });
  });

  describe("test resolveFileLanguages()", () => {
    test("should import the file in every declared language when the file carries all of them", () => {
      // GIVEN a model that declares english and french
      const givenDeclaredLanguages = [ENGLISH, FRENCH];
      // AND a skills file that carries english and french
      const givenHeaders = ["ID", "PREFERREDLABEL_EN", "PREFERREDLABEL_FR"];

      // WHEN resolving the languages of the file
      const actualLanguages = resolveFileLanguages(SKILLS, givenHeaders, givenDeclaredLanguages);

      // THEN expect the file to be imported in english and french
      expect(actualLanguages).toEqual([ENGLISH.shortCode, FRENCH.shortCode]);
      // AND no error or warning to have been logged
      expect(errorLogger.logError).not.toHaveBeenCalled();
      expect(errorLogger.logWarning).not.toHaveBeenCalled();
    });

    test("should log an error and not import a language the model does not declare", () => {
      // GIVEN a model that declares only english
      const givenDeclaredLanguages = [ENGLISH];
      // AND a skills file that carries english and french
      const givenHeaders = ["ID", "PREFERREDLABEL_EN", "PREFERREDLABEL_FR"];

      // WHEN resolving the languages of the file
      const actualLanguages = resolveFileLanguages(SKILLS, givenHeaders, givenDeclaredLanguages);

      // THEN expect the file to be imported only in english
      expect(actualLanguages).toEqual([ENGLISH.shortCode]);
      // AND an actionable error naming the file and the undeclared language to have been logged
      expect(errorLogger.logError).toHaveBeenCalledTimes(1);
      expect(errorLogger.logError).toHaveBeenCalledWith(
        expect.stringContaining(`${SKILLS} file carries data in '${FRENCH.shortCode}' that the model does not declare`)
      );
      expect(errorLogger.logError).toHaveBeenCalledWith(
        expect.stringContaining("LANGUAGES column of the model_info.csv")
      );
      expect(errorLogger.logWarning).not.toHaveBeenCalled();
    });

    test("should log an error and continue with the languages it carries when the file misses a declared language", () => {
      // GIVEN a model that declares english and french
      const givenDeclaredLanguages = [ENGLISH, FRENCH];
      // AND a skills file that carries only english
      const givenHeaders = ["ID", "PREFERREDLABEL_EN", "ALTLABELS_EN"];

      // WHEN resolving the languages of the file
      const actualLanguages = resolveFileLanguages(SKILLS, givenHeaders, givenDeclaredLanguages);

      // THEN expect the file to be imported only in english
      expect(actualLanguages).toEqual([ENGLISH.shortCode]);
      // AND an error naming the file and the missing language to have been logged
      expect(errorLogger.logError).toHaveBeenCalledTimes(1);
      expect(errorLogger.logError).toHaveBeenCalledWith(
        expect.stringContaining(`${SKILLS} file carries no data in '${FRENCH.shortCode}'`)
      );
      expect(errorLogger.logError).toHaveBeenCalledWith(expect.stringContaining(`PREFERREDLABEL_${FRENCH.csvSuffix}`));
      expect(errorLogger.logWarning).not.toHaveBeenCalled();
    });

    test("should log an error for the columns whose suffix is not a language of the registry", () => {
      // GIVEN a model that declares english
      const givenDeclaredLanguages = [ENGLISH];
      // AND a skills file with a column suffixed with an unknown language
      const givenUnknownHeader = "PREFERREDLABEL_XX";
      const givenHeaders = ["ID", "PREFERREDLABEL_EN", givenUnknownHeader];

      // WHEN resolving the languages of the file
      const actualLanguages = resolveFileLanguages(SKILLS, givenHeaders, givenDeclaredLanguages);

      // THEN expect the file to be imported in english
      expect(actualLanguages).toEqual([ENGLISH.shortCode]);
      // AND an error naming the unknown column to have been logged
      expect(errorLogger.logError).toHaveBeenCalledTimes(1);
      expect(errorLogger.logError).toHaveBeenCalledWith(expect.stringContaining(givenUnknownHeader));
    });

    test("should import a file in the outdated format in the fall back language of the environment, with a warning", () => {
      // GIVEN the environment falls back to french
      // @ts-ignore
      setConfiguration({ fallbackLanguage: FRENCH.shortCode });
      // AND a model that declares french
      const givenDeclaredLanguages = [FRENCH];
      // AND a skills file whose columns have no language suffix
      const givenHeaders = ["ID", "PREFERREDLABEL", "ALTLABELS", "DESCRIPTION"];

      // WHEN resolving the languages of the file
      const actualLanguages = resolveFileLanguages(SKILLS, givenHeaders, givenDeclaredLanguages);

      // THEN expect the file to be imported in the fall back language of the environment
      expect(actualLanguages).toEqual([FRENCH.shortCode]);
      // AND a warning about the outdated format to have been logged
      expect(errorLogger.logWarning).toHaveBeenCalledTimes(1);
      expect(errorLogger.logWarning).toHaveBeenCalledWith(expect.stringContaining("outdated format"));
      expect(errorLogger.logWarning).toHaveBeenCalledWith(
        expect.stringContaining(`PREFERREDLABEL_${FRENCH.csvSuffix}`)
      );
      // AND no error to have been logged
      expect(errorLogger.logError).not.toHaveBeenCalled();
    });

    test("should log an error when a file in the outdated format misses a declared language", () => {
      // GIVEN a model that declares english and spanish
      const givenDeclaredLanguages = [ENGLISH, SPANISH];
      // AND a skills file whose columns have no language suffix
      const givenHeaders = ["ID", "PREFERREDLABEL"];

      // WHEN resolving the languages of the file
      const actualLanguages = resolveFileLanguages(SKILLS, givenHeaders, givenDeclaredLanguages);

      // THEN expect the file to be imported in the fall back language of the environment
      expect(actualLanguages).toEqual([ENGLISH.shortCode]);
      // AND a warning about the outdated format to have been logged
      expect(errorLogger.logWarning).toHaveBeenCalledTimes(1);
      // AND an error about the missing language to have been logged
      expect(errorLogger.logError).toHaveBeenCalledTimes(1);
      expect(errorLogger.logError).toHaveBeenCalledWith(
        expect.stringContaining(`carries no data in '${SPANISH.shortCode}'`)
      );
    });

    test("should import a file in no language and log an error when the file has no translatable column", () => {
      // GIVEN a model that declares english
      const givenDeclaredLanguages = [ENGLISH];
      // AND a skills file with no translatable column
      const givenHeaders = ["ID", "ORIGINURI"];

      // WHEN resolving the languages of the file
      const actualLanguages = resolveFileLanguages(SKILLS, givenHeaders, givenDeclaredLanguages);

      // THEN expect the file to be imported in no language
      expect(actualLanguages).toEqual([]);
      // AND an error about the missing language to have been logged
      expect(errorLogger.logError).toHaveBeenCalledTimes(1);
      expect(errorLogger.logWarning).not.toHaveBeenCalled();
    });
    test("should import a file that carries no translated values in no language, without logging", () => {
      // GIVEN a model that declares english
      const givenDeclaredLanguages = [ENGLISH];
      // AND the headers of a relation file
      const givenFileType = ImportAPISpecs.Constants.ImportFileTypes.OCCUPATION_SKILL_RELATIONS;
      const givenHeaders = ["OCCUPATIONID", "SKILLID", "RELATIONTYPE"];

      // WHEN resolving the languages of the file
      const actualLanguages = resolveFileLanguages(givenFileType, givenHeaders, givenDeclaredLanguages);

      // THEN expect the file to be imported in no language
      expect(actualLanguages).toEqual([]);
      // AND no error or warning to have been logged
      expect(errorLogger.logError).not.toHaveBeenCalled();
      expect(errorLogger.logWarning).not.toHaveBeenCalled();
    });
  });

  describe("test resolveDeclaredLanguages()", () => {
    test("should return the languages of the registry the model declares", () => {
      // GIVEN a model that declares english and french
      const givenAvailableLanguages = [ENGLISH.shortCode, FRENCH.shortCode];

      // WHEN resolving the declared languages
      const actualLanguages = resolveDeclaredLanguages(givenAvailableLanguages);

      // THEN expect the entries of the registry
      expect(actualLanguages).toEqual([ENGLISH, FRENCH]);
      // AND no warning to have been logged
      expect(errorLogger.logWarning).not.toHaveBeenCalled();
    });

    test("should ignore the short codes that are not languages of the registry", () => {
      // GIVEN a model that declares french and an unknown language
      const givenAvailableLanguages = ["xx", FRENCH.shortCode];

      // WHEN resolving the declared languages
      const actualLanguages = resolveDeclaredLanguages(givenAvailableLanguages);

      // THEN expect only french
      expect(actualLanguages).toEqual([FRENCH]);
    });

    test.each([
      ["undefined", undefined],
      ["empty", []],
      ["only unknown languages", ["xx"]],
    ])(
      "should fall back to the fall back language of the environment, with a warning, when the declared languages are %s",
      (_description, givenAvailableLanguages) => {
        // GIVEN the environment falls back to spanish
        // @ts-ignore
        setConfiguration({ fallbackLanguage: SPANISH.shortCode });

        // WHEN resolving the declared languages
        const actualLanguages = resolveDeclaredLanguages(givenAvailableLanguages);

        // THEN expect the fall back language of the environment
        expect(actualLanguages).toEqual([SPANISH]);
        // AND a warning about the outdated format to have been logged
        expect(errorLogger.logWarning).toHaveBeenCalledTimes(1);
        expect(errorLogger.logWarning).toHaveBeenCalledWith(expect.stringContaining("outdated format"));
      }
    );
  });

  describe("test validateImportLanguages()", () => {
    test("should resolve the languages of every entity file and skip the hierarchy and relation files", async () => {
      // GIVEN a model that declares english and french
      const givenAvailableLanguages = [ENGLISH.shortCode, FRENCH.shortCode];
      // AND the download URLs of an entity file and of a relation file
      const givenDownloadUrls: ImportAPISpecs.Types.POST.Request.ImportFilePaths = {
        [ImportAPISpecs.Constants.ImportFileTypes.ESCO_SKILLS]: "https://foo/skills.csv",
        [ImportAPISpecs.Constants.ImportFileTypes.OCCUPATIONS]: "https://foo/occupations.csv",
        [ImportAPISpecs.Constants.ImportFileTypes.OCCUPATION_SKILL_RELATIONS]: "https://foo/relations.csv",
      };
      // AND the skills file carries english and french, the occupations file only english
      (readCSVHeadersFromUrl as jest.Mock).mockImplementation(async (url: string) => {
        if (url === givenDownloadUrls.ESCO_SKILLS) return ["ID", "PREFERREDLABEL_EN", "PREFERREDLABEL_FR"];
        return ["ID", "PREFERREDLABEL_EN"];
      });

      // WHEN validating the languages of the import
      const actualFileLanguages = await validateImportLanguages(givenAvailableLanguages, givenDownloadUrls);

      // THEN expect the languages of every entity file
      expect(actualFileLanguages).toEqual({
        [ImportAPISpecs.Constants.ImportFileTypes.ESCO_SKILLS]: [ENGLISH.shortCode, FRENCH.shortCode],
        [ImportAPISpecs.Constants.ImportFileTypes.OCCUPATIONS]: [ENGLISH.shortCode],
      });
      // AND the headers of the relation file not to have been read
      expect(readCSVHeadersFromUrl).toHaveBeenCalledTimes(2);
      expect(readCSVHeadersFromUrl).not.toHaveBeenCalledWith(givenDownloadUrls.OCCUPATION_SKILL_RELATIONS);
      // AND an error about the occupations file missing french to have been logged
      expect(errorLogger.logError).toHaveBeenCalledTimes(1);
      expect(errorLogger.logError).toHaveBeenCalledWith(
        expect.stringContaining(`${ImportAPISpecs.Constants.ImportFileTypes.OCCUPATIONS} file carries no data in 'fr'`)
      );
    });

    test("should log an error and continue with the other files when the headers of a file cannot be read", async () => {
      // GIVEN a model that declares english
      const givenAvailableLanguages = [ENGLISH.shortCode];
      // AND the download URLs of two entity files
      const givenDownloadUrls: ImportAPISpecs.Types.POST.Request.ImportFilePaths = {
        [ImportAPISpecs.Constants.ImportFileTypes.ESCO_SKILLS]: "https://foo/skills.csv",
        [ImportAPISpecs.Constants.ImportFileTypes.OCCUPATIONS]: "https://foo/occupations.csv",
      };
      // AND the headers of the skills file cannot be read
      const givenError = new Error("some error");
      (readCSVHeadersFromUrl as jest.Mock).mockImplementation(async (url: string) => {
        if (url === givenDownloadUrls.ESCO_SKILLS) throw givenError;
        return ["ID", "PREFERREDLABEL_EN"];
      });

      // WHEN validating the languages of the import
      const actualFileLanguages = await validateImportLanguages(givenAvailableLanguages, givenDownloadUrls);

      // THEN expect the languages of the occupations file only
      expect(actualFileLanguages).toEqual({
        [ImportAPISpecs.Constants.ImportFileTypes.OCCUPATIONS]: [ENGLISH.shortCode],
      });
      // AND an error caused by the given error to have been logged
      expect(errorLogger.logError).toHaveBeenCalledTimes(1);
      expect(errorLogger.logError).toHaveBeenCalledWith(
        expect.toMatchErrorWithCause(
          `Failed to validate the languages of the ${ImportAPISpecs.Constants.ImportFileTypes.ESCO_SKILLS} file`,
          givenError.message
        )
      );
    });
  });
});
