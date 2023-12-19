import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { processDownloadStream, processStream } from "import/stream/processStream";
import fs from "fs";
import { INewSkillGroupSpec, ISkillGroup } from "esco/skillGroup/skillGroup.types";
import { BatchProcessor } from "import/batch/BatchProcessor";
import { BatchRowProcessor, TransformRowToSpecificationFunction } from "import/parse/BatchRowProcessor";
import { HeadersValidatorFunction } from "import/parse/RowProcessor.types";
import { getStdHeadersValidator } from "import/parse/stdHeadersValidator";
import { RowsProcessedStats } from "import/rowsProcessedStats.types";
import { getProcessEntityBatchFunction } from "import/esco/common/processEntityBatchFunction";
import { ISkillGroupImportRow, skillGroupImportHeaders } from "esco/common/entityToCSV.types";

// expect all columns to be in upper case
function getHeadersValidator(validatorName: string): HeadersValidatorFunction {
  return getStdHeadersValidator(validatorName, skillGroupImportHeaders);
}

function getBatchProcessor(importIdToDBIdMap: Map<string, string>) {
  const BATCH_SIZE: number = 5000;
  const batchProcessFn = getProcessEntityBatchFunction<ISkillGroup, INewSkillGroupSpec>(
    "SkillGroup",
    getRepositoryRegistry().skillGroup,
    importIdToDBIdMap
  );
  return new BatchProcessor<INewSkillGroupSpec>(BATCH_SIZE, batchProcessFn);
}

function getRowToSpecificationTransformFn(
  modelId: string
): TransformRowToSpecificationFunction<ISkillGroupImportRow, INewSkillGroupSpec> {
  return (row: ISkillGroupImportRow) => {
    return {
      ESCOUri: row.ESCOURI,
      modelId: modelId,
      UUIDHistory: row.UUIDHISTORY ? row.UUIDHISTORY.split("\n") : [],
      code: row.CODE,
      preferredLabel: row.PREFERREDLABEL,
      altLabels: row.ALTLABELS ? row.ALTLABELS.split("\n") : [],
      description: row.DESCRIPTION,
      scopeNote: row.SCOPENOTE,
      importId: row.ID,
    };
  };
}

// function to parse from url
export async function parseSkillGroupsFromUrl(
  modelId: string,
  url: string,
  importIdToDBIdMap: Map<string, string>
): Promise<RowsProcessedStats> {
  const headersValidator = getHeadersValidator("SkillGroup");
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId);
  const batchProcessor = getBatchProcessor(importIdToDBIdMap);
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processDownloadStream(url, "SkillGroup", batchRowProcessor);
}

export async function parseSkillGroupsFromFile(
  modelId: string,
  filePath: string,
  importIdToDBIdMap: Map<string, string>
): Promise<RowsProcessedStats> {
  const skillGroupsCSVFileStream = fs.createReadStream(filePath);
  const headersValidator = getHeadersValidator("SkillGroup");
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId);
  const batchProcessor = getBatchProcessor(importIdToDBIdMap);
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processStream<ISkillGroupImportRow>("SkillGroup", skillGroupsCSVFileStream, batchRowProcessor);
}
