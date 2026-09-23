import LanguageAPISpecs from "api-specifications/language";
import {
  ITranslatedStringArrayDoc,
  ITranslatedStringDoc,
  TranslatedStringKey,
} from "common/language/translatedString.types";
import { getFallbackLanguageConfig } from "common/language/fallbackLanguage";
import { uniqueArrayFromString } from "common/parseNewLineSeparateArray/parseNewLineSeparatedArray";
import errorLogger from "common/errorLogger/errorLogger";

export type LocalizedHeaderMode = "legacy" | "localized";

export type LocalizableRow<TFields extends string> = Record<TFields, string> &
  Partial<Record<`${TFields}_${LanguageAPISpecs.Types.LanguageCsvSuffix}`, string>>;

function getLanguageConfigByShortCode(shortCode: string): LanguageAPISpecs.Types.ILanguageConfig | undefined {
  return LanguageAPISpecs.Constants.Languages.find(
    (l: LanguageAPISpecs.Types.ILanguageConfig) => l.shortCode === shortCode
  );
}

function getLanguageConfigByCsvSuffix(suffix: string): LanguageAPISpecs.Types.ILanguageConfig | undefined {
  return LanguageAPISpecs.Constants.Languages.find(
    (l: LanguageAPISpecs.Types.ILanguageConfig) => l.csvSuffix === suffix
  );
}

export function getLocalizedColumnNames(
  fields: readonly string[],
  languages: LanguageAPISpecs.Types.ILanguageConfig[]
): string[] {
  return fields.flatMap((field) => languages.map((lang) => `${field}_${lang.csvSuffix}`));
}

export function detectHeaderMode(
  actualHeaders: string[],
  localizableFields: readonly string[],
  availableLanguages: string[],
  entityName: string
): { mode: LocalizedHeaderMode; languages: LanguageAPISpecs.Types.ILanguageConfig[] } | null {
  const headerSet = new Set(actualHeaders);

  // Resolve availableLanguages short codes to language configs, fail on unknown registry entries
  const languages: LanguageAPISpecs.Types.ILanguageConfig[] = [];
  for (const shortCode of availableLanguages) {
    const config = getLanguageConfigByShortCode(shortCode);
    if (!config) {
      errorLogger.logError(
        `${entityName}: model availableLanguages contains unknown language short code '${shortCode}'`
      );
      return null;
    }
    languages.push(config);
  }

  // Detect any suffixed columns in the CSV that belong to languages not in availableLanguages
  const availableSuffixes = new Set(languages.map((l) => l.csvSuffix));
  for (const header of actualHeaders) {
    const underscoreIdx = header.lastIndexOf("_");
    if (underscoreIdx === -1) continue;
    const suffix = header.slice(underscoreIdx + 1);
    const base = header.slice(0, underscoreIdx);
    // only check headers that look like a localizable column (base is one of our fields)
    if (!localizableFields.includes(base)) continue;
    const langConfig = getLanguageConfigByCsvSuffix(suffix);
    if (!langConfig) {
      errorLogger.logError(
        `${entityName}: CSV column '${header}' uses unknown language suffix '${suffix}' (not in the platform's language registry)`
      );
      return null;
    }
    if (!availableSuffixes.has(suffix)) {
      errorLogger.logError(
        `${entityName}: CSV column '${header}' uses language '${langConfig.name}' (${suffix}) which is not in the model's availableLanguages`
      );
      return null;
    }
  }

  // Determine per-field whether it is legacy or localized
  const fieldModes: ("legacy" | "localized" | "absent")[] = localizableFields.map((field) => {
    const hasUnsuffixed = headerSet.has(field);
    const hasSuffixed = languages.some((lang) => headerSet.has(`${field}_${lang.csvSuffix}`));
    if (hasUnsuffixed && hasSuffixed) return "absent"; // sentinel for mixed
    if (hasUnsuffixed) return "legacy";
    if (hasSuffixed) return "localized";
    return "absent";
  });

  // Check for mixing unsuffixed + suffixed for the same field
  for (let i = 0; i < localizableFields.length; i++) {
    if (fieldModes[i] === "absent" && headerSet.has(localizableFields[i])) {
      // both present — this was flagged as mixed
      errorLogger.logError(
        `${entityName}: column '${localizableFields[i]}' has both a legacy unsuffixed form and language-suffixed form(s) — mixing is not allowed`
      );
      return null;
    }
  }

  // Check for inter-field mixing (some fields legacy, some localized)
  const nonAbsent = fieldModes.filter((m) => m !== "absent");
  const hasLegacy = nonAbsent.includes("legacy");
  const hasLocalized = nonAbsent.includes("localized");

  if (hasLegacy && hasLocalized) {
    const legacyFields = localizableFields.filter((_, i) => fieldModes[i] === "legacy").join(", ");
    const localizedFields = localizableFields.filter((_, i) => fieldModes[i] === "localized").join(", ");
    errorLogger.logError(
      `${entityName}: CSV mixes legacy unsuffixed columns (${legacyFields}) with language-suffixed columns (${localizedFields}) — use one format for all localizable fields`
    );
    return null;
  }

  const mode: LocalizedHeaderMode = hasLocalized ? "localized" : "legacy";

  if (mode === "legacy") {
    errorLogger.logWarning(
      `${entityName}: CSV uses legacy unsuffixed columns (e.g. PREFERREDLABEL). These will be imported as the fallback language. Migrate to suffixed columns (e.g. PREFERREDLABEL_EN) in a future archive.`
    );
  }

  return { mode, languages };
}

