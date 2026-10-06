import { escapeRegExp } from "./escapeRegExp";
import { getFallbackLanguageConfig } from "common/language/fallbackLanguage";

/**
 * The search a list endpoint was given: the value to look for and the fields to look for it in.
 */
export interface ISearch {
  value: string;
  fields: string[];
}

/**
 * Builds the $or condition that matches a search value on the requested fields.
 *
 * The value is matched literally (escaped) and case insensitively. A field that is translated is stored as a
 * localized sub document, so it is matched on the path of the given language (e.g. preferredLabel.fr), falling
 * back to the fallback language when none is supplied. $regex matches an array field such as altLabels element
 * wise, so array and scalar fields are handled uniformly.
 *
 * @param search the value to match and the fields to match it on
 * @param translatableFields the fields that are translated, none by default
 * @param language the language dbKeyName to match translatable fields in; defaults to the fallback language
 * @returns the $or condition, to be ANDed with the rest of the match stage
 */
export function buildSearchCondition(
  search: ISearch,
  translatableFields: readonly string[] = [],
  language?: string
): { $or: Record<string, unknown>[] } {
  const escapedValue = escapeRegExp(search.value);
  const dbKeyName = language ?? getFallbackLanguageConfig().dbKeyName;
  return {
    $or: search.fields.map((field) => {
      const path = translatableFields.includes(field) ? `${field}.${dbKeyName}` : field;
      return { [path]: { $regex: escapedValue, $options: "i" } };
    }),
  };
}
