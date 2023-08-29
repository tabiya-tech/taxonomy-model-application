import {isSpecified} from 'server/isUnspecified';
import mongoose from 'mongoose';
import {RegExp_UUIDv4} from "server/regex";
import { stringRequired } from 'server/stringRequired';
import {DescriptionProperty, OriginUUIDProperty} from "../esco/common/modelSchema";
import * as ModelInfo from 'api-specifications/modelInfo';

export const ModelName = "ModelInfo";


export function initializeSchemaAndModel(dbConnection: mongoose.Connection): mongoose.Model<IModelInfo> {
  // Schema for Locale
  const localeSchema = {
    name: {
      type: String,
      required: stringRequired("locale", "name"),
      maxlength: [ModelInfo.Constants.NAME_MAX_LENGTH, `Name must be at most ${ModelInfo.Constants.NAME_MAX_LENGTH} chars long`]
    },
    UUID: {type: String, required: true, validate: RegExp_UUIDv4},
    shortCode: {
      type: String,
      required: stringRequired("locale", "shortCode"),
      maxlength: [ModelInfo.Constants.LOCALE_SHORTCODE_MAX_LENGTH, `Short code must be at most ${ModelInfo.Constants.LOCALE_SHORTCODE_MAX_LENGTH} chars long`]
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
      maxlength: [ModelInfo.Constants.NAME_MAX_LENGTH, `Name must be at most ${ModelInfo.Constants.NAME_MAX_LENGTH} chars long`],
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
      maxlength: [ModelInfo.Constants.RELEASE_NOTES_MAX_LENGTH, `Release notes must be at most ${ModelInfo.Constants.RELEASE_NOTES_MAX_LENGTH} chars long`]
    },
    version: {
      type: String,
      required: stringRequired("version"),
      maxlength: [ModelInfo.Constants.VERSION_MAX_LENGTH, `Version must be at most ${ModelInfo.Constants.VERSION_MAX_LENGTH} chars long`]
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