export function getLocalizedHeadersValidator(
  validatorName: string,
  nonLocalizableHeaders: string[],
  localizableFields: readonly string[],
  availableLanguages: string[],
  ctx: { mode?: LocalizedHeaderMode; languages?: LanguageAPISpecs.Types.ILanguageConfig[] }
): (actualHeaders: string[]) => Promise<boolean> {
  return async (actualHeaders: string[]): Promise<boolean> => {
    let valid = true;

    // Validate non-localizable headers (same as stdHeadersValidator)
    for (const header of nonLocalizableHeaders) {
      if (!actualHeaders.includes(header)) {
        valid = false;
        errorLogger.logError(`Failed to validate header for ${validatorName}, expected to include header ${header}`);
      }
    }

    // Detect and validate localizable header mode
    const result = detectHeaderMode(actualHeaders, localizableFields, availableLanguages, validatorName);
    if (result === null) {
      return false;
    }

    const { mode, languages } = result;

    if (mode === "legacy") {
      // In legacy mode, each unsuffixed field must be present
      for (const field of localizableFields) {
        if (!actualHeaders.includes(field)) {
          valid = false;
          errorLogger.logError(`Failed to validate header for ${validatorName}, expected to include header ${field}`);
        }
      }
    } else {
      // In localized mode, every FIELD_LANG combination must be present
      for (const field of localizableFields) {
        for (const lang of languages) {
          const col = `${field}_${lang.csvSuffix}`;
          if (!actualHeaders.includes(col)) {
            valid = false;
            errorLogger.logError(
              `Failed to validate header for ${validatorName}, expected to include header ${col} (language: ${lang.name})`
            );
          }
        }
      }
    }

    if (valid) {
      ctx.mode = mode;
      ctx.languages = languages;
    }

    return valid;
  };
}

export function assembleTranslatedString<TFields extends string>(
  row: LocalizableRow<TFields>,
  field: TFields,
  mode: LocalizedHeaderMode,
  languages: LanguageAPISpecs.Types.ILanguageConfig[]
): ITranslatedStringDoc {
  const result: ITranslatedStringDoc = new Map();
  if (mode === "legacy") {
    const fallback = getFallbackLanguageConfig();
    const value = row[field] ?? "";
    result.set(fallback.dbKeyName as TranslatedStringKey, value);
  } else {
    for (const lang of languages) {
      const suffix = lang.csvSuffix as LanguageAPISpecs.Types.LanguageCsvSuffix;
      const value = (row as Record<string, string | undefined>)[`${field}_${suffix}`] ?? "";
      result.set(lang.dbKeyName as TranslatedStringKey, value);
    }
  }
  return result;
}

export function assembleTranslatedArray<TFields extends string>(
  row: LocalizableRow<TFields>,
  field: TFields,
  mode: LocalizedHeaderMode,
  languages: LanguageAPISpecs.Types.ILanguageConfig[]
): { translatedArray: ITranslatedStringArrayDoc; duplicateCounts: Map<string, number> } {
  const duplicateCounts = new Map<string, number>();

  if (mode === "legacy") {
    const fallback = getFallbackLanguageConfig();
    const { uniqueArray, duplicateCount } = uniqueArrayFromString(row[field]);
    const filtered = uniqueArray.filter((s) => s.length > 0);
    if (duplicateCount > 0) {
      duplicateCounts.set(fallback.dbKeyName, duplicateCount);
    }
    const translatedArray: ITranslatedStringArrayDoc = filtered.map((label) => {
      const m: ITranslatedStringDoc = new Map();
      m.set(fallback.dbKeyName as TranslatedStringKey, label);
      return m;
    });
    return { translatedArray, duplicateCounts };
  }

  // Localized mode: build per-language arrays, then merge positionally
  // Each language independently dedupes its column; the merged array is the union by position.
  // Strategy: collect all unique labels per language, then build one translated entry per label position.
  const perLanguage = new Map<string, string[]>();
  for (const lang of languages) {
    const suffix = lang.csvSuffix as LanguageAPISpecs.Types.LanguageCsvSuffix;
    const colValue = (row as Record<string, string | undefined>)[`${field}_${suffix}`];
    const { uniqueArray, duplicateCount } = uniqueArrayFromString(colValue);
    const filtered = uniqueArray.filter((s) => s.length > 0);
    perLanguage.set(lang.dbKeyName, filtered);
    if (duplicateCount > 0) {
      duplicateCounts.set(lang.dbKeyName, duplicateCount);
    }
  }

  const lengths = Array.from(perLanguage.values()).map((a) => a.length);
  const maxLen = Math.max(0, ...lengths);
  if (new Set(lengths).size > 1) {
    const detail = Array.from(perLanguage.entries())
      .map(([k, v]) => `${k}:${v.length}`)
      .join(", ");
    errorLogger.logWarning(
      `assembleTranslatedArray: '${field}' has different label counts per language (${detail}); sparse entries will be stored`
    );
  }

  const translatedArray: ITranslatedStringArrayDoc = [];
  for (let i = 0; i < maxLen; i++) {
    const entry: ITranslatedStringDoc = new Map();
    for (const lang of languages) {
      const arr = perLanguage.get(lang.dbKeyName) ?? [];
      if (i < arr.length) {
        entry.set(lang.dbKeyName as TranslatedStringKey, arr[i]);
      }
    }
    translatedArray.push(entry);
  }

  return { translatedArray, duplicateCounts };
}

export function checkPreferredLabelInAltLabels(
  preferredLabel: ITranslatedStringDoc,
  altLabels: ITranslatedStringArrayDoc
): Set<string> {
  const missing = new Set<string>();
  for (const [langKey, label] of preferredLabel.entries()) {
    if (!label) continue;
    const found = altLabels.some((entry) => entry.get(langKey as TranslatedStringKey) === label);
    if (!found) {
      missing.add(langKey);
    }
  }
  return missing;
}
