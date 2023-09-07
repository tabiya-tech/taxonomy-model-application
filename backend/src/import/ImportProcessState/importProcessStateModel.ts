import mongoose from 'mongoose';
import {IImportProcessStateDoc} from "./importProcessState.types";
import ImportProcessStateApiSpecs from "api-specifications/importProcessState/";

export const ModelName = "ImportProcessState";

export function initializeSchemaAndModel(dbConnection: mongoose.Connection): mongoose.Model<IImportProcessStateDoc> {
  // Schema
  const schema = new mongoose.Schema<IImportProcessStateDoc>({
    modelId: {type: mongoose.Schema.Types.ObjectId, required: true},
    status: {type: String, required: true, enum: Object.values(ImportProcessStateApiSpecs.Enums.Status)},
    result: {
      errored: {
        type: Boolean,
        required: true
      },
      parsingErrors: {
        type: Boolean,
        required: true
      },
      parsingWarnings: {
        type: Boolean,
        required: true
      }
    }
  }, {timestamps: true, strict: "throw"},);

  // currently no indexes defined

  // Model
  return dbConnection.model<IImportProcessStateDoc>(ModelName, schema);
}