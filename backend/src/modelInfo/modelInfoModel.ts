import {isSpecified} from 'server/isUnspecified';
import mongoose from 'mongoose';
import {RegExp_UUIDv4} from "server/regex";
import { stringRequired } from 'server/stringRequired';
import {DescriptionProperty, OriginUUIDProperty} from "../esco/common/modelSchema";

export const ModelName = "ModelInfo";

export const NAME_MAX_LENGTH = 256;

export const SHORTCODE_MAX_LENGTH = 3;

export const RELEASE_NOTES_MAX_LENGTH = 100000;

export const VERSION_MAX_LENGTH = 256;

export function initializeSchemaAndModel(dbConnection: mongoose.Connection): mongoose.Model<IModelInfo> {
  // Schema for Locale
  const localeSchema = {
    name: {
      type: String,
      required: stringRequired("locale", "name"),
      maxlength: [NAME_MAX_LENGTH, `Name must be at most ${NAME_MAX_LENGTH} chars long`]
    },
    UUID: {type: String, required: true, validate: RegExp_UUIDv4},
    shortCode: {
      type: String,
      required: stringRequired("locale", "shortCode"),
      maxlength: [SHORTCODE_MAX_LENGTH, `Short code must be at most ${SHORTCODE_MAX_LENGTH} chars long`]
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
    originUUID: OriginUUIDProperty,
    name: {
      type: String,
      required: true,
      maxlength: [NAME_MAX_LENGTH, `Name must be at most ${NAME_MAX_LENGTH} chars long`],
      validate: function (value: string): boolean {
        return isSpecified(value);
      }
    },
    locale: localeSchema,
    description: DescriptionProperty,
    released: {type: Boolean, required: stringRequired("released")},
    releaseNotes: {
      type: String,
      required: stringRequired("releaseNotes"),
      maxlength: [RELEASE_NOTES_MAX_LENGTH, `Release notes must be at most ${RELEASE_NOTES_MAX_LENGTH} chars long`]
    },
    version: {
      type: String,
      required: stringRequired("version"),
      maxlength: [VERSION_MAX_LENGTH, `Version must be at most ${VERSION_MAX_LENGTH} chars long`]
    },
  }, {timestamps: true, strict: "throw"},);

  modelInfoSchema.index({UUID: 1}, {unique: true});
  // Model
  return dbConnection.model<IModelInfo>(ModelName, modelInfoSchema);
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