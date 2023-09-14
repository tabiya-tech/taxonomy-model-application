import {S3PresignerService} from "./S3PresignerService";
import {getUploadBucketName, getUploadBucketRegion} from "server/config/config";
import {getRepositoryRegistry} from "server/repositoryRegistry/repositoryRegistry";
import {IModelInfo} from "modelInfo/modelInfo.types";
import {parseISCOGroupsFromUrl} from "import/esco/ISCOGroups/ISCOGroupsParser";
import {parseSkillGroupsFromUrl} from "import/esco/skillGroups/skillGroupsParser";
import {parseSkillsFromUrl} from "import/esco/skills/skillsParser";
import {parseOccupationsFromUrl} from "import/esco/occupations/occupationsParser";
import {parseOccupationHierarchyFromUrl} from "import/esco/occupationHierarchy/occupationHierarchyParser";
import ImportProcessStateAPISpecs from "api-specifications/importProcessState";
import ImportAPISpecs from "api-specifications/import";

const getPresignedUrls = async (filePaths: ImportAPISpecs.POST.Request.ImportFilePaths): Promise<ImportAPISpecs.POST.Request.ImportFilePaths> => {
  const s3PresignedService = new S3PresignerService(getUploadBucketRegion(), getUploadBucketName());
  const promises = Object.entries(filePaths).map(async (entry) => {
    return {[entry[0]]: await s3PresignedService.getPresignedGet(entry[1])};
  });
  return Object.assign({}, ...await Promise.all(promises));
};

export const parseFiles = async (event: ImportAPISpecs.POST.Request.Payload) => {
  const modelId = event.modelId;
  // Get the model to import into
  const importProcessStateId = (await getRepositoryRegistry().modelInfo.getModelById(event.modelId) as IModelInfo).importProcessState.id;
  // Generate the presigned urls for the files
  const downloadUrls = await getPresignedUrls(event.filePaths);

  const importIdToDBIdMap: Map<string, string> = new Map<string, string>();

  // Set the import process status to RUNNING
  await getRepositoryRegistry().importProcessState.create({
    modelId, id: importProcessStateId, status: ImportProcessStateAPISpecs.Enums.Status.RUNNING, result: {
      errored: false, parsingErrors: false, parsingWarnings: false
    }
  });

  // Process the files
  let parsingErrors: boolean = false;
  let parsingWarnings: boolean = false;

  let countISCOGroups = 0;
  if (downloadUrls.ISCO_GROUP) {
    const stats = await parseISCOGroupsFromUrl(modelId, downloadUrls.ISCO_GROUP, importIdToDBIdMap);
    parsingErrors = parsingErrors || stats.rowsFailed > 0;
    countISCOGroups = stats.rowsSuccess;
    console.info(`Processed ${JSON.stringify(stats)} ISCO Groups`);
  }
  if (downloadUrls.ESCO_SKILL_GROUP) {
    const stats = await parseSkillGroupsFromUrl(modelId, downloadUrls.ESCO_SKILL_GROUP, importIdToDBIdMap);
    parsingErrors = parsingErrors || stats.rowsFailed > 0;
    console.info(`Processed ${JSON.stringify(stats)} Skill Groups`);
  }
  if (downloadUrls.ESCO_SKILL) {
    const stats = await parseSkillsFromUrl(modelId, downloadUrls.ESCO_SKILL, importIdToDBIdMap);
    parsingErrors = parsingErrors || stats.rowsFailed > 0;
    console.info(`Processed ${JSON.stringify(stats)} Skills`);
  }
  let countOccupations = 0;
  if (downloadUrls.ESCO_OCCUPATION) {
    const stats = await parseOccupationsFromUrl(modelId, downloadUrls.ESCO_OCCUPATION, importIdToDBIdMap);
    parsingErrors = parsingErrors || stats.rowsFailed > 0;
    countOccupations = stats.rowsSuccess;
    console.info(`Processed ${JSON.stringify(stats)} Occupations`);
  }
  if (downloadUrls.OCCUPATION_HIERARCHY) {
    const stats = await parseOccupationHierarchyFromUrl(modelId, downloadUrls.OCCUPATION_HIERARCHY, importIdToDBIdMap);
    parsingErrors = parsingErrors || stats.rowsFailed > 0;
    console.info(`Processed ${JSON.stringify(stats)} Occupation hierarchy entries`);
    if (stats.rowsSuccess !== countISCOGroups + countOccupations - 10) {
      console.warn(`Expected to successfully process ${countISCOGroups + countOccupations - 10} (ISCO groups + Occupations - 10) hierarchy entries.`);
      parsingWarnings = true;
    }
  }

  // Set the import process status to COMPLETED
  await getRepositoryRegistry().importProcessState.update(importProcessStateId, {
    status: ImportProcessStateAPISpecs.Enums.Status.COMPLETED, result: {
      errored: false,
      parsingErrors: parsingErrors,
      parsingWarnings: parsingWarnings
    }
  });
  console.info("Import successfully finished");
};