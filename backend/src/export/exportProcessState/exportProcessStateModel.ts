import mongoose from "mongoose";
import ExportProcessStateApiSpecs from "api-specifications/exportProcessState";
import { IExportProcessStateDoc } from "./exportProcessState.types";
import { getGlobalTransformOptions } from "server/repositoryRegistry/globalTransform";

export const ModelName = "ExportProcessStateModel";

export const ExportProcessStateModelPaths = {
  modelId: "modelId",
};

export function initializeSchemaAndModel(dbConnection: mongoose.Connection): mongoose.Model<IExportProcessStateDoc> {
  const schema = new mongoose.Schema<IExportProcessStateDoc>(
    {
      [ExportProcessStateModelPaths.modelId]: { type: mongoose.Schema.Types.ObjectId, required: true },
      status: {
        type: String,
        required: true,
        enum: Object.values(ExportProcessStateApiSpecs.Enums.Status),
      },
      result: {
        errored: {
          type: Boolean,
          required: true,
        },
        exportErrors: {
          type: Boolean,
          required: true,
        },
        exportWarnings: {
          type: Boolean,
          required: true,
        },
      },
      downloadUrl: {
        type: String,
        // Allow empty string
        required: function () {
          return typeof this.downloadUrl !== "string";
        },
        validate: {
          // Allow empty string
          validator: (value: string) => /^$|^https?:\/\/.*/.test(value),
          message: (props) => `${props.value} is not a valid URL`,
        },
      },
      timestamp: {
        type: Date,
        required: true,
      },
    },
    {
      timestamps: true,
      strict: "throw",
      toObject: getGlobalTransformOptions(),
      toJSON: getGlobalTransformOptions(),
    }
  );

  return dbConnection.model<IExportProcessStateDoc>(ModelName, schema);
}
