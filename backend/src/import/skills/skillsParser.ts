import {getRepositoryRegistry} from "server/repositoryRegistry/repositoryRegisrty";
import {
  CompletedFunction,
  HeadersValidatorFunction,
  processDownloadStream,
  processStream,
  RowProcessorFunction
} from "import/stream/processStream";
import fs from "fs";
import {INewSkillSpec, ReuseLevel, SkillType} from "esco/skill/skillModel";
import {getStdHeadersValidator} from "import/stdHeadersValidator";
import {BatchProcessor} from "import/batch/BatchProcessor";

// expect all columns to be in upper case
export interface ISkillRow {
  ESCOURI: string,
  ORIGINUUID: string
  PREFERREDLABEL: string
  ALTLABELS: string
  DESCRIPTION: string
  DEFINITION: string
  SCOPENOTE: string
  REUSELEVEL: string
  SKILLTYPE: string
}

export function getHeadersValidator(modelId: string): HeadersValidatorFunction {
  return getStdHeadersValidator(modelId, ['ESCOURI', 'ORIGINUUID', 'PREFERREDLABEL', 'ALTLABELS', 'DESCRIPTION', 'DEFINITION', 'SCOPENOTE', 'REUSELEVEL', 'SKILLTYPE']);
}

function getBatchProcessor() {
  const BATCH_SIZE: number = 5000;
  const batchProcessFn = async (specs: INewSkillSpec[]) => {
    try {
      const skillRepository = getRepositoryRegistry().skill;
      await skillRepository.batchCreate(specs);
    } catch (e: unknown) {
      console.error("Failed to process batch", e);
    }
  };
  return new BatchProcessor<INewSkillSpec>(BATCH_SIZE, batchProcessFn);
}

export function getRowProcessor(modelId: string, batchProcessor: BatchProcessor<INewSkillSpec>): RowProcessorFunction<ISkillRow> {
  return async (row: ISkillRow) => {
    // @ts-ignore
    const spec: INewSkillSpec = {
      ESCOUri: row.ESCOURI ?? '',
      modelId: modelId,
      originUUID: row.ORIGINUUID ?? '',
      preferredLabel: row.PREFERREDLABEL,
      altLabels: row.ALTLABELS ? row.ALTLABELS.split('\n') : [],
      description: row.DESCRIPTION ?? '',
      definition: row.DEFINITION ?? '',
      scopeNote: row.SCOPENOTE ?? '',
      reuseLevel: row.REUSELEVEL as ReuseLevel ?? '',
      skillType: row.SKILLTYPE as SkillType ?? '',
    };
    await batchProcessor.add(spec);
  };
}

export function getCompletedProcessor(batchProcessor: BatchProcessor<INewSkillSpec>): CompletedFunction {
  return async () => {
    await batchProcessor.flush();
  };
}

// function to parse from url
export async function parseSkillsFromUrl(modelId: string, url: string) {
  const headersValidator = getHeadersValidator(modelId);
  const batchProcessor = getBatchProcessor();
  const rowProcessor = getRowProcessor(modelId, batchProcessor);
  const completedProcessor = getCompletedProcessor(batchProcessor);
  await processDownloadStream(url, headersValidator, rowProcessor, completedProcessor);
}

export async function parseSkillsFromFile(modelId: string, filePath: string) {
  const skillsCSVFileStream = fs.createReadStream(filePath);
  const headersValidator = getHeadersValidator(modelId);
  const batchProcessor = getBatchProcessor();
  const rowProcessor = getRowProcessor(modelId, batchProcessor);
  const completedProcessor = getCompletedProcessor(batchProcessor);
  await processStream<ISkillRow>(skillsCSVFileStream, headersValidator, rowProcessor, completedProcessor);
}
