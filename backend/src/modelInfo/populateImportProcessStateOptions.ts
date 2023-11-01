import { IImportProcessStateDoc } from "import/ImportProcessState/importProcessState.types";
import ImportProcessStateAPISpecs from "api-specifications/importProcessState/";
import mongoose from "mongoose";

export const populateImportProcessStateOptions = {
  path: "importProcessState",
  transform: (doc: IImportProcessStateDoc, _id: mongoose.Types.ObjectId) => {
    // In general every model must have an importProcessStateId, as it is expected that models are populated via an import process.
    // However, if for any reason the importProcessStateId is not set, then we should assume that it was created via a different way that the API.
    if (doc === null) {
      // if the importProcessState is not set, then the import has not started yet
      return {
        id: _id.toString(),
        status: ImportProcessStateAPISpecs.Enums.Status.PENDING,
        result: {
          errored: false,
          parsingErrors: false,
          parsingWarnings: false,
        },
      };
    } else {
      return {
        id: _id.toString(),
        status: doc.status,
        result: doc.result,
      };
    }
  },
};
