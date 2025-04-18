import mongoose from "mongoose";
import { isSpecified } from "server/isUnspecified";
import { stringRequired } from "server/stringRequired";
import { RegExp_UUIDv4 } from "server/regex";
import { ObjectTypes } from "./objectTypes";

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
export const DESCRIPTION_MAX_LENGTH = 4000;

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
export const ATL_LABELS_MAX_ITEMS = 100;
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
const REGEX_ISCO_GROUP_CODE = RegExp(/(^\d{1,4}$)/);

// Local code has to start with one or more letters and can be followed by a number
// - WHEN the Local Group doesnt have any parents it will have a code that starts with one or more letters followed by one or more digits
// - WHEN the Local Group has a parent that is an ISCO Group it will have a code that starts with the parent code and has one or more letters followed by one or more digits
// - WHEN the Local Group has a parent that is a Local Group it will have a code that starts with the parent code and has one or more letters or one or more digits
// for more information about the rules concerning occupationGroup codes, see backend/taxonomy-hierarchy.md
const REGEX_LOCAL_GROUP_CODE = RegExp(/^(?:\d{1,4})?[a-zA-Z]+[a-zA-Z\d]*$/);

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
export const RegExESCOOccupationCode = RegExp(/^\d{4}(?:\.\d+)+$/);

// ESCO Local Occupation Code
export const RegExESCOLocalOccupationCode = RegExp(/^\d{4}(?:\.\d+)*(?:_\d+)+$/);

// Local Occupation Code
export const RegExLocalOccupationCode = RegExp(/(^[a-zA-Z\d]+)(?:_\d+)+$/);

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

// Import ID
export const IMPORT_ID_MAX_LENGTH = 256;

export const ImportIDProperty: mongoose.SchemaDefinitionProperty<string> = {
  type: String,
  required: stringRequired("importId"),
  maxlength: [IMPORT_ID_MAX_LENGTH, `importId must be at most 256 chars long`],
};
