import ImportProcessStateApiSpecs from "api-specifications/importProcessState/";
import mongoose from "mongoose";

/**
 * Describes how model info are returned from the repository API
 */
export interface ILocale {
  UUID: string;
  shortCode: string;
  name: string;
}

export interface IModelInfo {
  id: string;
  name: string;
  locale: ILocale;
  description: string;
  UUID: string;
  previousUUID: string;
  originUUID: string;
  released: boolean;
  releaseNotes: string;
  version: string;
  importProcessState: {
    id: string;
    status: ImportProcessStateApiSpecs.Enums.Status;
    result: {
      errored: boolean;
      parsingErrors: boolean;
      parsingWarnings: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Describe how model info is created via the repository API
 */
export interface INewModelInfoSpec {
  name: string;
  locale: ILocale;
  description: string;
}

/**
 * Describing how the data is saved in MongoDB
 */
export interface IModelInfoDoc {
  id: mongoose.Types.ObjectId | string;
  name: string;
  locale: ILocale;
  description: string;
  UUID: string;
  previousUUID: string;
  originUUID: string;
  released: boolean;
  releaseNotes: string;
  version: string;
  importProcessState: mongoose.Types.ObjectId | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}
