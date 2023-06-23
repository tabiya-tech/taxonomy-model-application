import {INewISCOGroupSpec} from "esco/iscoGroup/ISCOGroup.types";
import {getRepositoryRegistry} from "server/repositoryRegistry/repositoryRegisrty";
import {
  processDownloadStream,
  processStream,
} from "import/stream/processStream";
import fs from "fs";
import {BatchProcessor} from "import/batch/BatchProcessor";
import {BatchRowProcessor, TransformRowToSpecificationFunction} from "import/parse/BatchRowProcessor";
import {HeadersValidatorFunction} from "import/parse/RowProcessor.types";
import {getStdHeadersValidator} from "import/parse/stdHeadersValidator";

// expect all columns to be in upper case
export interface IISCOGroupRow {
  ESCOURI: string,
  ORIGINUUID: string
  CODE: string
  PREFERREDLABEL: string
  ALTLABELS: string
  DESCRIPTION: string
  ID: string
}

function getHeadersValidator(modelid: string): HeadersValidatorFunction {
  return getStdHeadersValidator(modelid, ['ESCOURI', 'ID', 'ORIGINUUID', 'CODE', 'PREFERREDLABEL', 'ALTLABELS', 'DESCRIPTION']);
}

function getBatchProcessor() {
  const BATCH_SIZE: number = 5000;
  const batchProcessFn = async (specs: INewISCOGroupSpec[]) => {
    try {
      const ISCOGroupRepository = getRepositoryRegistry().ISCOGroup;
      await ISCOGroupRepository.createMany(specs);
    } catch (e: unknown) {
      console.error("Failed to process batch", e);
    }
  };
  return new BatchProcessor<INewISCOGroupSpec>(BATCH_SIZE, batchProcessFn);
}

function getRowToSpecificationTransformFn(modelId: string): TransformRowToSpecificationFunction<IISCOGroupRow, INewISCOGroupSpec> {
  return (row: IISCOGroupRow): INewISCOGroupSpec => {
    return {
      ESCOUri: row.ESCOURI ?? '',
      modelId: modelId,
      originUUID: row.ORIGINUUID ?? '',
      code: row.CODE,
      preferredLabel: row.PREFERREDLABEL,
      altLabels: row.ALTLABELS ? row.ALTLABELS.split('\n') : [],
      description: row.DESCRIPTION ?? '',
      importId: row.ID ?? '',
    };
  };
}

// function to parse from url
export async function parseISCOGroupsFromUrl(modelId: string, url: string): Promise<number> {
  const headersValidator = getHeadersValidator(modelId);
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId);
  const batchProcessor = getBatchProcessor();
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processDownloadStream(url, batchRowProcessor);
}

export async function parseISCOGroupsFromFile(modelId: string, filePath: string): Promise<number> {
  const iscoGroupsCSVFileStream = fs.createReadStream(filePath);
  const headersValidator = getHeadersValidator(modelId);
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId);
  const batchProcessor = getBatchProcessor();
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processStream<IISCOGroupRow>(iscoGroupsCSVFileStream, batchRowProcessor);
}