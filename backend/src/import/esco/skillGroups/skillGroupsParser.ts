import {getRepositoryRegistry} from "server/repositoryRegistry/repositoryRegisrty";
import {
  processDownloadStream,
  processStream,
} from "import/stream/processStream";
import fs from "fs";
import {INewSkillGroupSpec} from "esco/skillGroup/skillGroupModel";
import {BatchProcessor} from "import/batch/BatchProcessor";
import {BatchRowProcessor, TransformRowToSpecificationFunction} from "import/parse/BatchRowProcessor";
import {HeadersValidatorFunction} from "import/parse/RowProcessor.types";
import {getStdHeadersValidator} from "import/parse/stdHeadersValidator";

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

function getHeadersValidator(modelid: string): HeadersValidatorFunction {
  return getStdHeadersValidator(modelid, ['ESCOURI', 'ORIGINUUID', 'CODE', 'PREFERREDLABEL', 'ALTLABELS', 'DESCRIPTION', 'SCOPENOTE']);
}

function getBatchProcessor() {
  const BATCH_SIZE: number = 5000;
  const batchProcessFn = async (specs: INewSkillGroupSpec[]) => {
    try {
      const skillGroupRepository = getRepositoryRegistry().skillGroup;
      await skillGroupRepository.createMany(specs);
    } catch (e: unknown) {
      console.error("Failed to process batch", e);
    }
  };
  return new BatchProcessor<INewSkillGroupSpec>(BATCH_SIZE, batchProcessFn);
}

function getRowToSpecificationTransformFn(modelId: string): TransformRowToSpecificationFunction<ISkillGroupRow, INewSkillGroupSpec> {
  return (row: ISkillGroupRow) => {
    return {
      ESCOUri: row.ESCOURI ?? '',
      modelId: modelId,
      originUUID: row.ORIGINUUID ?? '',
      code: row.CODE ?? '',
      preferredLabel: row.PREFERREDLABEL,
      altLabels: row.ALTLABELS ? row.ALTLABELS.split('\n') : [],
      description: row.DESCRIPTION ?? '',
      scopeNote: row.SCOPENOTE ?? ''
    };
  };
}

// function to parse from url
export async function parseSkillGroupsFromUrl(modelId: string, url: string) {
  const headersValidator = getHeadersValidator(modelId);
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId);
  const batchProcessor = getBatchProcessor();
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processDownloadStream(url, batchRowProcessor);
}

export async function parseSkillGroupsFromFile(modelId: string, filePath: string) {
  const skillGroupsCSVFileStream = fs.createReadStream(filePath);
  const headersValidator = getHeadersValidator(modelId);
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId);
  const batchProcessor = getBatchProcessor();
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processStream<ISkillGroupRow>(skillGroupsCSVFileStream, batchRowProcessor);
}
