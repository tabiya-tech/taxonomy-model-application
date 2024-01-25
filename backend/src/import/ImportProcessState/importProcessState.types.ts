import mongoose from "mongoose";
import ImportProcessStateApiSpecs from "api-specifications/importProcessState/";
/**
 * Describes how an import process state is saved in Database
 */
export interface IImportProcessStateDoc {
  id: mongoose.Types.ObjectId; // we add an id field to the document, because we need to provide it upfront when creating a new document
  modelId: mongoose.Types.ObjectId;
  status: ImportProcessStateApiSpecs.Enums.Status;
  result: ImportProcessStateApiSpecs.Types.Result;
}

/**
 * Describes how an import process state is returned from the API
 */
export interface IImportProcessState extends Omit<IImportProcessStateDoc, "id" | "modelId"> {
  id: string;
  modelId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 *  Describes how a new import process state is created with the API
 */
export type INewImportProcessStateSpec = Omit<IImportProcessState, "createdAt" | "updatedAt">;

/**
 *  Describes how an import process state is updated with the API
 */
export type IUpdateImportProcessStateSpec = Partial<Omit<IImportProcessStateDoc, "id" | "modelId">>;
