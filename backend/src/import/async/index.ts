import ImportAPISpecs from "api-specifications/import";
import { initOnce } from "server/init";
import { ajvInstance, ParseValidationError } from "validator";
import { ValidateFunction } from "ajv";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import ImportProcessStateApiSpecs from "api-specifications/importProcessState";
import { IModelInfo } from "modelInfo/modelInfo.types";
import { parseFiles } from "./parseFiles";
import importLogger from "../importLogger/importLogger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handler = async (event: ImportAPISpecs.Types.POST.Request.Payload): Promise<unknown> => {
  console.info("Import started", event);
  // Clear the importLogger from previous runs
  importLogger.clear();

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

  // From here onwards we don't want to throw an error as the lambda function should not be retried
  try {
    await parseFiles(event);
  } catch (e: unknown) {
    console.error(e);
    // Set the import process status to FAILED
    await importErrored(event.modelId);
    return;
  }
};

const importErrored = async (modelId: string) => {
  try {
    const state = {
      status: ImportProcessStateApiSpecs.Enums.Status.COMPLETED,
      result: {
        errored: true,
        // checking parsing errors and warning is an upcoming feature
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
