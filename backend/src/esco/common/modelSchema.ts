import mongoose from "mongoose";
import { isSpecified } from "server/isUnspecified";
import { stringRequired } from "server/stringRequired";
import { RegExp_UUIDv4 } from "server/regex";
import { ObjectTypes } from "./objectTypes";
import { EntityEmbeddingStatus } from "embeddings/entityEmbeddings/entityEmbedding.types";
import LanguageAPISpecs from "api-specifications/language";
import { getFallbackLanguageConfig } from "common/language/fallbackLanguage";

// check for unique values in an array
export function hasUniqueValues<T>(value: T[]) {
  // Remove duplicates and check if the array length is the same
  return value.length === new Set<T>(value).size;
}

// Regulated ProfessionNote
export const REGULATED_PROFESSION_NOTE_MAX_LENGTH = 4000;

export const RegulatedProfessionNoteProperty: mongoose.SchemaDefinitionProperty<string> = {
  type: String,
  required: stringRequired("regulatedProfessionNote"),
  maxlength: [
    REGULATED_PROFESSION_NOTE_MAX_LENGTH,
    `RegulatedProfessionNote must be at most ${REGULATED_PROFESSION_NOTE_MAX_LENGTH} chars long`,
  ],
};

// Description
export const DESCRIPTION_MAX_LENGTH = 6000;

export const DescriptionProperty: mongoose.SchemaDefinitionProperty<string> = {
  type: String,
  required: stringRequired("description"),
  maxlength: [DESCRIPTION_MAX_LENGTH, `Description must be at most ${DESCRIPTION_MAX_LENGTH} chars long`],
};

// Scope Note

export const SCOPE_NOTE_MAX_LENGTH = 4000;
export const ScopeNoteProperty: mongoose.SchemaDefinitionProperty<string> = {
  type: String,
  required: stringRequired("scopeNote"),
  maxlength: [SCOPE_NOTE_MAX_LENGTH, `ScopeNote must be at most ${SCOPE_NOTE_MAX_LENGTH} chars long`],
};

// Definition
export const DEFINITION_MAX_LENGTH = 4000;

export const DefinitionProperty: mongoose.SchemaDefinitionProperty<string> = {
  type: String,
  required: stringRequired("definition"),
  maxlength: [DEFINITION_MAX_LENGTH, `Definition must be at most ${DEFINITION_MAX_LENGTH} chars long`],
};

// Preferred Label
export const LABEL_MAX_LENGTH = 256;
export const PreferredLabelProperty: mongoose.SchemaDefinitionProperty<string> = {
  type: String,
  required: true,
  maxlength: [LABEL_MAX_LENGTH, `PreferredLabel must be at most ${LABEL_MAX_LENGTH} chars long`],
  validate: isSpecified,
};

// Alt Labels
export const ATL_LABELS_MAX_ITEMS = 200;
export const AltLabelsProperty: mongoose.SchemaDefinitionProperty<string[]> = {
  type: [String],
  required: true,
  maxlength: [LABEL_MAX_LENGTH, `AltLabel must be at most ${LABEL_MAX_LENGTH} chars long`],
  default: undefined,
  validate: (value: string[]) => {
    if (value.length > ATL_LABELS_MAX_ITEMS) {
      throw new Error(`AltLabels must be at most ${ATL_LABELS_MAX_ITEMS} items`);
    }

    if (!Array.isArray(value)) {
      throw new Error("AltLabels must be an array");
    }

    if (
      value.length > 0 &&
      value.every((item: string) => {
        const trimmed = item.trim();
        return trimmed.length === 0 || trimmed.length > LABEL_MAX_LENGTH;
      })
    ) {
      throw new Error("AltLabels must be an array of valid strings");
    }
    if (!hasUniqueValues(value)) {
      throw new Error("Duplicate altLabel found");
    }
    return true;
  },
};

