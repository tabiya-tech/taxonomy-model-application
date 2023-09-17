import {getRepositoryRegistry} from "server/repositoryRegistry/repositoryRegistry";
import {
  processDownloadStream,
  processStream,
} from "import/stream/processStream";
import fs from "fs";
import {BatchProcessor} from "import/batch/BatchProcessor";
import {BatchRowProcessor, TransformRowToSpecificationFunction} from "import/parse/BatchRowProcessor";
import {HeadersValidatorFunction} from "import/parse/RowProcessor.types";
import {getStdHeadersValidator} from "import/parse/stdHeadersValidator";
import {INewOccupationSpec, IOccupation} from "esco/occupation/occupation.types";
import {RowsProcessedStats} from "import/rowsProcessedStats.types";
import {getProcessEntityBatchFunction} from "import/esco/common/processEntityBatchFunction";

// expect all columns to be in upper case
export interface IOccupationRow {
  ESCOURI: string,
  ORIGINUUID: string
  ISCOGROUPCODE: string
  CODE: string
  PREFERREDLABEL: string
  ALTLABELS: string
  DESCRIPTION: string
  DEFINITION: string
  SCOPENOTE: string
  REGULATEDPROFESSIONNOTE: string,
  ID: string
}

function getHeadersValidator(validatorName: string): HeadersValidatorFunction {
  return getStdHeadersValidator(
    validatorName,
    ['ESCOURI',
      'ID',
      'ORIGINUUID',
      'ISCOGROUPCODE',
      'CODE',
      'PREFERREDLABEL',
      'ALTLABELS',
      'DESCRIPTION',
      'DEFINITION',
      'SCOPENOTE',
      'REGULATEDPROFESSIONNOTE']
  );
}

function getBatchProcessor(importIdToDBIdMap: Map<string, string>) {
  const BATCH_SIZE: number = 5000;
  const batchProcessFn = getProcessEntityBatchFunction<IOccupation, INewOccupationSpec>("Occupation", getRepositoryRegistry().occupation, importIdToDBIdMap);
  return new BatchProcessor<INewOccupationSpec>(BATCH_SIZE, batchProcessFn);
}

function getRowToSpecificationTransformFn(modelId: string): TransformRowToSpecificationFunction<IOccupationRow, INewOccupationSpec> {
  return (row: IOccupationRow) => {
    return {
      ESCOUri: row.ESCOURI ?? '',
      modelId: modelId,
      originUUID: row.ORIGINUUID ?? '',
      ISCOGroupCode: row.ISCOGROUPCODE,
      code: row.CODE,
      preferredLabel: row.PREFERREDLABEL,
      altLabels: row.ALTLABELS ? row.ALTLABELS.split('\n') : [],
      description: row.DESCRIPTION ?? '',
      definition: row.DEFINITION ?? '',
      scopeNote: row.SCOPENOTE ?? '',
      regulatedProfessionNote: row.REGULATEDPROFESSIONNOTE ?? '',
      importId: row.ID ?? ''
    };
  };
}

// function to parse from url
export async function parseOccupationsFromUrl(modelId: string, url: string, importIdToDBIdMap: Map<string, string>): Promise<RowsProcessedStats> {
  const headersValidator = getHeadersValidator("Occupation");
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId);
  const batchProcessor = getBatchProcessor(importIdToDBIdMap);
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processDownloadStream(url, "Occupation", batchRowProcessor);
}

export async function parseOccupationsFromFile(modelId: string, filePath: string, importIdToDBIdMap: Map<string, string>): Promise<RowsProcessedStats> {
  const OccupationsCSVFileStream = fs.createReadStream(filePath);
  const headersValidator = getHeadersValidator("Occupation");
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId);
  const batchProcessor = getBatchProcessor(importIdToDBIdMap);
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processStream<IOccupationRow>("Occupation", OccupationsCSVFileStream, batchRowProcessor);
}