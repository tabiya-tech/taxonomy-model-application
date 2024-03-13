import ImportProcessStateApiSpecs from "api-specifications/importProcessState/";
import ExportProcessStateApiSpecs from "api-specifications/exportProcessState/";
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
  UUIDHistory: string[];
  released: boolean;
  releaseNotes: string;
  version: string;
  importProcessState: mongoose.Types.ObjectId;
}

/**
 * Describes how a model info is returned from the API
 */
export interface IModelInfo extends Omit<IModelInfoDoc, "importProcessState" | "UUIDHistory"> {
  id: string;
  name: string;
  UUIDHistory: string[];
  exportProcessState: {
    id: string;
    status: ExportProcessStateApiSpecs.Enums.Status;
    result: {
      errored: boolean;
      exportErrors: boolean;
      exportWarnings: boolean;
    };
    downloadUrl: string;
    timestamp: Date;
    createdAt: Date;
    updatedAt: Date;
  }[];
  importProcessState: {
    id: string;
    status: ImportProcessStateApiSpecs.Enums.Status;
    result: {
      errored: boolean;
      parsingErrors: boolean;
      parsingWarnings: boolean;
    };
    createdAt?: Date;
    updatedAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Describe how a new model info is created with the API
 */
export type INewModelInfoSpec = Pick<IModelInfoDoc, "name" | "locale" | "description" | "UUIDHistory">;

/**
 * Describes how a reference to a model is returned from the API
 */

export interface IModelInfoReference {
  id: string | null;
  UUID: string;
  name: string | null;
  localeShortCode: string | null;
  version: string | null;
}