// UUIDHistory
export const UUID_HISTORY_MAX_ITEMS = 10000;
export const UUIDHistoryProperty: mongoose.SchemaDefinitionProperty<string[]> = {
  type: [String],
  required: true,
  default: undefined,
  validate: (value: string[]) => {
    if (!Array.isArray(value)) {
      throw new Error("UUIDHistory must be an array");
    }
    if (value.length > UUID_HISTORY_MAX_ITEMS) {
      throw new Error(`UUIDHistory can be no larger than ${UUID_HISTORY_MAX_ITEMS} items`);
    }

    if (value.length <= 0) {
      throw new Error("UUIDHistory must be a non empty array");
    }

    if (!value.every((uuid: string) => RegExp_UUIDv4.test(uuid))) {
      throw new Error("UUIDHistory must be an array of valid UUIDs");
    }

    if (!hasUniqueValues(value)) {
      throw new Error("Duplicate UUID found");
    }
    return true;
  },
};

// Available Languages
//
// The languages a model carries data in, as the short codes of the languages of the registry. It is a path of the
// ModelInfo, not of an entity: an entity carries a translated value per language, the model declares which languages
// those values are expected in. It is orthogonal to the locale of the model, which is a country or a market.
export const AvailableLanguagesProperty: mongoose.SchemaDefinitionProperty<string[]> = {
  type: [String],
  required: true,
  default: undefined,
  validate: (value: string[]) => {
    if (!Array.isArray(value)) {
      throw new Error("AvailableLanguages must be an array");
    }
    if (value.length <= 0) {
      throw new Error("AvailableLanguages must be a non empty array");
    }
    if (value.length > LanguageAPISpecs.Constants.Languages.length) {
      throw new Error(
        `AvailableLanguages must be at most ${LanguageAPISpecs.Constants.Languages.length} items, one per registered language`
      );
    }
    const unsupportedShortCode = value.find(
      (shortCode: string) => !LanguageAPISpecs.Helpers.isSupportedLanguage(shortCode)
    );
    if (unsupportedShortCode !== undefined) {
      throw new Error(`AvailableLanguages has an unsupported language '${unsupportedShortCode}'`);
    }
    if (!hasUniqueValues(value)) {
      throw new Error("Duplicate availableLanguage found");
    }
    return true;
  },
};

// Origin Uri
export const ORIGIN_URI_MAX_LENGTH = 4096;
export const OriginUriProperty: mongoose.SchemaDefinitionProperty<string> = {
  type: String,
  required: stringRequired("originUri"),
  maxlength: [ORIGIN_URI_MAX_LENGTH, `originUri must be at most ${ORIGIN_URI_MAX_LENGTH} chars long`],
  validate: function (value: string): boolean {
    return value.length === 0 || (value.length > 0 && value.trim().length > 0);
  },
};

// ISCO Code can contain a number from 1 to 4 digits,
const REGEX_ISCO_GROUP_CODE = new RegExp(/(^\d{1,4}$)/);

// Local code has to start with one or more letters and can be followed by a number
// - WHEN the Local Group doesnt have any parents it will have a code that starts with one or more letters followed by one or more digits
// - WHEN the Local Group has a parent that is an ISCO Group it will have a code that starts with the parent code and has one or more letters followed by one or more digits
// - WHEN the Local Group has a parent that is a Local Group it will have a code that starts with the parent code and has one or more letters or one or more digits
// for more information about the rules concerning occupationGroup codes, see backend/taxonomy-hierarchy.md
const REGEX_LOCAL_GROUP_CODE = new RegExp(/^(?:\d{1,4})?[a-zA-Z]+[a-zA-Z\d]*$/);

export const OccupationGroupCodeProperty: mongoose.SchemaDefinitionProperty<string> = {
  type: String,
  required: true,
  validate: {
    validator: function (value: string) {
      // @ts-ignore
      switch (this.groupType) {
        case ObjectTypes.ISCOGroup:
          return REGEX_ISCO_GROUP_CODE.test(value);
        case ObjectTypes.LocalGroup:
          return REGEX_LOCAL_GROUP_CODE.test(value);
        default:
          // since the occupationModel doesn't have a groupType field, we can't check it
          // the best we can do is to check if the value is a valid ISCO or Local Group code
          return REGEX_ISCO_GROUP_CODE.test(value) || REGEX_LOCAL_GROUP_CODE.test(value);
      }
    },
  },
};

