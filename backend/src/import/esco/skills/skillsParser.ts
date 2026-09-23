import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { processDownloadStream, processStream } from "import/stream/processStream";
import fs from "fs";
import { INewSkillSpecLocalized } from "esco/skill/_shared/skill.types";
import { ISkill } from "esco/skill/_shared/skill.types";
import { BatchProcessor } from "import/batch/BatchProcessor";
import { BatchRowProcessor, TransformRowToSpecificationFunction } from "import/parse/BatchRowProcessor";
import { HeadersValidatorFunction } from "import/parse/RowProcessor.types";
import { RowsProcessedStats } from "import/rowsProcessedStats.types";
import { getProcessLocalizedEntityBatchFunction } from "import/esco/common/processEntityBatchFunction";
import { ISkillImportRow } from "esco/common/entityToCSV.types";
import { getReuseLevelFromCSVReuseLevel, getSkillTypeFromCSVSkillType } from "esco/common/csvObjectTypes";
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

const SKILL_NON_LOCALIZABLE_HEADERS = ["ID", "ORIGINURI", "UUIDHISTORY", "REUSELEVEL", "SKILLTYPE", "ISLOCALIZED"];
const SKILL_LOCALIZABLE_FIELDS = ["PREFERREDLABEL", "ALTLABELS", "DESCRIPTION", "DEFINITION", "SCOPENOTE"] as const;

function getHeadersValidator(
  validatorName: string,
  availableLanguages: string[],
  ctx: { mode?: LocalizedHeaderMode; languages?: LanguageAPISpecs.Types.ILanguageConfig[] }
): HeadersValidatorFunction {
  return getLocalizedHeadersValidator(
    validatorName,
    SKILL_NON_LOCALIZABLE_HEADERS,
    SKILL_LOCALIZABLE_FIELDS,
    availableLanguages,
    ctx
  );
}

function getBatchProcessor(importIdToDBIdMap: Map<string, string>) {
  const BATCH_SIZE: number = 5000;
  const batchProcessFn = getProcessLocalizedEntityBatchFunction<ISkill, INewSkillSpecLocalized>(
    "Skill",
    getRepositoryRegistry().skill,
    importIdToDBIdMap
  );
  return new BatchProcessor<INewSkillSpecLocalized>(BATCH_SIZE, batchProcessFn);
}

function getRowToSpecificationTransformFn(
  modelId: string,
  ctx: { mode?: LocalizedHeaderMode; languages?: LanguageAPISpecs.Types.ILanguageConfig[] }
): TransformRowToSpecificationFunction<ISkillImportRow, INewSkillSpecLocalized> {
  return (row: ISkillImportRow) => {
    const mode = ctx.mode ?? "legacy";
    const languages = ctx.languages ?? [];

    const reuseLevel = getReuseLevelFromCSVReuseLevel(row.REUSELEVEL);
    if (reuseLevel === null) {
      errorLogger.logWarning(`Failed to import Skill with skillId:${row.ID}`);
      return null;
    }
    const skillType = getSkillTypeFromCSVSkillType(row.SKILLTYPE);
    if (skillType === null) {
      errorLogger.logWarning(`Failed to import Skill with skillId:${row.ID}`);
      return null;
    }

    const { translatedArray: altLabels, duplicateCounts } = assembleTranslatedArray(row, "ALTLABELS", mode, languages);
    for (const [langKey, count] of duplicateCounts.entries()) {
      if (count > 0) {
        errorLogger.logWarning(
          `Warning while importing Skill row with id:'${row.ID}'. AltLabels (${langKey}) contain ${count} duplicates.`
        );
      }
    }

    const preferredLabel = assembleTranslatedString(row, "PREFERREDLABEL", mode, languages);
    const missingLangs = checkPreferredLabelInAltLabels(preferredLabel, altLabels);
    for (const langKey of missingLangs) {
      errorLogger.logWarning(
        `Warning while importing Skill row with id:'${row.ID}'. Preferred label (${langKey}) '${preferredLabel.get(
          langKey as LanguageAPISpecs.Types.LanguageDbKeyName
        )}' is not in the alt labels.`
      );
    }

    const isLocalized = row.ISLOCALIZED.trim().toLowerCase() === "true";

    return {
      originUri: row.ORIGINURI,
      modelId: modelId,
      UUIDHistory: arrayFromString(row.UUIDHISTORY),
      preferredLabel,
      altLabels,
      description: assembleTranslatedString(row, "DESCRIPTION", mode, languages),
      definition: assembleTranslatedString(row, "DEFINITION", mode, languages),
      scopeNote: assembleTranslatedString(row, "SCOPENOTE", mode, languages),
      reuseLevel: reuseLevel,
      skillType: skillType,
      importId: row.ID,
      isLocalized: isLocalized,
    };
  };
}

export async function parseSkillsFromUrl(
  modelId: string,
  url: string,
  importIdToDBIdMap: Map<string, string>,
  availableLanguages: string[] = []
): Promise<RowsProcessedStats> {
  const ctx: { mode?: LocalizedHeaderMode; languages?: LanguageAPISpecs.Types.ILanguageConfig[] } = {};
  const headersValidator = getHeadersValidator("Skill", availableLanguages, ctx);
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId, ctx);
  const batchProcessor = getBatchProcessor(importIdToDBIdMap);
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processDownloadStream(url, "Skill", batchRowProcessor);
}

export async function parseSkillsFromFile(
  modelId: string,
  filePath: string,
  importIdToDBIdMap: Map<string, string>,
  availableLanguages: string[] = []
): Promise<RowsProcessedStats> {
  const skillsCSVFileStream = fs.createReadStream(filePath);
  const ctx: { mode?: LocalizedHeaderMode; languages?: LanguageAPISpecs.Types.ILanguageConfig[] } = {};
  const headersValidator = getHeadersValidator("Skill", availableLanguages, ctx);
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId, ctx);
  const batchProcessor = getBatchProcessor(importIdToDBIdMap);
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processStream<ISkillImportRow>("Skill", skillsCSVFileStream, batchRowProcessor);
}
