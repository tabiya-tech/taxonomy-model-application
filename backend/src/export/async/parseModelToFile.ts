import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import ExportProcessStateAPISpecs from "api-specifications/exportProcessState";
import { AsyncExportEvent } from "./async.types";

/**
 * exports a model into a zip file containing all the entities in the database pertaining to that model.
 *
 * @param {AsyncExportEvent} event - The event object containing modelId of the model to export and the export process state id.
 * @throws Errors from this function are expected to be caught in the calling asyncExport handler.
 * @returns {Promise<void>}
 *
 * * This function is responsible for exporting model data from the database into a series of CSV files, compressing it into a zip file
 *  * and then uploading it to an s3 bucket. It updates the export process state in the database to reflect
 *  * the status of the export operation. The function is designed to throw errors for explicit error handling in the
 *  * asyncExport process. These errors should be caught and processed by the calling function to handle retries or
 *  * cleanup operations as necessary.
 */

export const parseModelToFile = async (event: AsyncExportEvent) => {
  const downloadUrl = "https://download-bucket-1f37870.s3.eu-central-1.amazonaws.com/greet.zip";

  // Set the export process status to RUNNING
  await getRepositoryRegistry().exportProcessState.update(event.exportProcessStateId, {
    status: ExportProcessStateAPISpecs.Enums.Status.RUNNING,
    result: {
      errored: false,
      // checking parsing errors and warning is an upcoming feature
      exportErrors: false,
      exportWarnings: false,
    },
  });
  // Main logic to update ExportProcessState
  // This is where the exporting of the db to CSV and zipping and uploading will happen
  //...

  // Set the export process status to COMPLETED
  const exportState = {
    status: ExportProcessStateAPISpecs.Enums.Status.COMPLETED,
    result: {
      errored: false,
      // checking parsing errors and warning is an upcoming feature
      exportErrors: false,
      exportWarnings: false,
    },
    downloadUrl: downloadUrl,
  };
  await getRepositoryRegistry().exportProcessState.update(event.exportProcessStateId, exportState);
  console.info("Export completed", exportState);
};
