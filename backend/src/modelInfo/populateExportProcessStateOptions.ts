import { IExportProcessStateDoc } from "export/exportProcessState/exportProcessState.types";
import mongoose from "mongoose";
import { ModelInfoModelPaths } from "./modelInfoModel";

export const populateExportProcessStateOptions = {
  path: ModelInfoModelPaths.exportProcessState,
  transform: (doc: IExportProcessStateDoc & { _id: mongoose.Types.ObjectId }) => {
    return {
      id: doc._id.toString(),
      status: doc.status,
      result: doc.result,
      downloadUrl: doc.downloadUrl,
      timestamp: doc.timestamp,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  },
};
