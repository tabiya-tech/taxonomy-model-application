import ImportAPISpecs from "api-specifications/import";
import { initOnce } from "server/init";
import { ajvInstance, ParseValidationError } from "validator";
import { ValidateFunction } from "ajv";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import ImportProcessStateApiSpecs from "api-specifications/importProcessState";
import { IModelInfo } from "modelInfo/modelInfo.types";
import { parseFiles } from "./parseFiles";
import errorLogger from "common/errorLogger/errorLogger";

/**
 * Lambda function handler for asynchronous import.
 *
 * @param {ImportAPISpecs.Types.POST.Request.Payload} event - The event object containing import details.
 * @throws Causes AWS Lambda to retry if an error occurs in initial stages.
 * @returns {Promise<unknown>}
 *
 * This function handles the import process based on the given event payload. In AWS Lambda, throwing an error  will trigger a retry of the function.
 * This can be useful for cases where we would like to retry (for example during db initialization), however we avoid retrying in cases
 * where a restart is unlikely to resolve the problem.
 */
export const handler = async (event: ImportAPISpecs.Types.POST.Request.Payload): Promise<unknown> => {
  console.info("Import started", event);
  // Clear the errorLogger from previous runs
  errorLogger.clear();

  // Validate the event against the schema
  const validateFunction = ajvInstance.getSchema(
    ImportAPISpecs.Schemas.POST.Request.Payload.$id as string
  ) as ValidateFunction;
  const isValid = validateFunction(event);

  // If the event is not valid, log and return
  // Don't throw an error as the lambda function should not be retried
  if (!isValid) {
    const errorDetail = ParseValidationError(validateFunction.errors);
    const e = new Error("Import failed, the event does not conform to the expected schema: " + errorDetail);
    console.error(e);
    return;
  }
  // Initialize the connection to the database
  // If it fails, log and retry
  try {
    await initOnce();
  } catch (e: unknown) {
    console.error(e);
    throw e;
  }

  // We expect the parseModelToFile function to throw errors internally, since we want to handle them here.
  // This is because we don't want to retry the lambda function in case of errors during the import process.
  try {
    await parseFiles(event);
  } catch (e: unknown) {
    console.error(e);
    // Set the import process status to FAILED
    await importErrored(event.modelId);
    return;
  }
};

// The importErrored function does not throw errors.
// This is because we don't want to retry the lambda function in case of errors during the import process.
const importErrored = async (modelId: string) => {
  try {
    const state = {
      status: ImportProcessStateApiSpecs.Enums.Status.COMPLETED,
      result: {
        errored: true, // checking parsing errors and warning is an upcoming feature
        parsingErrors: false,
        parsingWarnings: false,
      },
    };
    console.info("Import failed", state);
    const importProcessStateId = ((await getRepositoryRegistry().modelInfo.getModelById(modelId)) as IModelInfo)
      .importProcessState.id;
    await getRepositoryRegistry().importProcessState.update(importProcessStateId, state);
  } catch (e: unknown) {
    console.error(e);
  }
};
