import { Readable } from "node:stream";
import { IBulkTranslationUpdateResult, ITranslationUpdateOperation } from "esco/common/bulkTranslationUpdate";

export interface EntityMergeConfig {
  entityName: string;
  scalarTranslatableFieldNames: readonly string[];
  hasAltLabels: boolean;
  findAllWithTranslations: (modelId: string) => Readable;
  bulkSetTranslatedFields: (
    modelId: string,
    operations: ITranslationUpdateOperation[]
  ) => Promise<IBulkTranslationUpdateResult>;
}

export interface EntityMergeReport {
  entityName: string;
  totalRows: number;
  matched: number;
  unmatched: number;
  unmatchedImportIds: string[];
  changed: number;
  unchanged: number;
  // Rows whose database write could not be confirmed. If nonzero, the DB may be missing updates,
  // so availableLanguages is not extended.
  writeFailures: number;
  warnings: string[];
}

export interface AddLanguageToModelOptions {
  modelId: string;
  languageShortCode: string;
  occupationGroupsCsvPath?: string;
  occupationsCsvPath?: string;
  skillsCsvPath?: string;
  skillGroupsCsvPath?: string;
  outputFolderPath: string;
  outputFileName?: string;
  dryRun?: boolean;
  verbose?: boolean;
}

export interface AddLanguageToModelTotals {
  totalRows: number;
  matched: number;
  unmatched: number;
  changed: number;
  unchanged: number;
  writeFailures: number;
}

export interface AddLanguageToModelResult {
  outputPath: string;
  modelId: string;
  languageShortCode: string;
  dryRun: boolean;
  availableLanguagesUpdated: boolean;
  entities: Record<string, EntityMergeReport>;
  totals: AddLanguageToModelTotals;
  embeddingsFollowUpCommand: string;
}
