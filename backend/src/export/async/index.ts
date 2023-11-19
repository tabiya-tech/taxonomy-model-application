import ExportApiSpecs from "api-specifications/export";
import { ajvInstance, ParseValidationError } from "validator";
import { ValidateFunction } from "ajv";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import ExportProcessStateAPISpecs from "api-specifications/exportProcessState";
import errorLogger from "common/errorLogger/errorLogger";
import { parseModelToFile } from "./parseModelToFile";
import { initOnce } from "server/init";

export type AsyncExportEvent = ExportApiSpecs.Types.POST.Request.Payload & {
  exportProcessStateId: string;
};

export const handler = async (event: AsyncExportEvent): Promise<void> => {
  console.info("Export started", event);
  // Clear the errorLogger from previous runs
  errorLogger.clear();

  // Validate the modelId
  const validateFunction = ajvInstance.getSchema(
    ExportApiSpecs.Schemas.POST.Request.Payload.$id as string
  ) as ValidateFunction;
  const isModelIdValid = validateFunction({ modelId: event.modelId });

  if (!isModelIdValid) {
    const errorDetail = ParseValidationError(validateFunction.errors);
    console.error("Export failed, the modelId does not conform to the expected schema:", errorDetail);
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

  try {
    await parseModelToFile(event.exportProcessStateId);
  } catch (e: unknown) {
    console.error("Error updating ExportProcessState:", e);
    // Set the export process status to FAILED
    await exportErrored(event.modelId, event.exportProcessStateId);
  }
};

const exportErrored = async (modelId: string, exportProcessStateId: string) => {
  try {
    const exportFailedState = {
      status: ExportProcessStateAPISpecs.Enums.Status.COMPLETED,
      result: {
        errored: true, // checking parsing errors and warning is an upcoming feature
        exportErrors: false,
        exportWarnings: false,
      },
    };
    console.info("Export failed", exportFailedState);
    await getRepositoryRegistry().exportProcessState.update(exportProcessStateId, exportFailedState);
  } catch (e: unknown) {
    console.error(e);
  }
};
