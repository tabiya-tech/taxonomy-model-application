import LanguageAPISpecs from "api-specifications/language";

/**
 * The key of a language inside a translated value, e.g. "en" | "fr".
 *
 * It is derived from the language registry of the api-specifications, so that a key that is not a language of the
 * registry is a compile time error, and so that adding a language to the registry is picked up everywhere at once.
 */
export type TranslatedStringKey = LanguageAPISpecs.Types.LanguageDbKeyName;

/**
 * A translated value as it is stored in and hydrated from the database, e.g. { en: "Cook", fr: "Cuisinier" }.
 *
 * It is the Map counterpart of LanguageAPISpecs.Types.ITranslatedString, which is the plain object that the API
 * carries: mongoose hydrates a translated path as a Map, keyed by the dbKeyName of the languages of the registry.
 * A language that is not translated is an absent key, it is not an empty value.
 */
export type ITranslatedStringDoc = Map<TranslatedStringKey, string>;

/**
 * A list of translated values as it is stored in and hydrated from the database, e.g. the altLabels of an entity.
 *
 * It is the Map counterpart of LanguageAPISpecs.Types.ITranslatedStringArray.
 */
export type ITranslatedStringArrayDoc = ITranslatedStringDoc[];
