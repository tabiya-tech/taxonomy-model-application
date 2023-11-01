import ImportProcessStateApiSpecs from "api-specifications/importProcessState/";
import mongoose from "mongoose";

/**
 * Describes how a locale is saved in Database
 */
export interface ILocale {
  UUID: string;
  shortCode: string;
  name: string;
}

/**
 * Describes how a model info is saved in Database
 */
export interface IModelInfoDoc {
  name: string;
  locale: ILocale;
  description: string;
  UUID: string;
  previousUUID: string;
  originUUID: string;
  released: boolean;
  releaseNotes: string;
  version: string;
  importProcessState: mongoose.Types.ObjectId;
}

/**
 * Describes how a model info is returned from the API
 */
export interface IModelInfo extends Omit<IModelInfoDoc, "id" | "modelId" | "importProcessState"> {
  id: string;
  name: string;
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
 * Describe how a new model info is created with the API
 */
export interface INewModelInfoSpec {
  name: string;
  locale: ILocale;
  description: string;
}