// for more information about the rules concerning occupation codes, see backend/taxonomy-hierarchy.md
// ESCO Occupation Code
export const RegExESCOOccupationCode = new RegExp(/^\d{4}(?:\.\d+)+$/);

// ESCO Local Occupation Code
export const RegExESCOLocalOccupationCode = new RegExp(/^\d{4}(?:\.\d+)*(?:_\d+)+$/);

// Local Occupation Code
export const RegExLocalOccupationCode = new RegExp(/(^[a-zA-Z\d]+)(?:_\d+)+$/);

export const OccupationCodeProperty: mongoose.SchemaDefinitionProperty<string> = {
  type: String,
  required: true,
  validate: {
    validator: function (value: string) {
      // @ts-ignore
      switch (this.occupationType) {
        case ObjectTypes.ESCOOccupation:
          return RegExESCOOccupationCode.test(value);
        case ObjectTypes.LocalOccupation:
          return RegExESCOLocalOccupationCode.test(value) || RegExLocalOccupationCode.test(value);
        default:
          throw new Error("Value of 'occupationType' path is not supported");
      }
    },
  },
};

// Embedding Status
// is A map of embeddingServiceId -> status of the embeddings generation of the entity for that embedding service.
// The path is absent (instead of an empty map) until an embedding process touches the entity for the first time.
export const EmbeddingStatusProperty: mongoose.SchemaDefinitionProperty<Map<string, EntityEmbeddingStatus>> = {
  type: Map,
  of: { type: String, enum: Object.values(EntityEmbeddingStatus) },
  required: false,
  default: undefined,
};

// Import ID
export const IMPORT_ID_MAX_LENGTH = 256;

export const ImportIDProperty: mongoose.SchemaDefinitionProperty<string> = {
  type: String,
  required: stringRequired("importId"),
  maxlength: [IMPORT_ID_MAX_LENGTH, `importId must be at most 256 chars long`],
};

/** The options of a translated property */
export type TranslatedPropertyOptions = {
  /** The name of the path, it is used in the error messages, e.g. "preferredLabel" */
  fieldName: string;
  /** The maximum length that the value of a single language may have */
  maxLength: number;
  /** Whether a language may be translated to an empty value, it defaults to true */
  allowEmptyValues?: boolean;
};

/** The options of a translated array property */
export type TranslatedArrayPropertyOptions = TranslatedPropertyOptions & {
  /** The maximum number of items that the list may have */
  maxItems: number;
};

/**
 * Reads the entries of a translated value.
 * Mongoose hydrates a translated path as a Map, a plain object is what a test or a lean query holds, both are handled.
 */
function getTranslatedEntries(value: unknown, fieldName: string): [string, unknown][] {
  if (value instanceof Map) {
    return [...value.entries()];
  }
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return Object.entries(value as Record<string, unknown>);
  }
  throw new Error(`${fieldName} must be a translated object`);
}

/**
 * Validates a single translated value, i.e. that it carries the fall back language, that every key is a language of
 * the registry and that the value of every language respects the maximum length of the path.
 */
function validateTranslatedValue(value: unknown, options: Required<TranslatedPropertyOptions>): void {
  const { fieldName, maxLength, allowEmptyValues } = options;
  const entries = getTranslatedEntries(value, fieldName);
  const fallbackDbKeyName = getFallbackLanguageConfig().dbKeyName;

  if (!entries.some(([dbKeyName]) => dbKeyName === fallbackDbKeyName)) {
    throw new Error(`${fieldName} must be translated in the fallback language '${fallbackDbKeyName}'`);
  }

  entries.forEach(([dbKeyName, languageValue]) => {
    if (LanguageAPISpecs.Constants.Languages.every((language) => language.dbKeyName !== dbKeyName)) {
      throw new Error(`${fieldName} has an unsupported language '${dbKeyName}'`);
    }
    if (typeof languageValue !== "string") {
      throw new Error(`${fieldName} must be a string for the language '${dbKeyName}'`);
    }
    if (languageValue.length > maxLength) {
      throw new Error(`${fieldName} must be at most ${maxLength} chars long for the language '${dbKeyName}'`);
    }
    if (!allowEmptyValues && languageValue.trim().length === 0) {
      throw new Error(`${fieldName} must not be empty for the language '${dbKeyName}'`);
    }
  });
}

