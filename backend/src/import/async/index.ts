import Import from "api-specifications/import";
import {initOnce} from "server/init";
import {S3PresignerService} from "./S3PresignerService";
import {getUploadBucketName, getUploadBucketRegion} from "server/config/config";
import {ajvInstance, ParseValidationError} from "validator";
import {ValidateFunction} from "ajv";
import {parseISCOGroupsFromUrl} from "import/esco/ISCOGroups/ISCOGroupsParser";
import {parseSkillGroupsFromUrl} from "import/esco/skillGroups/skillGroupsParser";
import {parseSkillsFromUrl} from "import/esco/skills/skillsParser";
import {parseOccupationsFromUrl} from "import/esco/occupations/occupationsParser";
import {parseOccupationHierarchyFromUrl} from "import/esco/occupationHierarchy/occupationHierarchyParser";


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handler = async (event: Import.POST.Request.Payload): Promise<any> => {
  console.info("Import started", event);

  // Validate the event against the schema
  const validateFunction = ajvInstance.getSchema(Import.POST.Request.Schema.$id as string) as ValidateFunction;
  const isValid = validateFunction(event);
  if (!isValid) {
    const errorDetail = ParseValidationError(validateFunction.errors);
    const e = new Error("Import failed, the event does not conform to the expected schema: " + errorDetail);
    console.error(e);
    throw e;
  }

  try {
    await initOnce();

    const modelid = event.modelId;
    // Generate the presigned urls for the files
    const downloadUrls = await getPresignedUrls(event.filePaths);

    const importIdToDBIdMap: Map<string, string> = new Map<string, string>();

    // Process the files
    let countISCOGroups = 0;
    if (downloadUrls.ISCO_GROUP) {
      const stats = await parseISCOGroupsFromUrl(modelid, downloadUrls.ISCO_GROUP, importIdToDBIdMap);
      countISCOGroups = stats.rowsSuccess;
      console.info(`Processed ${JSON.stringify(stats)} ISCO Groups`);
    }
    if (downloadUrls.ESCO_SKILL_GROUP) {
      const stats = await parseSkillGroupsFromUrl(modelid, downloadUrls.ESCO_SKILL_GROUP, importIdToDBIdMap);
      console.info(`Processed ${JSON.stringify(stats)} Skill Groups`);
    }
    if (downloadUrls.ESCO_SKILL) {
      const stats = await parseSkillsFromUrl(modelid, downloadUrls.ESCO_SKILL, importIdToDBIdMap);
      console.info(`Processed ${JSON.stringify(stats)} Skills`);
    }
    let countOccupations = 0;
    if (downloadUrls.ESCO_OCCUPATION) {
      const stats = await parseOccupationsFromUrl(modelid, downloadUrls.ESCO_OCCUPATION, importIdToDBIdMap);
      countOccupations = stats.rowsSuccess;
      console.info(`Processed ${JSON.stringify(stats)} Occupations`);
    }
    if (downloadUrls.OCCUPATION_HIERARCHY) {
      const stats = await parseOccupationHierarchyFromUrl(modelid, downloadUrls.OCCUPATION_HIERARCHY, importIdToDBIdMap);
      console.info(`Processed ${JSON.stringify(stats)} Occupation hierarchy entries`);
      if (stats.rowsSuccess !== countISCOGroups + countOccupations - 10) {
        console.warn(`Expected to successfully process ${countISCOGroups + countOccupations - 10} (ISCO groups + Occupations - 10) hierarchy entries.`);
      }
    }

    console.info("Import successfully finished");
  } catch (e: unknown) {
    console.error(e);
  }
};

const getPresignedUrls = async (filePaths: Import.POST.Request.ImportFilePaths): Promise<Import.POST.Request.ImportFilePaths> => {
  const s3PresignedService = new S3PresignerService(getUploadBucketRegion(), getUploadBucketName());
  const promises = Object.entries(filePaths).map(async (entry) => {
    return {[entry[0]]: await s3PresignedService.getPresignedGet(entry[1])};
  });
  return Object.assign({}, ...await Promise.all(promises));
};