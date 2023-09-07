import mongoose from "mongoose";
import ImportProcessStateApiSpecs from "api-specifications/importProcessState/";
/**
 * Describing how the data is saved in MongoDB
 */
export interface IImportProcessStateDoc  {
  id: string | mongoose.Types.ObjectId
  modelId: string | mongoose.Types.ObjectId
  status: ImportProcessStateApiSpecs.Enums.Status,
  result: ImportProcessStateApiSpecs.Types.Result,
  createdAt: Date | string
  updatedAt: Date | string
}

//
// export interface IImportProcessStateReferenceDoc extends Pick<IImportProcessStateDoc, "id" | "status" | "progress" | "createdAt" | "updatedAt" > {
//
//}

/**
 * Describes how ImportProcessState is return from the API
 */
export interface IImportProcessState extends IImportProcessStateDoc {
  id: string
  modelId: string
  createdAt: Date
  updatedAt: Date
}

/**
 *  Describes how new ImportProcessState are created in the API
 */
export type INewImportProcessStateSpec = Omit<IImportProcessState, "createdAt" | "updatedAt">;

export type IUpdateImportProcessStateSpec = Omit<IImportProcessState, "id" | "modelId" | "createdAt" | "updatedAt">;

///**
// * Describing how references are returned from the API
// */
//export interface IOccupationReference extends Pick<IOccupation, "id" | "UUID" | "ISCOGroupCode" | "code" | "preferredLabel"> {
//  objectType: ObjectTypes.Occupation
//}