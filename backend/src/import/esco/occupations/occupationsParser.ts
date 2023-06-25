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
import {INewOccupationSpec} from "esco/occupation/occupation.types";
import {isSpecified} from "server/isUnspecified";
import {RowsProcessedStats} from "import/rowsProcessedStats.types";

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

function getHeadersValidator(modelid: string): HeadersValidatorFunction {
  return getStdHeadersValidator(
    modelid,
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
  const batchProcessFn = async (specs: INewOccupationSpec[]) => {
    const stats: RowsProcessedStats = {
      rowsProcessed: specs.length,
      rowsSuccess: 0,
      rowsFailed: 0
    };
    try {
      const OccupationRepository = getRepositoryRegistry().occupation;
      const occupations = await OccupationRepository.createMany(specs);
      // map the importId to the db id
      // They will be used in a later stage to build the hierarchy and associations
      occupations.forEach((occupation) => {
        if (isSpecified(occupation.importId)) {
          importIdToDBIdMap.set(occupation.importId, occupation.id);
        }
      });
      stats.rowsSuccess = occupations.length;
    } catch (e: unknown) {
      console.error("Failed to process batch", e);
    }
    stats.rowsFailed = specs.length - stats.rowsSuccess;
    return stats;
  };
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
  const headersValidator = getHeadersValidator(modelId);
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId);
  const batchProcessor = getBatchProcessor(importIdToDBIdMap);
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processDownloadStream(url, batchRowProcessor);
}

export async function parseOccupationsFromFile(modelId: string, filePath: string, importIdToDBIdMap: Map<string, string>): Promise<RowsProcessedStats> {
  const OccupationsCSVFileStream = fs.createReadStream(filePath);
  const headersValidator = getHeadersValidator(modelId);
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId);
  const batchProcessor = getBatchProcessor(importIdToDBIdMap);
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processStream<IOccupationRow>(OccupationsCSVFileStream, batchRowProcessor);
}
