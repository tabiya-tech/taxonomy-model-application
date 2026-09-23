import ImportAPISpecs from "api-specifications/import";
import LanguageAPISpecs from "api-specifications/language";
import errorLogger from "common/errorLogger/errorLogger";
import { getFallbackLanguageConfig } from "common/language/fallbackLanguage";
import { readCSVHeadersFromUrl } from "./readCSVHeaders";

type ImportFileType = ImportAPISpecs.Constants.ImportFileTypes;
type ILanguageConfig = LanguageAPISpecs.Types.ILanguageConfig;

/**
 * The languages each entity file of an import is imported in, keyed by the type of the file.
 */
export type ImportFileLanguages = Partial<Record<ImportFileType, LanguageAPISpecs.Types.LanguageShortCode[]>>;

/**
 * The columns of the entity files that carry translated values.
 *
 * A column carries a language when it is suffixed with the csvSuffix of the language, e.g. PREFERREDLABEL_FR. A column
 * without a suffix is the outdated format, it carries the fall back language.
 * The hierarchy and the relation files carry no translated values, so they are not validated.
 */
export const TRANSLATABLE_HEADERS: Readonly<Partial<Record<ImportFileType, readonly string[]>>> = Object.freeze({
  [ImportAPISpecs.Constants.ImportFileTypes.OCCUPATION_GROUPS]: ["PREFERREDLABEL", "ALTLABELS", "DESCRIPTION"],
  [ImportAPISpecs.Constants.ImportFileTypes.OCCUPATIONS]: [
    "PREFERREDLABEL",
    "ALTLABELS",
    "DESCRIPTION",
    "DEFINITION",
    "SCOPENOTE",
    "REGULATEDPROFESSIONNOTE",
  ],
  [ImportAPISpecs.Constants.ImportFileTypes.ESCO_SKILL_GROUPS]: [
    "PREFERREDLABEL",
    "ALTLABELS",
    "DESCRIPTION",
    "SCOPENOTE",
  ],
  [ImportAPISpecs.Constants.ImportFileTypes.ESCO_SKILLS]: [
    "PREFERREDLABEL",
    "ALTLABELS",
    "DESCRIPTION",
    "DEFINITION",
    "SCOPENOTE",
  ],
});

type DetectedLanguages = {
  /** The languages of the registry that the suffixed columns carry */
  languages: ILanguageConfig[];
  /** The translatable columns whose suffix is not the csvSuffix of a language of the registry */
  unknownLanguageHeaders: string[];
  /** Whether the file has translatable columns without a suffix, the outdated format */
  hasUnsuffixedHeaders: boolean;
};

/**
 * Detects the languages the translatable columns of a file carry.
 *
 * @param headers the headers of the file, in uppercase
 * @param translatableHeaders the translatable columns of the file, without a suffix
 */
export function detectLanguagesFromHeaders(
  headers: string[],
  translatableHeaders: readonly string[]
): DetectedLanguages {
  const languages: ILanguageConfig[] = [];
  const unknownLanguageHeaders: string[] = [];
  let hasUnsuffixedHeaders = false;

  for (const header of headers) {
    if (translatableHeaders.includes(header)) {
      hasUnsuffixedHeaders = true;
      continue;
    }
    const translatableHeader = translatableHeaders.find((candidate) => header.startsWith(`${candidate}_`));
    if (!translatableHeader) {
      continue; // not a translatable column
    }
    const language = LanguageAPISpecs.Helpers.getLanguageByCsvSuffix(header.substring(translatableHeader.length + 1));
    if (!language) {
      unknownLanguageHeaders.push(header);
    } else if (!languages.includes(language)) {
      languages.push(language);
    }
  }
  return { languages, unknownLanguageHeaders, hasUnsuffixedHeaders };
}

const toShortCodes = (languages: ILanguageConfig[]): string =>
  languages.map((language) => `'${language.shortCode}'`).join(", ");

/**
 * Resolves the languages a file is imported in, and logs every disagreement with the languages the model declares.
 *
 * The file is imported only in the languages it carries that the model also declares:
 * - a declared language the file does not carry is logged as an error,
 * - a language the file carries that the model does not declare is logged as an error, and it is not imported,
 * - a column whose suffix is not a language of the registry is logged as an error, and it is not imported,
 * - a file whose columns carry no suffix (the outdated format) is imported in the fall back language, with a warning.
 *
 * @param fileType the type of the file
 * @param headers the headers of the file, in uppercase
 * @param declaredLanguages the languages the model declares
 * @returns the short codes of the languages the file is imported in
 */
