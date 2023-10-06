import { IISCOGroup, INewISCOGroupSpec } from "esco/iscoGroup/ISCOGroup.types";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import {
  processDownloadStream,
  processStream,
} from "import/stream/processStream";
import fs from "fs";
import { BatchProcessor } from "import/batch/BatchProcessor";
import {
  BatchRowProcessor,
  TransformRowToSpecificationFunction,
} from "import/parse/BatchRowProcessor";
import { HeadersValidatorFunction } from "import/parse/RowProcessor.types";
import { getStdHeadersValidator } from "import/parse/stdHeadersValidator";
import { RowsProcessedStats } from "import/rowsProcessedStats.types";
import { getProcessEntityBatchFunction } from "import/esco/common/processEntityBatchFunction";

// expect all columns to be in upper case
export interface IISCOGroupRow {
  ESCOURI: string;
  ORIGINUUID: string;
  CODE: string;
  PREFERREDLABEL: string;
  ALTLABELS: string;
  DESCRIPTION: string;
  ID: string;
}

function getHeadersValidator(validatorName: string): HeadersValidatorFunction {
  return getStdHeadersValidator(validatorName, [
    "ESCOURI",
    "ID",
    "ORIGINUUID",
    "CODE",
    "PREFERREDLABEL",
    "ALTLABELS",
    "DESCRIPTION",
  ]);
}

function getBatchProcessor(importIdToDBIdMap: Map<string, string>) {
  const BATCH_SIZE: number = 5000;
  const batchProcessFn = getProcessEntityBatchFunction<
    IISCOGroup,
    INewISCOGroupSpec
  >("ISCOGroup", getRepositoryRegistry().ISCOGroup, importIdToDBIdMap);
  return new BatchProcessor<INewISCOGroupSpec>(BATCH_SIZE, batchProcessFn);
}

function getRowToSpecificationTransformFn(
  modelId: string
): TransformRowToSpecificationFunction<IISCOGroupRow, INewISCOGroupSpec> {
  return (row: IISCOGroupRow): INewISCOGroupSpec => {
    return {
      ESCOUri: row.ESCOURI ?? "",
      modelId: modelId,
      originUUID: row.ORIGINUUID ?? "",
      code: row.CODE,
      preferredLabel: row.PREFERREDLABEL,
      altLabels: row.ALTLABELS ? row.ALTLABELS.split("\n") : [],
      description: row.DESCRIPTION ?? "",
      importId: row.ID ?? "",
    };
  };
}

// function to parse from url
export async function parseISCOGroupsFromUrl(
  modelId: string,
  url: string,
  importIdToDBIdMap: Map<string, string>
): Promise<RowsProcessedStats> {
  const headersValidator = getHeadersValidator("ISCOGroup");
  const transformRowToSpecificationFn =
    getRowToSpecificationTransformFn(modelId);
  const batchProcessor = getBatchProcessor(importIdToDBIdMap);
  const batchRowProcessor = new BatchRowProcessor(
    headersValidator,
    transformRowToSpecificationFn,
    batchProcessor
  );
  return await processDownloadStream(url, "ISCOGroup", batchRowProcessor);
}

export async function parseISCOGroupsFromFile(
  modelId: string,
  filePath: string,
  importIdToDBIdMap: Map<string, string>
): Promise<RowsProcessedStats> {
  const iscoGroupsCSVFileStream = fs.createReadStream(filePath);
  const headersValidator = getHeadersValidator("ISCOGroup");
  const transformRowToSpecificationFn =
    getRowToSpecificationTransformFn(modelId);
  const batchProcessor = getBatchProcessor(importIdToDBIdMap);
  const batchRowProcessor = new BatchRowProcessor(
    headersValidator,
    transformRowToSpecificationFn,
    batchProcessor
  );
  return await processStream<IISCOGroupRow>(
    "ISCOGroup",
    iscoGroupsCSVFileStream,
    batchRowProcessor
  );
}
