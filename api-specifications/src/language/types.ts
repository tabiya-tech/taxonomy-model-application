import LanguageConstants from "./constants";

/**
 * The types of the language registry.
 *
 * The registry itself lives in ./constants.ts. The union types below are derived from it, so that a language that is
 * not in the registry is a compile time error wherever the code uses a literal.
 */
namespace LanguageTypes {
  // This is here to make sure the namespace is not empty and the:
  //    "Cannot use 'export import' on a type or type-only namespace when the '--isolatedModules' flag is provided"
  // error is not thrown.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = 0;
  // ---

  /**
   * The configuration of a language that the platform knows about.
   *
   * A language is a translation language, it is not a locale. Locales are data that a model author picks from a list
   * that is served at runtime, see the locale module. Languages are compiled into this package, see ./README.md.
   */
  export type ILanguageConfig = {
    /** The human readable name of the language, e.g. "French" */
    name: string;
    /** The code the client sends in the Accept-Language header, e.g. "fr" */
    shortCode: string;
    /** The key of the language inside a localized sub-document, e.g. "fr" */
    dbKeyName: string;
    /** The suffix of the CSV columns that carry this language, e.g. "FR" */
    csvSuffix: string;
  };

  /** The short codes of the languages in the registry, e.g. "en" | "fr" */
  export type LanguageShortCode = (typeof LanguageConstants.Languages)[number]["shortCode"];

  /** The localized sub-document keys of the languages in the registry, e.g. "en" | "fr" */
  export type LanguageDbKeyName = (typeof LanguageConstants.Languages)[number]["dbKeyName"];

  /** The CSV column suffixes of the languages in the registry, e.g. "EN" | "FR" */
  export type LanguageCsvSuffix = (typeof LanguageConstants.Languages)[number]["csvSuffix"];

  /** The payload of a language configuration as it is carried by the API */
  export type Payload = ILanguageConfig;
}

export default LanguageTypes;
