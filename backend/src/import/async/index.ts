import {ImportFilePaths, ImportRequest, ImportRequestSchema} from "api-specifications/import";
import {initOnce} from "server/init";
import {S3PresignerService} from "./S3PresignerService";
import {getUploadBucketName, getUploadBucketRegion} from "server/config/config";
import {ajvInstance, ParseValidationError} from "validator";
import {ValidateFunction} from "ajv";
import {parseISCOGroupsFromUrl} from "import/ISCOGroups/ISCOGroupsParser";
import {parseSkillGroupsFromUrl} from "import/skillGroups/skillGroupsParser";


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handler = async (event: ImportRequest): Promise<any> => {
  console.info("Import started", event);

  // Validate the event against the schema
  const validateFunction = ajvInstance.getSchema(ImportRequestSchema.$id as string) as ValidateFunction;
  const isValid = validateFunction(event);
  if (!isValid) {
    const errorDetail = ParseValidationError(validateFunction.errors);
    const e = new Error("Import failed, the event does not conform to the expected schema: " +  errorDetail);
    console.error(e);
    throw e;
  }

  try {
    await initOnce();

    const modelid = event.modelId;
    // Generate the presigned urls for the files
    const downloadUrls = await getPresignedUrls(event.filePaths);

    // Process the files
    if (downloadUrls.ISCO_GROUP) {
      await parseISCOGroupsFromUrl(modelid, downloadUrls.ISCO_GROUP);
    }
    if (downloadUrls.ESCO_SKILL_GROUP) {
      await parseSkillGroupsFromUrl(modelid, downloadUrls.ESCO_SKILL_GROUP);
    }
    console.info("Completed import");
  } catch (e: unknown) {
    console.error(e);
  }
};

const getPresignedUrls = async (filePaths: ImportFilePaths): Promise<ImportFilePaths> => {
  const s3PresignedService = new S3PresignerService(getUploadBucketRegion(), getUploadBucketName());
  const promises = Object.entries(filePaths).map(async (entry) => {
    return {[entry[0]]: await s3PresignedService.getPresignedGet(entry[1])};
  });
  return Object.assign({}, ... await Promise.all(promises));
};