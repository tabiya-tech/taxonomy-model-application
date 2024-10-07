import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { processDownloadStream, processStream } from "import/stream/processStream";
import fs from "fs";
import { INewSkillSpec, ISkill } from "esco/skill/skills.types";
import { BatchProcessor } from "import/batch/BatchProcessor";
import { BatchRowProcessor, TransformRowToSpecificationFunction } from "import/parse/BatchRowProcessor";
import { HeadersValidatorFunction } from "import/parse/RowProcessor.types";
import { getStdHeadersValidator } from "import/parse/stdHeadersValidator";
import { RowsProcessedStats } from "import/rowsProcessedStats.types";
import { getProcessEntityBatchFunction } from "import/esco/common/processEntityBatchFunction";
import { ISkillImportRow, skillImportHeaders } from "esco/common/entityToCSV.types";
import { getReuseLevelFromCSVReuseLevel, getSkillTypeFromCSVSkillType } from "esco/common/csvObjectTypes";
import { arrayFromString, uniqueArrayFromString } from "common/parseNewLineSeparateArray/parseNewLineSeparatedArray";
import errorLogger from "common/errorLogger/errorLogger";

function getHeadersValidator(validatorName: string): HeadersValidatorFunction {
  return getStdHeadersValidator(validatorName, skillImportHeaders);
}

function getBatchProcessor(importIdToDBIdMap: Map<string, string>) {
  const BATCH_SIZE: number = 5000;
  const batchProcessFn = getProcessEntityBatchFunction<ISkill, INewSkillSpec>(
    "Skill",
    getRepositoryRegistry().skill,
    importIdToDBIdMap
  );
  return new BatchProcessor<INewSkillSpec>(BATCH_SIZE, batchProcessFn);
}

function getRowToSpecificationTransformFn(
  modelId: string
): TransformRowToSpecificationFunction<ISkillImportRow, INewSkillSpec> {
  return (row: ISkillImportRow) => {
    const reuseLevel = getReuseLevelFromCSVReuseLevel(row.REUSELEVEL);
    if (reuseLevel === null) {
      // we should check for null as reuseLevel can be ""
      errorLogger.logWarning(`Failed to import Skill with skillId:${row.ID}`);
      return null;
    }
    const skillType = getSkillTypeFromCSVSkillType(row.SKILLTYPE);
    if (skillType === null) {
      // we should check for null as skillType can be ""
      errorLogger.logWarning(`Failed to import Skill with skillId:${row.ID}`);
      return null;
    }
    const { uniqueArray: uniqueAltLabels, duplicateCount } = uniqueArrayFromString(row.ALTLABELS);
    if (duplicateCount) {
      errorLogger.logWarning(
        `Warning while importing Skill row with id:'${row.ID}'. AltLabels contain ${duplicateCount} duplicates.`
      );
    }

    // warning if the preferred label is not in the alt labels
    if (row.PREFERREDLABEL && !uniqueAltLabels.includes(row.PREFERREDLABEL)) {
      errorLogger.logWarning(
        `Warning while importing Skill row with id:'${row.ID}'. Preferred label '${row.PREFERREDLABEL}' is not in the alt labels.`
      );
    }

    return {
      originUri: row.ORIGINURI,
      modelId: modelId,
      UUIDHistory: arrayFromString(row.UUIDHISTORY),
      preferredLabel: row.PREFERREDLABEL,
      altLabels: uniqueAltLabels,
      description: row.DESCRIPTION,
      definition: row.DEFINITION,
      scopeNote: row.SCOPENOTE,
      reuseLevel: reuseLevel,
      skillType: skillType,
      importId: row.ID,
    };
  };
}

// function to parse from url
export async function parseSkillsFromUrl(
  modelId: string,
  url: string,
  importIdToDBIdMap: Map<string, string>
): Promise<RowsProcessedStats> {
  const headersValidator = getHeadersValidator("Skill");
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId);
  const batchProcessor = getBatchProcessor(importIdToDBIdMap);
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processDownloadStream(url, "Skill", batchRowProcessor);
}

export async function parseSkillsFromFile(
  modelId: string,
  filePath: string,
  importIdToDBIdMap: Map<string, string>
): Promise<RowsProcessedStats> {
  const skillsCSVFileStream = fs.createReadStream(filePath);
  const headersValidator = getHeadersValidator("Skill");
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId);
  const batchProcessor = getBatchProcessor(importIdToDBIdMap);
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processStream<ISkillImportRow>("Skill", skillsCSVFileStream, batchRowProcessor);
}
