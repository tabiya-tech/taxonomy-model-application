import mongoose from "mongoose";
import {isSpecified} from "server/isUnspecified";
import {stringRequired} from "server/stringRequired";
import {RegExp_UUIDv4} from "server/regex";

// check for unique values in an array
function hasUniqueValues<T>(value: T[]) {
  // Remove duplicates and check if the array length is the same
  return value.length === new Set<T>(value).size;
}

// Description
export const DESCRIPTION_MAX_LENGTH = 4000;
export const DescriptionProperty: mongoose.SchemaDefinitionProperty<string> = {
  type: String,
  required: stringRequired("description"),
  maxlength: [DESCRIPTION_MAX_LENGTH, `Description must be at most ${DESCRIPTION_MAX_LENGTH} chars long`]
};

// Preferred Label
export const LABEL_MAX_LENGTH = 256;
export const PreferredLabelProperty: mongoose.SchemaDefinitionProperty<string> = {
  type: String,
  required: true,
  maxlength: [LABEL_MAX_LENGTH, `PreferredLabel must be at most ${LABEL_MAX_LENGTH} chars long`],
  validate: isSpecified
};

// Alt Labels
export const ATL_LABELS_MAX_ITEMS = 100;
export const AltLabelsProperty: mongoose.SchemaDefinitionProperty<string[]> = {
  type: [String],
  required: true,
  maxlength: [LABEL_MAX_LENGTH, `AltLabel must be at most ${LABEL_MAX_LENGTH}`],
  default: undefined,
  validate: (value: string[]) => {
    if (!(Array.isArray(value) && value.length <= ATL_LABELS_MAX_ITEMS && value.every((item: string) => {
      const trimmed = item.trim();
      return trimmed.length > 0 && trimmed.length <= LABEL_MAX_LENGTH;
    }))) {
      throw new Error('AltLabels must be an array of non empty strings');
    }

    if (!hasUniqueValues(value)) {
      throw new Error('Duplicate altLabel found');
    }
    return true;
  }
};

// Origin UUID
export const OriginUUIDProperty: mongoose.SchemaDefinitionProperty<string> = {
  type: String, required: stringRequired("originUUID"), validate: function (value: string): boolean {
    return (value.length === 0 || RegExp_UUIDv4.test(value));
  }
};

// ESCO Uri
export const ESCO_URI_MAX_LENGTH = 4096;
export const ESCOUriProperty: mongoose.SchemaDefinitionProperty<string> = {
  type: String,
  required: stringRequired("ESCOUri"),
  maxlength: [ESCO_URI_MAX_LENGTH, `ESCOUri must be at most ${ESCO_URI_MAX_LENGTH}.`],
  validate: function (value: string): boolean {
    return (value.length === 0 || (value.length > 0 && value.trim().length > 0));
  }
};

// ISCO Code
export const RegExISCOCode = RegExp(/^\d{1,4}$/);

export const ISCOCodeProperty: mongoose.SchemaDefinitionProperty<string> = {
  type: String,
  required: true,
  validate: RegExISCOCode
};