/**
 * Builds a translated String path, the translated counterpart of a `type: String` path.
 * @param options the name of the path, the per language maximum length and whether an empty value is allowed
 */
export function TranslatedStringProperty(
  options: TranslatedPropertyOptions
): mongoose.SchemaDefinitionProperty<Map<string, string>> {
  const resolvedOptions: Required<TranslatedPropertyOptions> = { allowEmptyValues: true, ...options };
  return {
    type: Map,
    of: String,
    required: true,
    validate: (value: Map<string, string>) => {
      validateTranslatedValue(value, resolvedOptions);
      return true;
    },
  };
}

/**
 * Builds a translated [String] path, the translated counterpart of a `type: [String]` path.
 * Every item of the list is a translated value of its own, and the values of a given language are unique across the
 * items, so that a language never carries the same alternative label twice.
 *
 * @param options the name of the path, the per language maximum length and the maximum number of items
 */
export function TranslatedStringArrayProperty(
  options: TranslatedArrayPropertyOptions
): mongoose.SchemaDefinitionProperty<Map<string, string>[]> {
  const resolvedOptions: Required<TranslatedArrayPropertyOptions> = { allowEmptyValues: false, ...options };
  const { fieldName, maxItems } = resolvedOptions;
  return {
    type: [{ type: Map, of: String }],
    required: true,
    default: undefined,
    validate: (value: Map<string, string>[]) => {
      if (!Array.isArray(value)) {
        throw new Error(`${fieldName} must be an array`);
      }
      if (value.length > maxItems) {
        throw new Error(`${fieldName} must be at most ${maxItems} items`);
      }

      const seenValuesPerLanguage = new Map<string, Set<string>>();
      value.forEach((item) => {
        validateTranslatedValue(item, resolvedOptions);
        getTranslatedEntries(item, fieldName).forEach(([dbKeyName, languageValue]) => {
          const seenValues = seenValuesPerLanguage.get(dbKeyName) ?? new Set<string>();
          if (seenValues.has(languageValue as string)) {
            throw new Error(`Duplicate ${fieldName} found for the language '${dbKeyName}'`);
          }
          seenValues.add(languageValue as string);
          seenValuesPerLanguage.set(dbKeyName, seenValues);
        });
      });
      return true;
    },
  };
}

export const TranslatedPreferredLabelProperty = TranslatedStringProperty({
  fieldName: "preferredLabel",
  maxLength: LABEL_MAX_LENGTH,
  allowEmptyValues: false,
});

export const TranslatedDescriptionProperty = TranslatedStringProperty({
  fieldName: "description",
  maxLength: DESCRIPTION_MAX_LENGTH,
});

export const TranslatedDefinitionProperty = TranslatedStringProperty({
  fieldName: "definition",
  maxLength: DEFINITION_MAX_LENGTH,
});

export const TranslatedScopeNoteProperty = TranslatedStringProperty({
  fieldName: "scopeNote",
  maxLength: SCOPE_NOTE_MAX_LENGTH,
});

export const TranslatedRegulatedProfessionNoteProperty = TranslatedStringProperty({
  fieldName: "regulatedProfessionNote",
  maxLength: REGULATED_PROFESSION_NOTE_MAX_LENGTH,
});

export const TranslatedAltLabelsProperty = TranslatedStringArrayProperty({
  fieldName: "altLabels",
  maxLength: LABEL_MAX_LENGTH,
  maxItems: ATL_LABELS_MAX_ITEMS,
});
