import {getRepositoryRegistry} from "server/repositoryRegistry/repositoryRegisrty";
import {
  CompletedFunction,
  HeadersValidatorFunction,
  processDownloadStream,
  processStream,
  RowProcessorFunction
} from "import/stream/processStream";
import fs from "fs";
import {INewSkillGroupSpec} from "esco/skillGroup/skillGroupModel";
import {getStdHeadersValidator} from "import/stdHeadersValidator";
import {BatchProcessor} from "import/batch/BatchProcessor";

// expect all columns to be in upper case
export interface ISkillGroupRow {
  ESCOURI: string,
  ORIGINUUID: string
  CODE: string
  PREFERREDLABEL: string
  ALTLABELS: string
  DESCRIPTION: string
  SCOPENOTE: string
}

export function getHeadersValidator(modelid: string): HeadersValidatorFunction {
  return getStdHeadersValidator(modelid, ['ESCOURI', 'ORIGINUUID', 'CODE', 'PREFERREDLABEL', 'ALTLABELS', 'DESCRIPTION', 'SCOPENOTE']);
}

function getBatchProcessor() {
  const BATCH_SIZE: number = 5000;
  const batchProcessFn = async (specs: INewSkillGroupSpec[]) => {
    try {
      const skillGroupRepository = getRepositoryRegistry().skillGroup;
      await skillGroupRepository.batchCreate(specs);
    } catch (e: unknown) {
      console.error("Failed to process batch", e);
    }
  };
  return new BatchProcessor<INewSkillGroupSpec>(BATCH_SIZE, batchProcessFn);
}
export function getRowProcessor(modelId: string, batchProcessor: BatchProcessor<INewSkillGroupSpec>): RowProcessorFunction<ISkillGroupRow> {
  return async (row: ISkillGroupRow) => {
    const spec: INewSkillGroupSpec = {
      ESCOUri: row.ESCOURI ?? '',
      modelId: modelId,
      originUUID: row.ORIGINUUID ?? '',
      code: row.CODE ?? '',
      preferredLabel: row.PREFERREDLABEL,
      altLabels: row.ALTLABELS ? row.ALTLABELS.split('\n') : [],
      description: row.DESCRIPTION ?? '',
      scopeNote: row.SCOPENOTE ?? ''
    };
    await batchProcessor.add(spec);
  };
}

export function getCompletedProcessor(batchProcessor: BatchProcessor<INewSkillGroupSpec>): CompletedFunction {
  return async () => {
    await batchProcessor.flush();
  };
}

// function to parse from url
export async function parseSkillGroupsFromUrl(modelId: string, url: string) {
  const headersValidator = getHeadersValidator(modelId);
  const batchProcessor = getBatchProcessor();
  const rowProcessor = getRowProcessor(modelId, batchProcessor);
  const completedProcessor = getCompletedProcessor(batchProcessor);
  await processDownloadStream(url, headersValidator, rowProcessor, completedProcessor);
}

export async function parseSkillGroupsFromFile(modelId: string, filePath: string) {
  const skillGroupsCSVFileStream = fs.createReadStream(filePath );
  const headersValidator = getHeadersValidator(modelId);
  const batchProcessor = getBatchProcessor();
  const rowProcessor = getRowProcessor(modelId, batchProcessor);
  const completedProcessor = getCompletedProcessor(batchProcessor);
  await processStream<ISkillGroupRow>(skillGroupsCSVFileStream, headersValidator, rowProcessor, completedProcessor);
}
