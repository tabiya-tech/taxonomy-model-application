import { Readable } from "node:stream";
import LanguageAPISpecs from "api-specifications/language";
import { HeadersValidatorFunction } from "import/parse/RowProcessor.types";
import { uniqueArrayFromString } from "common/parseNewLineSeparateArray/parseNewLineSeparatedArray";
import errorLogger from "common/errorLogger/errorLogger";
import { EntityMergeConfig } from "./types";

export const CSV_ID_COLUMN_NAME = "ID";
const ALT_LABELS_FIELD_NAME = "altLabels";

type ExistingEntityWithTranslations = {
  importId?: string | null;
  [fieldName: string]: unknown;
};

function getLanguageColumnName(fieldName: string, language: LanguageAPISpecs.Types.ILanguageConfig): string {
  return `${fieldName.toUpperCase()}_${language.csvSuffix}`;
}

function getTranslatableFieldNames(config: EntityMergeConfig): string[] {
  return config.hasAltLabels
    ? [...config.scalarTranslatableFieldNames, ALT_LABELS_FIELD_NAME]
    : [...config.scalarTranslatableFieldNames];
}

// Reads every entity of the model once, keyed by importId, so each CSV row can be diffed in memory instead of
// with a per-row database query.
export async function buildExistingEntityMap(
  findAllWithTranslations: (modelId: string) => Readable,
  modelId: string
): Promise<Map<string, ExistingEntityWithTranslations>> {
  const existingEntitiesByImportId = new Map<string, ExistingEntityWithTranslations>();
  const entityStream = findAllWithTranslations(modelId);
  for await (const document of entityStream) {
    const entity = document as ExistingEntityWithTranslations;
    if (entity.importId) {
      existingEntitiesByImportId.set(entity.importId, entity);
    }
  }
  return existingEntitiesByImportId;
}

export function makeHeadersValidator(
  config: EntityMergeConfig,
  language: LanguageAPISpecs.Types.ILanguageConfig
): HeadersValidatorFunction {
  return async (actualHeaders: string[]): Promise<boolean> => {
    if (!actualHeaders.includes(CSV_ID_COLUMN_NAME)) {
      errorLogger.logError(`${config.entityName}: CSV is missing the required '${CSV_ID_COLUMN_NAME}' column`);
      return false;
    }
    const expectedLanguageColumnNames = getTranslatableFieldNames(config).map((fieldName) =>
      getLanguageColumnName(fieldName, language)
    );
    const hasAtLeastOneExpectedLanguageColumn = expectedLanguageColumnNames.some((columnName) =>
      actualHeaders.includes(columnName)
    );
    if (!hasAtLeastOneExpectedLanguageColumn) {
      errorLogger.logError(
        `${config.entityName}: CSV carries none of the expected '${
          language.name
        }' columns (${expectedLanguageColumnNames.join(", ")}). Is this the right file for this language?`
      );
      return false;
    }
    return true;
  };
}

export interface RowUpdate {
  translationsToSetByDotNotationPath: Record<string, string>;
  warnings: string[];
}

// A blank cell means "not yet translated" and is skipped, rather than being written as an empty string, so a
// CSV can be delivered and re-run field by field over several passes.
export function computeRowUpdate(
  csvRow: Record<string, string | undefined>,
  existingEntity: ExistingEntityWithTranslations,
  config: EntityMergeConfig,
  language: LanguageAPISpecs.Types.ILanguageConfig
): RowUpdate {
  const translationsToSetByDotNotationPath: Record<string, string> = {};
  const warnings: string[] = [];
  const importId = csvRow[CSV_ID_COLUMN_NAME] ?? "";

  for (const fieldName of config.scalarTranslatableFieldNames) {
    const trimmedCellValue = csvRow[getLanguageColumnName(fieldName, language)]?.trim();
    if (!trimmedCellValue) continue;
    const existingTranslationsForField = existingEntity[fieldName] as Map<string, string> | undefined;
    if (existingTranslationsForField?.get(language.dbKeyName) === trimmedCellValue) continue;
    translationsToSetByDotNotationPath[`${fieldName}.${language.dbKeyName}`] = trimmedCellValue;
  }

  if (config.hasAltLabels) {
    const rawAltLabelsCell = csvRow[getLanguageColumnName(ALT_LABELS_FIELD_NAME, language)];
    if (rawAltLabelsCell !== undefined && rawAltLabelsCell.trim().length > 0) {
      const { uniqueArray, duplicateCount } = uniqueArrayFromString(rawAltLabelsCell);
      const newAltLabelValues = uniqueArray.map((label) => label.trim()).filter((label) => label.length > 0);
      if (duplicateCount > 0) {
        warnings.push(
          `${config.entityName} ${importId}: altLabels (${language.dbKeyName}) contained ${duplicateCount} duplicate(s), de-duplicated`
        );
      }
      const existingAltLabelTranslations = (existingEntity.altLabels as Map<string, string>[] | undefined) ?? [];
      if (newAltLabelValues.length > existingAltLabelTranslations.length) {
        warnings.push(
          `${config.entityName} ${importId}: altLabels (${language.dbKeyName}) provides ${
            newAltLabelValues.length
          } label(s) but the entity only has ${existingAltLabelTranslations.length} existing slot(s); ${
            newAltLabelValues.length - existingAltLabelTranslations.length
          } extra label(s) were ignored`
        );
      }
      const matchableAltLabelSlotCount = Math.min(newAltLabelValues.length, existingAltLabelTranslations.length);
      for (let slotIndex = 0; slotIndex < matchableAltLabelSlotCount; slotIndex++) {
        if (existingAltLabelTranslations[slotIndex]?.get(language.dbKeyName) === newAltLabelValues[slotIndex]) continue;
        translationsToSetByDotNotationPath[`altLabels.${slotIndex}.${language.dbKeyName}`] =
          newAltLabelValues[slotIndex];
      }
    }
  }

  return { translationsToSetByDotNotationPath, warnings };
}
