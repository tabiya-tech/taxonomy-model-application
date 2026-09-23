import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { processDownloadStream, processStream } from "import/stream/processStream";
import fs from "fs";
import { INewSkillGroupSpecLocalized, ISkillGroup } from "esco/skillGroup/_shared/skillGroup.types";
import { BatchProcessor } from "import/batch/BatchProcessor";
import { BatchRowProcessor, TransformRowToSpecificationFunction } from "import/parse/BatchRowProcessor";
import { HeadersValidatorFunction } from "import/parse/RowProcessor.types";
import { RowsProcessedStats } from "import/rowsProcessedStats.types";
import { getProcessLocalizedEntityBatchFunction } from "import/esco/common/processEntityBatchFunction";
import { ISkillGroupImportRow } from "esco/common/entityToCSV.types";
import { arrayFromString } from "common/parseNewLineSeparateArray/parseNewLineSeparatedArray";
import errorLogger from "common/errorLogger/errorLogger";
import {
  LocalizedHeaderMode,
  assembleTranslatedArray,
  assembleTranslatedString,
  checkPreferredLabelInAltLabels,
  getLocalizedHeadersValidator,
} from "import/parse/localizedHeaders";
import LanguageAPISpecs from "api-specifications/language";

const SKILL_GROUP_NON_LOCALIZABLE_HEADERS = ["ID", "ORIGINURI", "UUIDHISTORY", "CODE"];
const SKILL_GROUP_LOCALIZABLE_FIELDS = ["PREFERREDLABEL", "ALTLABELS", "DESCRIPTION", "SCOPENOTE"] as const;

function getHeadersValidator(
  validatorName: string,
  availableLanguages: string[],
  ctx: { mode?: LocalizedHeaderMode; languages?: LanguageAPISpecs.Types.ILanguageConfig[] }
): HeadersValidatorFunction {
  return getLocalizedHeadersValidator(
    validatorName,
    SKILL_GROUP_NON_LOCALIZABLE_HEADERS,
    SKILL_GROUP_LOCALIZABLE_FIELDS,
    availableLanguages,
    ctx
  );
}

function getBatchProcessor(importIdToDBIdMap: Map<string, string>) {
  const BATCH_SIZE: number = 5000;
  const batchProcessFn = getProcessLocalizedEntityBatchFunction<ISkillGroup, INewSkillGroupSpecLocalized>(
    "SkillGroup",
    getRepositoryRegistry().skillGroup,
    importIdToDBIdMap
  );
  return new BatchProcessor<INewSkillGroupSpecLocalized>(BATCH_SIZE, batchProcessFn);
}

function getRowToSpecificationTransformFn(
  modelId: string,
  ctx: { mode?: LocalizedHeaderMode; languages?: LanguageAPISpecs.Types.ILanguageConfig[] }
): TransformRowToSpecificationFunction<ISkillGroupImportRow, INewSkillGroupSpecLocalized> {
  return (row: ISkillGroupImportRow) => {
    const mode = ctx.mode ?? "legacy";
    const languages = ctx.languages ?? [];

    const { translatedArray: altLabels, duplicateCounts } = assembleTranslatedArray(row, "ALTLABELS", mode, languages);
    for (const [langKey, count] of duplicateCounts.entries()) {
      if (count > 0) {
        errorLogger.logWarning(
          `Warning while importing SkillGroup row with id:'${row.ID}'. AltLabels (${langKey}) contain ${count} duplicates.`
        );
      }
    }

    const preferredLabel = assembleTranslatedString(row, "PREFERREDLABEL", mode, languages);
    const missingLangs = checkPreferredLabelInAltLabels(preferredLabel, altLabels);
    for (const langKey of missingLangs) {
      errorLogger.logWarning(
        `Warning while importing Skill Group row with id:'${
          row.ID
        }'. Preferred label (${langKey}) '${preferredLabel.get(
          langKey as LanguageAPISpecs.Types.LanguageDbKeyName
        )}' is not in the alt labels.`
      );
    }

    return {
      originUri: row.ORIGINURI,
      modelId: modelId,
      UUIDHistory: arrayFromString(row.UUIDHISTORY),
      code: row.CODE,
      preferredLabel,
      altLabels,
      description: assembleTranslatedString(row, "DESCRIPTION", mode, languages),
      scopeNote: assembleTranslatedString(row, "SCOPENOTE", mode, languages),
      importId: row.ID,
    };
  };
}

export async function parseSkillGroupsFromUrl(
  modelId: string,
  url: string,
  importIdToDBIdMap: Map<string, string>,
  availableLanguages: string[] = []
): Promise<RowsProcessedStats> {
  const ctx: { mode?: LocalizedHeaderMode; languages?: LanguageAPISpecs.Types.ILanguageConfig[] } = {};
  const headersValidator = getHeadersValidator("SkillGroup", availableLanguages, ctx);
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId, ctx);
  const batchProcessor = getBatchProcessor(importIdToDBIdMap);
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processDownloadStream(url, "SkillGroup", batchRowProcessor);
}

export async function parseSkillGroupsFromFile(
  modelId: string,
  filePath: string,
  importIdToDBIdMap: Map<string, string>,
  availableLanguages: string[] = []
): Promise<RowsProcessedStats> {
  const skillGroupsCSVFileStream = fs.createReadStream(filePath);
  const ctx: { mode?: LocalizedHeaderMode; languages?: LanguageAPISpecs.Types.ILanguageConfig[] } = {};
  const headersValidator = getHeadersValidator("SkillGroup", availableLanguages, ctx);
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId, ctx);
  const batchProcessor = getBatchProcessor(importIdToDBIdMap);
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processStream<ISkillGroupImportRow>("SkillGroup", skillGroupsCSVFileStream, batchRowProcessor);
}
