import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { processDownloadStream, processStream } from "import/stream/processStream";
import fs from "fs";
import { BatchProcessor } from "import/batch/BatchProcessor";
import { BatchRowProcessor, TransformRowToSpecificationFunction } from "import/parse/BatchRowProcessor";
import { HeadersValidatorFunction } from "import/parse/RowProcessor.types";
import { INewOccupationSpecLocalized, IOccupation } from "esco/occupations/_shared/occupation.types";
import { RowsProcessedStats } from "import/rowsProcessedStats.types";
import { getProcessLocalizedEntityBatchFunction } from "import/esco/common/processEntityBatchFunction";
import errorLogger from "common/errorLogger/errorLogger";
import {
  RegExESCOOccupationCode,
  RegExLocalOccupationCode,
  RegExESCOLocalOccupationCode,
} from "esco/common/modelSchema";
import { ObjectTypes } from "esco/common/objectTypes";
import {
  IOccupationImportRow,
  OCCUPATION_NON_LOCALIZABLE_HEADERS,
  OCCUPATION_LOCALIZABLE_FIELDS,
} from "esco/common/entityToCSV.types";
import { getEntityTypeFromCSVObjectType } from "import/esco/common/getEntityTypeFromCSVObjectType";
import { arrayFromString } from "common/parseNewLineSeparateArray/parseNewLineSeparatedArray";
import {
  LocalizedParseContext,
  assembleTranslatedArray,
  assembleTranslatedString,
  checkPreferredLabelInAltLabels,
  getLocalizedHeadersValidator,
} from "import/parse/localizedHeaders";
import LanguageAPISpecs from "api-specifications/language";

function getHeadersValidator(
  validatorName: string,
  availableLanguages: string[],
  ctx: LocalizedParseContext
): HeadersValidatorFunction {
  return getLocalizedHeadersValidator(
    validatorName,
    OCCUPATION_NON_LOCALIZABLE_HEADERS,
    OCCUPATION_LOCALIZABLE_FIELDS,
    availableLanguages,
    ctx
  );
}

function getBatchProcessor(importIdToDBIdMap: Map<string, string>) {
  const BATCH_SIZE: number = 5000;
  const batchProcessFn = getProcessLocalizedEntityBatchFunction<IOccupation, INewOccupationSpecLocalized>(
    "Occupation",
    getRepositoryRegistry().occupation,
    importIdToDBIdMap
  );
  return new BatchProcessor<INewOccupationSpecLocalized>(BATCH_SIZE, batchProcessFn);
}

function getRowToSpecificationTransformFn(
  modelId: string,
  ctx: LocalizedParseContext
): TransformRowToSpecificationFunction<IOccupationImportRow, INewOccupationSpecLocalized> {
  return (row: IOccupationImportRow) => {
    const mode = ctx.mode ?? "legacy";
    const languages = ctx.languages ?? [];

    const occupationType = getEntityTypeFromCSVObjectType(row.OCCUPATIONTYPE);
    const isLocalized = row.ISLOCALIZED.trim().toLowerCase() === "true";

    if (occupationType === null) {
      errorLogger.logWarning(`Failed to import Occupation row with id:'${row.ID}'. OccupationType not found/invalid.`);
      return null;
    }
    if (isLocalized && occupationType !== ObjectTypes.ESCOOccupation) {
      errorLogger.logWarning(
        `Failed to import Local Occupation row with id:'${row.ID}'. Local occupation cannot be localized.`
      );
      return null;
    }

    let validCode;
    if (occupationType === ObjectTypes.LocalOccupation) {
      validCode = RegExESCOLocalOccupationCode.test(row.CODE) || RegExLocalOccupationCode.test(row.CODE);
    } else {
      validCode = RegExESCOOccupationCode.test(row.CODE);
    }
    if (!validCode) {
      errorLogger.logWarning(
        `Failed to import ${
          occupationType === ObjectTypes.LocalOccupation ? "Local" : "ESCO"
        } Occupation row with id:'${row.ID}'. Code not valid.`
      );
      return null;
    }

    const { translatedArray: altLabels, duplicateCounts } = assembleTranslatedArray(row, "ALTLABELS", mode, languages);
    for (const [langKey, count] of duplicateCounts.entries()) {
      if (count > 0) {
        errorLogger.logWarning(
          `Warning while importing ${
            occupationType === ObjectTypes.LocalOccupation ? "Local" : "ESCO"
          } Occupation row with id:'${row.ID}'. AltLabels (${langKey}) contain ${count} duplicates.`
        );
      }
    }

    const preferredLabel = assembleTranslatedString(row, "PREFERREDLABEL", mode, languages);
    const missingLangs = checkPreferredLabelInAltLabels(preferredLabel, altLabels);
    for (const langKey of missingLangs) {
      errorLogger.logWarning(
        `Warning while importing Occupation row with id:'${row.ID}'. Preferred label (${langKey}) '${preferredLabel.get(
          langKey as LanguageAPISpecs.Types.LanguageDbKeyName
        )}' is not in the alt labels.`
      );
    }

    return {
      originUri: row.ORIGINURI,
      modelId: modelId,
      UUIDHistory: arrayFromString(row.UUIDHISTORY),
      occupationGroupCode: row.OCCUPATIONGROUPCODE,
      code: row.CODE,
      preferredLabel,
      altLabels,
      description: assembleTranslatedString(row, "DESCRIPTION", mode, languages),
      definition: assembleTranslatedString(row, "DEFINITION", mode, languages),
      scopeNote: assembleTranslatedString(row, "SCOPENOTE", mode, languages),
      regulatedProfessionNote: assembleTranslatedString(row, "REGULATEDPROFESSIONNOTE", mode, languages),
      importId: row.ID,
      occupationType: occupationType,
      isLocalized: isLocalized,
    };
  };
}

export async function parseOccupationsFromUrl(
  modelId: string,
  url: string,
  importIdToDBIdMap: Map<string, string>,
  availableLanguages: string[] = []
): Promise<RowsProcessedStats> {
  const ctx: LocalizedParseContext = {};
  const headersValidator = getHeadersValidator("Occupation", availableLanguages, ctx);
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId, ctx);
  const batchProcessor = getBatchProcessor(importIdToDBIdMap);
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processDownloadStream(url, "Occupation", batchRowProcessor);
}

export async function parseOccupationsFromFile(
  modelId: string,
  filePath: string,
  importIdToDBIdMap: Map<string, string>,
  availableLanguages: string[] = []
): Promise<RowsProcessedStats> {
  const OccupationsCSVFileStream = fs.createReadStream(filePath);
  const ctx: LocalizedParseContext = {};
  const headersValidator = getHeadersValidator("Occupation", availableLanguages, ctx);
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId, ctx);
  const batchProcessor = getBatchProcessor(importIdToDBIdMap);
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processStream<IOccupationImportRow>("Occupation", OccupationsCSVFileStream, batchRowProcessor);
}
