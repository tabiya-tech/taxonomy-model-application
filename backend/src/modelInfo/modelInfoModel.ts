import {isSpecified} from 'server/isUnspecified';
import mongoose from 'mongoose';
import {RegExp_UUIDv4} from "../server/regex";

export const ModelName = "ModelInfo";

export const NAME_MAX_LENGTH = 256;

export const SHORTCODE_MAX_LENGTH = 3;
export const DESCRIPTION_MAX_LENGTH = 4000;

export const RELEASE_NOTES_MAX_LENGTH = 100000;

export const VERSION_MAX_LENGTH = 256;

export function initializeSchemaAndModel(dbConnection: mongoose.Connection): mongoose.Model<IModelInfo> {
  // Schema for Locale
  const localeSchema = {
    name: {
      type: String,
      required: stringRequired("locale", "name"),
      maxlength: [NAME_MAX_LENGTH, `Name must be at most ${NAME_MAX_LENGTH}`]
    },
    UUID: {type: String, required: true, validate: RegExp_UUIDv4},
    shortCode: {
      type: String,
      required: stringRequired("locale", "shortCode"),
      maxlength: [SHORTCODE_MAX_LENGTH, `Short code must be at most ${SHORTCODE_MAX_LENGTH}`]
    },
  };

  // Schema
  const modelInfoSchema = new mongoose.Schema<IModelInfo>({
    UUID: {type: String, required: true, validate: RegExp_UUIDv4},
    previousUUID: {
      type: String, required: stringRequired("previousUUID"), validate: function (value: string): boolean {
        return (value.length === 0 || RegExp_UUIDv4.test(value));
      }
    },
    originUUID: {
      type: String, required: stringRequired("originUUID"), validate: function (value: string): boolean {
        return (value.length === 0 || RegExp_UUIDv4.test(value));
      }
    },
    name: {
      type: String,
      required: true,
      maxlength: [NAME_MAX_LENGTH, `Name must be at most ${NAME_MAX_LENGTH}`],
      validate: function (value: string): boolean {
        return isSpecified(value);
      }
    },
    locale: localeSchema,
    description: {
      type: String,
      required: stringRequired("description"),
      maxlength: [DESCRIPTION_MAX_LENGTH, `Description must be at most ${DESCRIPTION_MAX_LENGTH} chars long`]
    },
    released: {type: Boolean, required: stringRequired("released")},
    releaseNotes: {
      type: String,
      required: stringRequired("releaseNotes"),
      maxlength: [RELEASE_NOTES_MAX_LENGTH, `Release notes must be at most ${RELEASE_NOTES_MAX_LENGTH}`]
    },
    version: {
      type: String,
      required: stringRequired("version"),
      maxlength: [VERSION_MAX_LENGTH, `Version must be at most ${VERSION_MAX_LENGTH}`]
    },
  }, {timestamps: true, strict: "throw"},);

  // @ts-ignore
  modelInfoSchema.index({UUID: 1}, {unique: true});
  modelInfoSchema.virtual('id').get(
    function () {
      return this._id;
    });
  // Model
  return dbConnection.model<IModelInfo>(ModelName, modelInfoSchema);
}

/**
 * The purpose of this function is to define a string field that is required and allows an empty string (zero length string)
 * @param fieldName
 */
function stringRequired(...fieldName: string[]) {
  return function () {
    // the reduce value  return the nth level of the object,
    // i.e. for stringRequired("a", "b", "c"), it will return this["a"]["b"]["c"]
    // @ts-ignore
    const value =  fieldName.reduce((acc, cur) => {
      return  acc[cur];
      // @ts-ignore
    }, this);

    return typeof value === 'string' ? false : true;
  };
}

export interface ILocale {
  UUID: string
  shortCode: string
  name: string
}


export interface INewModelInfoSpec {
  name: string
  locale: ILocale
  description: string
}
export interface IModelInfo extends INewModelInfoSpec {
  id: string
  UUID: string
  previousUUID: string
  originUUID: string
  released: boolean
  releaseNotes: string
  version: string,
  createdAt: Date,
  updatedAt: Date
}
/*
export interface IModelInfo {
  id: string
  UUID: string
  previousUUID: string
  originUUID: string
  name: string
  locale: ILocale
  description: string
  released: boolean
  releaseNotes: string
  version: string,
  createdAt: Date,
  updatedAt: Date
}

export type INewModelInfoSpec = Omit<IModelInfo, 'id' | 'UUID' | 'createdAt' | 'updatedAt'>;

 */