export function resolveFileLanguages(
  fileType: ImportFileType,
  headers: string[],
  declaredLanguages: ILanguageConfig[]
): LanguageAPISpecs.Types.LanguageShortCode[] {
  const translatableHeaders = TRANSLATABLE_HEADERS[fileType];
  if (!translatableHeaders) {
    return []; // the file carries no translated values
  }
  const detected = detectLanguagesFromHeaders(headers, translatableHeaders);

  if (detected.unknownLanguageHeaders.length > 0) {
    const unknownHeaders = detected.unknownLanguageHeaders.join(", ");
    const supportedSuffixes = LanguageAPISpecs.Constants.Languages.map((language) => language.csvSuffix).join(", ");
    errorLogger.logError(
      `The ${fileType} file has the columns ${unknownHeaders} whose suffix is not a supported language. ` +
        `They will not be imported. The supported suffixes are: ${supportedSuffixes}.`
    );
  }

  let fileLanguages = detected.languages;
  if (fileLanguages.length === 0 && detected.hasUnsuffixedHeaders) {
    const fallbackLanguage = getFallbackLanguageConfig();
    errorLogger.logWarning(
      `The ${fileType} file uses an outdated format: its columns have no language suffix, so they are imported in the fall back language '${fallbackLanguage.shortCode}'. ` +
        `Kindly suffix the columns with the language they carry, e.g. PREFERREDLABEL_${fallbackLanguage.csvSuffix}.`
    );
    fileLanguages = [fallbackLanguage];
  }

  const undeclaredLanguages = fileLanguages.filter((language) => !declaredLanguages.includes(language));
  if (undeclaredLanguages.length > 0) {
    errorLogger.logError(
      `The ${fileType} file carries data in ${toShortCodes(undeclaredLanguages)} that the model does not declare ` +
        `(the model declares ${toShortCodes(declaredLanguages)}). That data will not be imported. ` +
        `Add the language to the LANGUAGES column of the model_info.csv file to import it.`
    );
  }

  const missingLanguages = declaredLanguages.filter((language) => !fileLanguages.includes(language));
  if (missingLanguages.length > 0) {
    errorLogger.logError(
      `The ${fileType} file carries no data in ${toShortCodes(missingLanguages)} that the model declares. ` +
        `Add the columns suffixed with the language, e.g. PREFERREDLABEL_${missingLanguages[0].csvSuffix}, to import it.`
    );
  }

  return fileLanguages
    .filter((language) => declaredLanguages.includes(language))
    .map((language) => language.shortCode as LanguageAPISpecs.Types.LanguageShortCode);
}

/**
 * Resolves the languages the model declares, as entries of the registry.
 *
 * A model that declares no language (the outdated format) is imported in the fall back language, with a warning.
 * A short code that is not a language of the registry is ignored.
 *
 * @param availableLanguages the short codes of the languages the model declares
 */
export function resolveDeclaredLanguages(availableLanguages: string[] | undefined): ILanguageConfig[] {
  const declaredLanguages = (availableLanguages ?? [])
    .map((shortCode) => LanguageAPISpecs.Helpers.getLanguageByShortCode(shortCode))
    .filter((language): language is ILanguageConfig => language !== undefined);

  if (declaredLanguages.length === 0) {
    const fallbackLanguage = getFallbackLanguageConfig();
    errorLogger.logWarning(
      `The model uses an outdated format: it does not declare the languages it carries data in, so it is imported in the fall back language '${fallbackLanguage.shortCode}'. ` +
        `Kindly declare the languages in the LANGUAGES column of the model_info.csv file.`
    );
    return [fallbackLanguage];
  }
  return declaredLanguages;
}

/**
 * Validates the languages of the entity files of an import against the languages the model declares.
 *
 * It only reads the header row of each entity file, before the files are parsed. A disagreement does not stop the
 * import, it is logged in the errorLogger, and so it is surfaced in the parsingErrors / parsingWarnings of the import
 * process state, and every file is imported in the languages it carries that the model also declares.
 *
 * @param availableLanguages the short codes of the languages the model declares
 * @param downloadUrls the download URLs of the files, keyed by the type of the file
 * @returns the languages each entity file is imported in
 */
export async function validateImportLanguages(
  availableLanguages: string[] | undefined,
  downloadUrls: ImportAPISpecs.Types.POST.Request.ImportFilePaths
): Promise<ImportFileLanguages> {
  const declaredLanguages = resolveDeclaredLanguages(availableLanguages);
  const fileLanguages: ImportFileLanguages = {};

  for (const [fileType, url] of Object.entries(downloadUrls) as [ImportFileType, string | undefined][]) {
    if (!url || !TRANSLATABLE_HEADERS[fileType]) {
      continue;
    }
    let headers: string[];
    try {
      headers = await readCSVHeadersFromUrl(url);
    } catch (e: unknown) {
      errorLogger.logError(new Error(`Failed to validate the languages of the ${fileType} file`, { cause: e }));
      continue;
    }
    fileLanguages[fileType] = resolveFileLanguages(fileType, headers, declaredLanguages);
  }
  return fileLanguages;
}
