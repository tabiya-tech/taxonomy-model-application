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
    /** The key of the language inside a translated sub-document, e.g. "fr" */
    dbKeyName: string;
    /** The suffix of the CSV columns that carry this language, e.g. "FR" */
    csvSuffix: string;
  };

  /** The short codes of the languages in the registry, e.g. "en" | "fr" */
  export type LanguageShortCode = (typeof LanguageConstants.Languages)[number]["shortCode"];

  /** The translated sub-document keys of the languages in the registry, e.g. "en" | "fr" */
  export type LanguageDbKeyName = (typeof LanguageConstants.Languages)[number]["dbKeyName"];

  /** The CSV column suffixes of the languages in the registry, e.g. "EN" | "FR" */
  export type LanguageCsvSuffix = (typeof LanguageConstants.Languages)[number]["csvSuffix"];

  /** The payload of a language configuration as it is carried by the API */
  export type Payload = ILanguageConfig;

  /**
   * A value that is translated in one or more languages, e.g. { en: "Cook", fr: "Cuisinier" }.
   *
   * The keys are the dbKeyName of the languages of the registry, they are not locales. A language that is not
   * translated is an absent key, it is not an empty string.
   */
  export type ITranslatedString = Record<string, string>;

  /**
   * A list of translated values, e.g. the altLabels of an entity.
   *
   * Every item is a translated value of its own, so that the nth alternative label is the same alternative label in
   * every language.
   */
  export type ITranslatedStringArray = ITranslatedString[];

  /**
   * The options of the translated string schema factory.
   */
  export type ITranslatedStringSchemaOptions = {
    /** The description of the translated value, it is repeated for every language of the registry */
    description: string;
    /** The maximum length that the value of a single language may have */
    maxLength: number;
    /** The pattern that the value of a single language must match, e.g. RegExp_Str_NotEmptyString */
    pattern?: string;
    /** Whether the value of the fall back language is required, it defaults to false */
    required?: boolean;
  };

  /**
   * The options of the translated string array schema factory.
   *
   * There is no "required" option: every item of a list carries the fall back language, always, because an item that
   * is not translated in it cannot be served to a client that asks for a language the item does not have. The database
   * enforces the same rule, see TranslatedStringArrayProperty in the backend.
   */
  export type ITranslatedStringArraySchemaOptions = Omit<ITranslatedStringSchemaOptions, "required"> & {
    /** The maximum number of items that the list may have */
    maxItems: number;
  };
}

export default LanguageTypes;
