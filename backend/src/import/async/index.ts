import Import from "api-specifications/import";
import {initOnce} from "server/init";
import {ajvInstance, ParseValidationError} from "validator";
import {ValidateFunction} from "ajv";
import {getRepositoryRegistry} from "server/repositoryRegistry/repositoryRegistry";
import ImportProcessStateApiSpecs from "api-specifications/importProcessState";
import {IModelInfo} from "modelInfo/modelInfo.types";
import {parseFiles} from "./parseFiles";


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handler = async (event: Import.POST.Request.Payload): Promise<any> => {
  console.info("Import started", event);

  // Validate the event against the schema
  const validateFunction = ajvInstance.getSchema(Import.POST.Request.Schema.$id as string) as ValidateFunction;
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

 const  importErrored = async (modelId: string) => {
   try {
     const importProcessStateId = (await getRepositoryRegistry().modelInfo.getModelById(modelId) as IModelInfo).importProcessState.id;
     await getRepositoryRegistry().importProcessState.update(importProcessStateId, {
       status: ImportProcessStateApiSpecs.Enums.Status.COMPLETED, result: {
         errored: true,
         // checking parsing errors and warning is an upcoming feature
         parsingErrors: false,
         parsingWarnings: false
       }
     });
   } catch (e: unknown) {
     console.error(e);
   }
 };