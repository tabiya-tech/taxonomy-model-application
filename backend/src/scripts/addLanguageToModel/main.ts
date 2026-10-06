import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import LanguageAPISpecs from "api-specifications/language";
import EmbeddingsAPISpecs from "api-specifications/embeddings";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { OCCUPATION_GROUP_TRANSLATABLE_STRING_FIELDS } from "esco/occupationGroup/_shared/OccupationGroup.types";
import { OCCUPATION_TRANSLATABLE_STRING_FIELDS } from "esco/occupations/_shared/occupation.types";
import { SKILL_TRANSLATABLE_STRING_FIELDS } from "esco/skill/_shared/skill.types";
import { SKILLGROUP_TRANSLATABLE_STRING_FIELDS } from "esco/skillGroup/_shared/skillGroup.types";
import { mergeEntityLanguage } from "./mergeEntityLanguage";
import {
  AddLanguageToModelOptions,
  AddLanguageToModelResult,
  AddLanguageToModelTotals,
  EntityMergeConfig,
  EntityMergeReport,
} from "./types";

export const DEFAULT_REPORT_FILE_NAME = "add-language-report.json";

async function validateCsvFileIsReadable(entityKey: string, csvFilePath: string): Promise<void> {
  try {
    await fs.promises.access(path.resolve(csvFilePath), fs.constants.R_OK);
  } catch (error) {
    throw new Error(`${entityKey}: CSV file is not readable: ${csvFilePath}`, { cause: error });
  }
}

async function ensureOutputFolderPathIsWritable(outputFolderPath: string): Promise<void> {
  if (!outputFolderPath) {
    throw new Error("Invalid output folder path. Must be a non-empty string.");
  }
  try {
    await fs.promises.mkdir(path.resolve(outputFolderPath), { recursive: true });
  } catch (error) {
    throw new Error(`Could not create output folder path: ${outputFolderPath}`, { cause: error });
  }
  try {
    await fs.promises.access(path.resolve(outputFolderPath), fs.constants.W_OK);
  } catch (error) {
    throw new Error(`Output folder path is not writable: ${outputFolderPath}`, { cause: error });
  }
}

function getEntityMergeConfigsByKey(): Record<string, () => EntityMergeConfig> {
  const repositoryRegistry = getRepositoryRegistry();
  return {
    occupationGroups: () => ({
      entityName: "OccupationGroup",
      scalarTranslatableFieldNames: OCCUPATION_GROUP_TRANSLATABLE_STRING_FIELDS,
      hasAltLabels: true,
      findAllWithTranslations: (modelId) => repositoryRegistry.OccupationGroup.findAllWithTranslations(modelId),
      bulkSetTranslatedFields: (modelId, operations) =>
        repositoryRegistry.OccupationGroup.bulkSetTranslatedFields(modelId, operations),
    }),
    occupations: () => ({
      entityName: "Occupation",
      scalarTranslatableFieldNames: OCCUPATION_TRANSLATABLE_STRING_FIELDS,
      hasAltLabels: true,
      findAllWithTranslations: (modelId) => repositoryRegistry.occupation.findAllWithTranslations(modelId),
      bulkSetTranslatedFields: (modelId, operations) =>
        repositoryRegistry.occupation.bulkSetTranslatedFields(modelId, operations),
    }),
    skills: () => ({
      entityName: "Skill",
      scalarTranslatableFieldNames: SKILL_TRANSLATABLE_STRING_FIELDS,
      hasAltLabels: true,
      findAllWithTranslations: (modelId) => repositoryRegistry.skill.findAllWithTranslations(modelId),
      bulkSetTranslatedFields: (modelId, operations) =>
        repositoryRegistry.skill.bulkSetTranslatedFields(modelId, operations),
    }),
    skillGroups: () => ({
      entityName: "SkillGroup",
      scalarTranslatableFieldNames: SKILLGROUP_TRANSLATABLE_STRING_FIELDS,
      hasAltLabels: true,
      findAllWithTranslations: (modelId) => repositoryRegistry.skillGroup.findAllWithTranslations(modelId),
      bulkSetTranslatedFields: (modelId, operations) =>
        repositoryRegistry.skillGroup.bulkSetTranslatedFields(modelId, operations),
    }),
  };
}

function sumEntityMergeReportsIntoTotals(
  entityMergeReportsByKey: Record<string, EntityMergeReport>
): AddLanguageToModelTotals {
  return Object.values(entityMergeReportsByKey).reduce<AddLanguageToModelTotals>(
    (totals, report) => ({
      totalRows: totals.totalRows + report.totalRows,
      matched: totals.matched + report.matched,
      unmatched: totals.unmatched + report.unmatched,
      changed: totals.changed + report.changed,
      unchanged: totals.unchanged + report.unchanged,
      writeFailures: totals.writeFailures + report.writeFailures,
    }),
    { totalRows: 0, matched: 0, unmatched: 0, changed: 0, unchanged: 0, writeFailures: 0 }
  );
}

