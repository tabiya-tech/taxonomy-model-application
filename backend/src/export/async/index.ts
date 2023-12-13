import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import ExportProcessStateAPISpecs from "api-specifications/exportProcessState";
import errorLogger from "common/errorLogger/errorLogger";
import { modelToS3 } from "./modelToS3";
import { initOnce } from "server/init";
import { AsyncExportEvent } from "./async.types";

/**
 * Lambda function handler for asynchronous export.
 *
 * @param {AsyncExportEvent} event - The event object containing export details.
 * @throws Will cause AWS Lambda to retry the function if an error is thrown.
 * @returns {Promise<void>}
 *
 * This function is responsible for exporting model data from the database into a series of CSV files, compressing it into a zip file
 * and then uploading it to an s3 bucket. AWS lambda instances are restarted when you throw an error. This is useful for cases when we want to restart,
 * for example when initializing the db,  but not for parsing errors, where a restart is unlikely to resolve the problem.
 */

export const handler = async (event: AsyncExportEvent): Promise<void> => {
  console.info("Export started", event);
  // Clear the errorLogger from previous runs
  errorLogger.clear();

  // If the event is not valid, log and return
  // Validate and check the export process state
  if (!event.modelId) {
    console.error(new Error("Export failed, the modelId is missing"));
    return;
  }
  // Validate and check the export process state
  if (!event.exportProcessStateId) {
    console.error(new Error("Export failed, the exportProcessStateId is missing"));
    return;
  }

  // Initialize the connection to the database
  // If it fails, log and retry
  try {
    await initOnce();
  } catch (e: unknown) {
    console.error(new Error("Failed to initialize database connection", { cause: e }));
    throw e;
  }

  try {
    /* We check the exportProcessStateId to make sure it is valid and the status is PENDING
     * If the status is not PENDING, we assume that there is an inconsistency in the triggering of the export process
     * (for example a re-trigger that happened on a previous run) and we do not want to proceed with the export
     * This will help us avoid an endless lambda invocation loop
     */
    const exportProcessState = await getRepositoryRegistry().exportProcessState.findById(event.exportProcessStateId);
    if (!exportProcessState) {
      console.error(new Error("Export failed, the exportProcessState does not exist"));
      return;
    }

    if (exportProcessState.status !== ExportProcessStateAPISpecs.Enums.Status.PENDING) {
      console.error(
        new Error(`Export failed. The exportProcessState status is not PENDING, it is ${exportProcessState.status}`)
      );
      return;
    }

    // We expect the parseModelToFile function to throw errors and set the export process status to FAILED in the catch block.
    await modelToS3(event);
  } catch (e: unknown) {
    console.error(new Error("An error occurred while attempting to export model.", { cause: e }));
    // Set the export process status to FAILED
    await exportErrored(event.exportProcessStateId);
  }
};

// The exportErrored function does not throw errors.
// This is because we don't want to retry the lambda function in case of errors during the export process.
const exportErrored = async (exportProcessStateId: string) => {
  try {
    const exportFailedState = {
      status: ExportProcessStateAPISpecs.Enums.Status.COMPLETED,
      result: {
        errored: true, // checking parsing errors and warning is an upcoming feature
        exportErrors: errorLogger.errorCount > 0,
        exportWarnings: errorLogger.warningCount > 0,
      },
    };
    console.info("Export failed", exportFailedState);
    await getRepositoryRegistry().exportProcessState.update(exportProcessStateId, exportFailedState);
  } catch (e: unknown) {
    console.error(new Error("Something went wrong", { cause: e }));
  }
};
