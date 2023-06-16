import {INewISCOGroupSpec} from "esco/iscoGroup/ISCOGroupModel";
import {getRepositoryRegistry} from "server/repositoryRegistry/repositoryRegisrty";
import {
  CompletedFunction,
  HeadersValidatorFunction,
  processDownloadStream,
  processStream,
  RowProcessorFunction
} from "import/stream/processStream";
import fs from "fs";
import {getStdHeadersValidator} from "import/stdHeadersValidator";
import {BatchProcessor} from "import/batch/BatchProcessor";

// expect all columns to be in upper case
export interface IISCOGroupRow {
  ESCOURI: string,
  ORIGINUUID: string
  CODE: string
  PREFERREDLABEL: string
  ALTLABELS: string
  DESCRIPTION: string
}

export function getHeadersValidator(modelid: string): HeadersValidatorFunction {
  return getStdHeadersValidator(modelid, ['ESCOURI', 'ORIGINUUID', 'CODE', 'PREFERREDLABEL', 'ALTLABELS', 'DESCRIPTION']);
}

function getBatchProcessor() {
  const BATCH_SIZE: number = 5000;
  const batchProcessFn = async (specs: INewISCOGroupSpec[]) => {
    try {
      const ISCOGroupRepository = getRepositoryRegistry().ISCOGroup;
      await ISCOGroupRepository.batchCreate(specs);
    } catch (e: unknown) {
      console.error("Failed to process batch", e);
    }
  };
  return new BatchProcessor<INewISCOGroupSpec>(BATCH_SIZE, batchProcessFn);
}

export function getRowProcessor(modelId: string, batchProcessor: BatchProcessor<INewISCOGroupSpec>): RowProcessorFunction<IISCOGroupRow> {
  return async (row: IISCOGroupRow) => {
    const spec: INewISCOGroupSpec = {
      ESCOUri: row.ESCOURI ?? '',
      modelId: modelId,
      originUUID: row.ORIGINUUID ?? '',
      code: row.CODE,
      preferredLabel: row.PREFERREDLABEL,
      altLabels: row.ALTLABELS ? row.ALTLABELS.split('\n') : [],
      description: row.DESCRIPTION ?? ''
    };
    await batchProcessor.add(spec);
  };
}

export function getCompletedProcessor(batchProcessor: BatchProcessor<INewISCOGroupSpec>): CompletedFunction {
  return async () => {
    await batchProcessor.flush();
  };
}

// function to parse from url
export async function parseISCOGroupsFromUrl(modelId: string, url: string): Promise<void> {
  const headersValidator = getHeadersValidator(modelId);
  const batchProcessor = getBatchProcessor();
  const rowProcessor = getRowProcessor(modelId, batchProcessor);
  const completedProcessor = getCompletedProcessor(batchProcessor);
  await processDownloadStream(url, headersValidator, rowProcessor, completedProcessor);
}

export async function parseISCOGroupsFromFile(modelId: string, filePath: string): Promise<void> {
  const iscoGroupsCSVFileStream = fs.createReadStream(filePath);
  const headersValidator = getHeadersValidator(modelId);
  const batchProcessor = getBatchProcessor();
  const rowProcessor = getRowProcessor(modelId, batchProcessor);
  const completedProcessor = getCompletedProcessor(batchProcessor);
  await processStream<IISCOGroupRow>(iscoGroupsCSVFileStream, headersValidator, rowProcessor, completedProcessor);
}
