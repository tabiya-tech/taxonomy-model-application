import { isSpecified } from "server/isUnspecified";
import mongoose, { Schema } from "mongoose";
import { RegExp_UUIDv4 } from "server/regex";
import { stringRequired } from "server/stringRequired";
import ModelInfoAPISpecs from "api-specifications/modelInfo";
import LocaleAPISpecs from "api-specifications/locale";
import { IModelInfoDoc } from "./modelInfo.types";
import { getGlobalTransformOptions } from "server/repositoryRegistry/globalTransform";
import {
  ExportProcessStateModelPaths,
  ModelName as ExportProcessStateModelName,
} from "export/exportProcessState/exportProcessStateModel";
import { UUIDHistoryProperty } from "esco/common/modelSchema";

export const ModelName = "ModelInfo";
export const ModelInfoModelPaths = {
  exportProcessState: "exportProcessState",
};

export function initializeSchemaAndModel(dbConnection: mongoose.Connection): mongoose.Model<IModelInfoDoc> {
  // Schema for Locale
  const localeSchema = {
    name: {
      type: String,
      required: stringRequired("locale", "name"),
      maxlength: [
        ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH,
        `Name must be at most ${ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH} chars long`,
      ],
    },
    UUID: { type: String, required: true, validate: RegExp_UUIDv4 },
    shortCode: {
      type: String,
      required: stringRequired("locale", "shortCode"),
      maxlength: [
        LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH,
        `Short code must be at most ${LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH} chars long`,
      ],
    },
  };

  // Schema
  const modelInfoSchema = new mongoose.Schema<IModelInfoDoc>(
    {
      UUID: { type: String, required: true, validate: RegExp_UUIDv4 },
      UUIDHistory: UUIDHistoryProperty,
      name: {
        type: String,
        required: true,
        maxlength: [
          ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH,
          `Name must be at most ${ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH} chars long`,
        ],
        validate: function (value: string): boolean {
          return isSpecified(value);
        },
      },
      locale: localeSchema,
      description: {
        type: String,
        required: stringRequired("description"),
        maxlength: [
          ModelInfoAPISpecs.Constants.DESCRIPTION_MAX_LENGTH,
          `Description must be at most ${ModelInfoAPISpecs.Constants.DESCRIPTION_MAX_LENGTH} chars long`,
        ],
      },
      released: { type: Boolean, required: true },
      releaseNotes: {
        type: String,
        required: stringRequired("releaseNotes"),
        maxlength: [
          ModelInfoAPISpecs.Constants.RELEASE_NOTES_MAX_LENGTH,
          `Release notes must be at most ${ModelInfoAPISpecs.Constants.RELEASE_NOTES_MAX_LENGTH} chars long`,
        ],
      },
      license: {
        type: String,
        required: stringRequired("license"),
        maxlength: [
          ModelInfoAPISpecs.Constants.LICENSE_MAX_LENGTH,
          `License must be at most ${ModelInfoAPISpecs.Constants.LICENSE_MAX_LENGTH} chars long`,
        ],
      },
      version: {
        type: String,
        required: stringRequired("version"),
        maxlength: [
          ModelInfoAPISpecs.Constants.VERSION_MAX_LENGTH,
          `Version must be at most ${ModelInfoAPISpecs.Constants.VERSION_MAX_LENGTH} chars long`,
        ],
      },
      importProcessState: {
        type: Schema.Types.ObjectId,
        ref: "ImportProcessState",
        required: true,
      },
    },
    {
      timestamps: true,
      strict: "throw",
      toObject: getGlobalTransformOptions(_TransformFn),
      toJSON: getGlobalTransformOptions(_TransformFn),
    }
  );

  modelInfoSchema.virtual(ModelInfoModelPaths.exportProcessState, {
    ref: ExportProcessStateModelName,
    localField: "_id",
    foreignField: ExportProcessStateModelPaths.modelId,
    justOne: false,
  });

  modelInfoSchema.index({ UUID: 1 }, { unique: true });
  // Model
  return dbConnection.model<IModelInfoDoc>(ModelName, modelInfoSchema);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _TransformFn = (doc: any, ret: any) => {
  if (ret.importProcessState && ret.importProcessState instanceof mongoose.Types.ObjectId) {
    ret.importProcessState = ret.importProcessState.toString();
  }
  return ret;
};
