import {ImportFilePaths, ImportRequest, ImportRequestSchema} from "api-specifications/import";
import {initOnce} from "server/init";
import {S3PresignerService} from "./S3PresignerService";
import {getUploadBucketName, getUploadBucketRegion} from "server/config/config";
import {ajvInstance, ParseValidationError} from "validator";
import {ValidateFunction} from "ajv";
import {parseISCOGroupsFromUrl} from "import/esco/ISCOGroups/ISCOGroupsParser";
import {parseSkillGroupsFromUrl} from "import/esco/skillGroups/skillGroupsParser";
import {parseSkillsFromUrl} from "import/esco/skills/skillsParser";
import {parseOccupationsFromUrl} from "import/esco/occupations/occupationsParser";
import {parseOccupationHierarchyFromUrl} from "../esco/occupationHierarchy/occupationHierarchyParser";


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handler = async (event: ImportRequest): Promise<any> => {
  console.info("Import started", event);

  // Validate the event against the schema
  const validateFunction = ajvInstance.getSchema(ImportRequestSchema.$id as string) as ValidateFunction;
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
      countISCOGroups = await parseISCOGroupsFromUrl(modelid, downloadUrls.ISCO_GROUP, importIdToDBIdMap);
      console.info(`Processed ${countISCOGroups} ISCO groups`);
    }
    if (downloadUrls.ESCO_SKILL_GROUP) {
      const count = await parseSkillGroupsFromUrl(modelid, downloadUrls.ESCO_SKILL_GROUP);
      console.info(`Processed ${count} Skill groups`);
    }
    if (downloadUrls.ESCO_SKILL) {
      const count = await parseSkillsFromUrl(modelid, downloadUrls.ESCO_SKILL);
      console.info(`Processed ${count} Skills`);
    }
    let countOccupations = 0;
    if (downloadUrls.ESCO_OCCUPATION) {
      countOccupations = await parseOccupationsFromUrl(modelid, downloadUrls.ESCO_OCCUPATION, importIdToDBIdMap);
      console.info(`Processed ${countOccupations} Occupations`);
    }
    if (downloadUrls.OCCUPATION_HIERARCHY) {
      const count = await parseOccupationHierarchyFromUrl(modelid, downloadUrls.OCCUPATION_HIERARCHY, importIdToDBIdMap);
      if (count !== countISCOGroups + countOccupations - 10) {
        console.warn(`Expected to process ${countISCOGroups + countOccupations - 10} hierarchy entries. That is the number of ISCO groups + Occupations - 10. But processed ${count} entries.`);
      } else {
        console.info(`Processed ${count} hierarchy entries that is as expected the number of ISCO groups + Occupations - 10.`);
      }
    }

    console.info("Import successfully finished");
  } catch (e: unknown) {
    console.error(e);
  }
};

const getPresignedUrls = async (filePaths: ImportFilePaths): Promise<ImportFilePaths> => {
  const s3PresignedService = new S3PresignerService(getUploadBucketRegion(), getUploadBucketName());
  const promises = Object.entries(filePaths).map(async (entry) => {
    return {[entry[0]]: await s3PresignedService.getPresignedGet(entry[1])};
  });
  return Object.assign({}, ...await Promise.all(promises));
};