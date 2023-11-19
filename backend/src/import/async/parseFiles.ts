import { S3PresignerService } from "./S3PresignerService";
import { getUploadBucketName, getUploadBucketRegion } from "server/config/config";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { IModelInfo } from "modelInfo/modelInfo.types";
import { parseISCOGroupsFromUrl } from "import/esco/ISCOGroups/ISCOGroupsParser";
import { parseSkillGroupsFromUrl } from "import/esco/skillGroups/skillGroupsParser";
import { parseSkillsFromUrl } from "import/esco/skills/skillsParser";
import { parseOccupationsFromUrl } from "import/esco/occupations/occupationsParser";
import { parseOccupationHierarchyFromUrl } from "import/esco/occupationHierarchy/occupationHierarchyParser";
import ImportProcessStateAPISpecs from "api-specifications/importProcessState";
import ImportAPISpecs from "api-specifications/import";
import errorLogger from "common/errorLogger/errorLogger";
import { parseSkillHierarchyFromUrl } from "import/esco/skillHierarchy/skillHierarchyParser";
import { parseSkillToSkillRelationFromUrl } from "import/esco/skillToSkillRelation/skillToSkillRelationParser";
import { parseOccupationToSkillRelationFromUrl } from "import/esco/occupationToSkillRelation/occupationToSkillRelationParser";
import { parseLocalizedOccupationsFromUrl } from "import/esco/localizedOccupations/localizedOccupationsParser";

const getPresignedUrls = async (
  filePaths: ImportAPISpecs.Types.POST.Request.ImportFilePaths
): Promise<ImportAPISpecs.Types.POST.Request.ImportFilePaths> => {
  const s3PresignedService = new S3PresignerService(getUploadBucketRegion(), getUploadBucketName());
  const promises = Object.entries(filePaths).map(async (entry) => {
    return { [entry[0]]: await s3PresignedService.getPresignedGet(entry[1]) };
  });
  return Object.assign({}, ...(await Promise.all(promises)));
};

export const parseFiles = async (event: ImportAPISpecs.Types.POST.Request.Payload) => {
  const modelId = event.modelId;
  // Get the model to import into
  const importProcessStateId = ((await getRepositoryRegistry().modelInfo.getModelById(event.modelId)) as IModelInfo)
    .importProcessState.id;
  // Generate the presigned urls for the files
  const downloadUrls = await getPresignedUrls(event.filePaths);

  const importIdToDBIdMap: Map<string, string> = new Map<string, string>();

  // Set the import process status to RUNNING
  await getRepositoryRegistry().importProcessState.create({
    modelId,
    id: importProcessStateId,
    status: ImportProcessStateAPISpecs.Enums.Status.RUNNING,
    result: {
      errored: false,
      parsingErrors: false,
      parsingWarnings: false,
    },
  });

  // Process the files
  let countISCOGroups = 0;
  if (downloadUrls.ISCO_GROUP) {
    const stats = await parseISCOGroupsFromUrl(modelId, downloadUrls.ISCO_GROUP, importIdToDBIdMap);
    countISCOGroups = stats.rowsSuccess;
    console.info(`Processed ${JSON.stringify(stats)} ISCO Groups`);
  }
  if (downloadUrls.ESCO_SKILL_GROUP) {
    const stats = await parseSkillGroupsFromUrl(modelId, downloadUrls.ESCO_SKILL_GROUP, importIdToDBIdMap);
    console.info(`Processed ${JSON.stringify(stats)} Skill Groups`);
  }
  if (downloadUrls.ESCO_SKILL) {
    const stats = await parseSkillsFromUrl(modelId, downloadUrls.ESCO_SKILL, importIdToDBIdMap);
    console.info(`Processed ${JSON.stringify(stats)} Skills`);
  }
  let countOccupations = 0;
  if (downloadUrls.ESCO_OCCUPATION) {
    const stats = await parseOccupationsFromUrl(modelId, downloadUrls.ESCO_OCCUPATION, importIdToDBIdMap, false);
    countOccupations = stats.rowsSuccess;
    console.info(`Processed ${JSON.stringify(stats)} ESCO Occupations`);
  }
  if (downloadUrls.LOCAL_OCCUPATION) {
    const stats = await parseOccupationsFromUrl(modelId, downloadUrls.LOCAL_OCCUPATION, importIdToDBIdMap, true);
    countOccupations += stats.rowsSuccess;
    console.info(`Processed ${JSON.stringify(stats)} Local Occupations`);
  }
  if (downloadUrls.LOCALIZED_OCCUPATION) {
    const stats = await parseLocalizedOccupationsFromUrl(modelId, downloadUrls.LOCALIZED_OCCUPATION, importIdToDBIdMap);
    console.info(`Processed ${JSON.stringify(stats)} Localized Occupations`);
  }
  if (downloadUrls.OCCUPATION_HIERARCHY) {
    const stats = await parseOccupationHierarchyFromUrl(modelId, downloadUrls.OCCUPATION_HIERARCHY, importIdToDBIdMap);
    console.info(`Processed ${JSON.stringify(stats)} Occupation hierarchy entries`);
    if (stats.rowsSuccess !== countISCOGroups + countOccupations - 10) {
      errorLogger.logWarning(
        `Expected to successfully process ${
          countISCOGroups + countOccupations - 10
        } (ISCO groups + Occupations (Local and ESCO) - 10) hierarchy entries. Instead processed ${
          stats.rowsSuccess
        } entries.`
      );
    }
  }
  if (downloadUrls.ESCO_SKILL_HIERARCHY) {
    const stats = await parseSkillHierarchyFromUrl(modelId, downloadUrls.ESCO_SKILL_HIERARCHY, importIdToDBIdMap);
    console.info(`Processed ${JSON.stringify(stats)} Skill hierarchy entries`);
  }
  if (downloadUrls.ESCO_SKILL_SKILL_RELATIONS) {
    const stats = await parseSkillToSkillRelationFromUrl(
      modelId,
      downloadUrls.ESCO_SKILL_SKILL_RELATIONS,
      importIdToDBIdMap
    );
    console.info(`Processed ${JSON.stringify(stats)} Skill to skill relation entries`);
  }
  if (downloadUrls.OCCUPATION_SKILL_RELATION) {
    const stats = await parseOccupationToSkillRelationFromUrl(
      modelId,
      downloadUrls.OCCUPATION_SKILL_RELATION,
      importIdToDBIdMap
    );
    console.info(`Processed ${JSON.stringify(stats)} Occupation to skill relation entries`);
  }

  // Set the import process status to COMPLETED
  const state = {
    status: ImportProcessStateAPISpecs.Enums.Status.COMPLETED,
    result: {
      errored: false,
      parsingErrors: errorLogger.errorCount > 0,
      parsingWarnings: errorLogger.warningCount > 0,
    },
  };
  await getRepositoryRegistry().importProcessState.update(importProcessStateId, state);
  console.info("Import completed", state);
};