function buildEmbeddingsFollowUpCommand(modelId: string): string {
  return (
    `Embeddings for the new language were not generated automatically. Next step - trigger embeddings ` +
    `regeneration for the model via:\n` +
    `  POST /models/${modelId}/embedding-processes\n` +
    `  { "embeddingServiceId": "<one of: ${EmbeddingsAPISpecs.Constants.EmbeddingServiceIds.join(", ")}>" }\n` +
    `This re-embeds every entity in every one of the model's languages, including the one just added.`
  );
}

// Assumes the repository registry is already initialized against a connection: cli.ts does that, and so does a
// test that seeds data directly through the repositories.
export async function addLanguageToModel(options: AddLanguageToModelOptions): Promise<AddLanguageToModelResult> {
  if (!mongoose.Types.ObjectId.isValid(options.modelId)) {
    throw new Error(`Invalid modelId: ${options.modelId}`);
  }
  if (!LanguageAPISpecs.Helpers.isSupportedLanguage(options.languageShortCode)) {
    throw new Error(
      `Unsupported language short code: '${
        options.languageShortCode
      }'. Must be one of: ${LanguageAPISpecs.Constants.Languages.map((language) => language.shortCode).join(", ")}`
    );
  }
  const languageConfig = LanguageAPISpecs.Helpers.getLanguageByShortCode(options.languageShortCode)!;

  const csvFilePathsByEntityKey: Record<string, string | undefined> = {
    occupationGroups: options.occupationGroupsCsvPath,
    occupations: options.occupationsCsvPath,
    skills: options.skillsCsvPath,
    skillGroups: options.skillGroupsCsvPath,
  };
  const entityMergeRuns = Object.entries(getEntityMergeConfigsByKey())
    .map(([entityKey, getConfig]) => ({ entityKey, getConfig, csvFilePath: csvFilePathsByEntityKey[entityKey] }))
    .filter((run): run is typeof run & { csvFilePath: string } => !!run.csvFilePath);
  if (entityMergeRuns.length === 0) {
    throw new Error(
      "At least one entity CSV file must be provided (--occupation-groups-csv, --occupations-csv, --skills-csv or --skill-groups-csv)"
    );
  }

  await ensureOutputFolderPathIsWritable(options.outputFolderPath);
  await Promise.all(entityMergeRuns.map((run) => validateCsvFileIsReadable(run.entityKey, run.csvFilePath)));

  const repositoryRegistry = getRepositoryRegistry();
  const modelInfo = await repositoryRegistry.modelInfo.getModelById(options.modelId);
  if (!modelInfo) {
    throw new Error(`Model not found: ${options.modelId}`);
  }

  const dryRun = !!options.dryRun;
  const entityMergeReportsByKey: Record<string, EntityMergeReport> = {};
  for (const run of entityMergeRuns) {
    if (options.verbose) {
      console.info(`Merging '${options.languageShortCode}' into ${run.entityKey} from ${run.csvFilePath}...`);
    }
    const entityMergeReport = await mergeEntityLanguage(run.getConfig(), {
      modelId: options.modelId,
      csvFilePath: run.csvFilePath,
      language: languageConfig,
      dryRun,
    });
    entityMergeReportsByKey[run.entityKey] = entityMergeReport;
    if (options.verbose) {
      console.info(
        `${entityMergeReport.entityName}: ${entityMergeReport.totalRows} row(s), ${entityMergeReport.matched} matched ` +
          `(${entityMergeReport.changed} changed, ${entityMergeReport.unchanged} unchanged), ${entityMergeReport.unmatched} unmatched`
      );
    }
  }

  const totals = sumEntityMergeReportsIntoTotals(entityMergeReportsByKey);

  // A write failure means the database may not actually hold every change this run reports, so the language is
  // deliberately not advertised as available until a clean re-run confirms everything was written.
  let availableLanguagesUpdated = false;
  if (!dryRun && totals.writeFailures === 0 && !modelInfo.availableLanguages.includes(options.languageShortCode)) {
    await repositoryRegistry.modelInfo.updateAvailableLanguages(options.modelId, [
      ...modelInfo.availableLanguages,
      options.languageShortCode,
    ]);
    availableLanguagesUpdated = true;
  }

  const resultWithoutOutputPath = {
    modelId: options.modelId,
    languageShortCode: options.languageShortCode,
    dryRun,
    availableLanguagesUpdated,
    entities: entityMergeReportsByKey,
    totals,
    embeddingsFollowUpCommand: buildEmbeddingsFollowUpCommand(options.modelId),
  };
  const outputPath = path.resolve(
    path.join(options.outputFolderPath, options.outputFileName ?? DEFAULT_REPORT_FILE_NAME)
  );
  await fs.promises.writeFile(outputPath, JSON.stringify(resultWithoutOutputPath, null, 2), "utf-8");

  if (totals.writeFailures > 0) {
    throw new Error(
      `${totals.writeFailures} row(s) failed to write and availableLanguages was not updated; see the report ` +
        `at ${outputPath} for which entity type(s) were affected. It is safe to re-run this exact command once ` +
        `the underlying database issue is resolved.`
    );
  }

  return { outputPath, ...resultWithoutOutputPath };
}
