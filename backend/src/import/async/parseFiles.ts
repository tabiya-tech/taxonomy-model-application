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
import { RemoveGeneratedUUID } from "import/removeGeneratedUUIDs/removeGeneratedUUID";

const getPresignedUrls = async (
  filePaths: ImportAPISpecs.Types.POST.Request.ImportFilePaths
): Promise<ImportAPISpecs.Types.POST.Request.ImportFilePaths> => {
  const s3PresignedService = new S3PresignerService(getUploadBucketRegion(), getUploadBucketName());
  const promises = Object.entries(filePaths).map(async (entry) => {
    return { [entry[0]]: await s3PresignedService.getPresignedGet(entry[1]) };
  });
  return Object.assign({}, ...(await Promise.all(promises)));
};

/**
 * Handles the file parsing for the import process and updates the import process state.
 *
 * @param {ImportAPISpecs.Types.POST.Request.Payload} event - The event object containing details for the import process.
 * @throws Errors from this function are expected to be caught in the calling async import handler.
 * @returns {Promise<void>}
 *
 * This function is responsible for directing the parsing of csv files into database entities.
 * It retrieves modelId of the model to import to and the filepaths of csv files in S3, gets presigned URLs for the files, and then parses the files.
 * It also handles the updating of the import process state.
 * The function is designed to throw errors for explicit error handling in the higher-level async import logic.
 * These errors should be caught and processed by the calling function to manage retries, cleanup operations, or state updates as necessary.
 */

export const parseFiles = async (event: ImportAPISpecs.Types.POST.Request.Payload): Promise<void> => {
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
  if (downloadUrls.ISCO_GROUPS) {
    const stats = await parseISCOGroupsFromUrl(modelId, downloadUrls.ISCO_GROUPS, importIdToDBIdMap);
    countISCOGroups = stats.rowsSuccess;
    console.info(`Processed ${JSON.stringify(stats)} ISCO Groups`);
  }
  if (downloadUrls.ESCO_SKILL_GROUPS) {
    const stats = await parseSkillGroupsFromUrl(modelId, downloadUrls.ESCO_SKILL_GROUPS, importIdToDBIdMap);
    console.info(`Processed ${JSON.stringify(stats)} Skill Groups`);
  }
  if (downloadUrls.ESCO_SKILLS) {
    const stats = await parseSkillsFromUrl(modelId, downloadUrls.ESCO_SKILLS, importIdToDBIdMap);
    console.info(`Processed ${JSON.stringify(stats)} Skills`);
  }
  let countOccupations = 0;
  if (downloadUrls.OCCUPATIONS) {
    const stats = await parseOccupationsFromUrl(modelId, downloadUrls.OCCUPATIONS, importIdToDBIdMap);
    countOccupations += stats.rowsSuccess;
    console.info(`Processed ${JSON.stringify(stats)}  Occupations`);
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
  if (downloadUrls.OCCUPATION_SKILL_RELATIONS) {
    const stats = await parseOccupationToSkillRelationFromUrl(
      modelId,
      downloadUrls.OCCUPATION_SKILL_RELATIONS,
      importIdToDBIdMap
    );
    console.info(`Processed ${JSON.stringify(stats)} Occupation to skill relation entries`);
  }

  if (event.isOriginalESCOModel) {
    await new RemoveGeneratedUUID(
      getRepositoryRegistry().occupation.Model,
      getRepositoryRegistry().skill.Model,
      getRepositoryRegistry().skillGroup.Model,
      getRepositoryRegistry().ISCOGroup.Model,
      getRepositoryRegistry().modelInfo.Model
    ).removeUUIDFromHistory(modelId);
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
