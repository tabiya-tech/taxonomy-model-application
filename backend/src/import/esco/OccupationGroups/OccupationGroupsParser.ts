import { IOccupationGroup, INewOccupationGroupSpecLocalized } from "esco/occupationGroup/_shared/OccupationGroup.types";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { processDownloadStream, processStream } from "import/stream/processStream";
import fs from "fs";
import { BatchProcessor } from "import/batch/BatchProcessor";
import { BatchRowProcessor, TransformRowToSpecificationFunction } from "import/parse/BatchRowProcessor";
import { HeadersValidatorFunction } from "import/parse/RowProcessor.types";
import { RowsProcessedStats } from "import/rowsProcessedStats.types";
import { getProcessLocalizedEntityBatchFunction } from "import/esco/common/processEntityBatchFunction";
import {
  IOccupationGroupImportRow,
  OCCUPATION_GROUP_NON_LOCALIZABLE_HEADERS,
  OCCUPATION_GROUP_LOCALIZABLE_FIELDS,
} from "esco/common/entityToCSV.types";
import { arrayFromString } from "common/parseNewLineSeparateArray/parseNewLineSeparatedArray";
import errorLogger from "common/errorLogger/errorLogger";
import { getOccupationGroupTypeFromCSVObjectType } from "import/esco/common/getEntityTypeFromCSVObjectType";
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
    OCCUPATION_GROUP_NON_LOCALIZABLE_HEADERS,
    OCCUPATION_GROUP_LOCALIZABLE_FIELDS,
    availableLanguages,
    ctx
  );
}

function getBatchProcessor(importIdToDBIdMap: Map<string, string>) {
  const BATCH_SIZE: number = 5000;
  const batchProcessFn = getProcessLocalizedEntityBatchFunction<IOccupationGroup, INewOccupationGroupSpecLocalized>(
    "OccupationGroup",
    getRepositoryRegistry().OccupationGroup,
    importIdToDBIdMap
  );
  return new BatchProcessor<INewOccupationGroupSpecLocalized>(BATCH_SIZE, batchProcessFn);
}

function getRowToSpecificationTransformFn(
  modelId: string,
  ctx: LocalizedParseContext
): TransformRowToSpecificationFunction<IOccupationGroupImportRow, INewOccupationGroupSpecLocalized> {
  return (row: IOccupationGroupImportRow): INewOccupationGroupSpecLocalized | null => {
    const mode = ctx.mode ?? "legacy";
    const languages = ctx.languages ?? [];

    const { translatedArray: altLabels, duplicateCounts } = assembleTranslatedArray(row, "ALTLABELS", mode, languages);
    for (const [langKey, count] of duplicateCounts.entries()) {
      if (count > 0) {
        errorLogger.logWarning(
          `Warning while importing OccupationGroup row with id:'${row.ID}'. AltLabels (${langKey}) contain ${count} duplicates.`
        );
      }
    }

    const preferredLabel = assembleTranslatedString(row, "PREFERREDLABEL", mode, languages);
    const missingLangs = checkPreferredLabelInAltLabels(preferredLabel, altLabels);
    for (const langKey of missingLangs) {
      errorLogger.logWarning(
        `Warning while importing Occupation Group row with id:'${
          row.ID
        }'. Preferred label (${langKey}) '${preferredLabel.get(
          langKey as LanguageAPISpecs.Types.LanguageDbKeyName
        )}' is not in the alt labels.`
      );
    }

    const groupType = getOccupationGroupTypeFromCSVObjectType(row.GROUPTYPE);
    if (groupType === null) {
      errorLogger.logWarning(`Failed to import Occupation row with id:'${row.ID}'. OccupationType not found/invalid.`);
      return null;
    }

    return {
      originUri: row.ORIGINURI,
      modelId: modelId,
      UUIDHistory: arrayFromString(row.UUIDHISTORY),
      code: row.CODE,
      groupType: groupType,
      preferredLabel,
      altLabels,
      description: assembleTranslatedString(row, "DESCRIPTION", mode, languages),
      importId: row.ID,
    };
  };
}

export async function parseOccupationGroupsFromUrl(
  modelId: string,
  url: string,
  importIdToDBIdMap: Map<string, string>,
  availableLanguages: string[] = []
): Promise<RowsProcessedStats> {
  const ctx: LocalizedParseContext = {};
  const headersValidator = getHeadersValidator("OccupationGroup", availableLanguages, ctx);
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId, ctx);
  const batchProcessor = getBatchProcessor(importIdToDBIdMap);
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processDownloadStream(url, "OccupationGroup", batchRowProcessor);
}

export async function parseOccupationGroupsFromFile(
  modelId: string,
  filePath: string,
  importIdToDBIdMap: Map<string, string>,
  availableLanguages: string[] = []
): Promise<RowsProcessedStats> {
  const occupationGroupsCSVFileStream = fs.createReadStream(filePath);
  const ctx: LocalizedParseContext = {};
  const headersValidator = getHeadersValidator("OccupationGroup", availableLanguages, ctx);
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId, ctx);
  const batchProcessor = getBatchProcessor(importIdToDBIdMap);
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processStream<IOccupationGroupImportRow>(
    "OccupationGroup",
    occupationGroupsCSVFileStream,
    batchRowProcessor
  );
}
