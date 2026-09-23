import {
  getLanguageSuffixedRowColumns,
  getSkillExportHeaders,
  ISkillExportRow,
  SkillTranslatableHeader,
} from "esco/common/entityToCSV.types";
import { pipeline, Transform } from "stream";
import LanguageAPISpecs from "api-specifications/language";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { stringify } from "csv-stringify";
import { ISkillWithTranslations } from "esco/skill/_shared/skill.types";
import { Readable } from "node:stream";
import { getCSVTypeFromReuseLevel, getCSVTypeFromSkillType } from "esco/common/csvObjectTypes";
import { stringFromArray } from "common/parseNewLineSeparateArray/parseNewLineSeparatedArray";
import { translatedValueReplacer } from "common/language/translatedFields";

// the array-valued translatable header of Skill; every other translatable header carries a single translated value
const SKILL_ARRAY_HEADERS = ["ALTLABELS"] as const;

export const transformSkillSpecToCSVRow = (
  skill: ISkillWithTranslations,
  languages: readonly LanguageAPISpecs.Types.ILanguageConfig[]
): ISkillExportRow => {
  const REUSELEVEL = getCSVTypeFromReuseLevel(skill.reuseLevel);
  if (REUSELEVEL === null) {
    throw new Error(`Failed to transform Skill to CSV row: Invalid reuseLevel: ${skill.reuseLevel}`);
  }
  const SKILLTYPE = getCSVTypeFromSkillType(skill.skillType);
  if (SKILLTYPE === null) {
    throw new Error(`Failed to transform Skill to CSV row: Invalid skillType: ${skill.skillType}`);
  }

  return {
    ORIGINURI: skill.originUri,
    ID: skill.id,
    UUIDHISTORY: stringFromArray(skill.UUIDHistory),
    // Record<SkillTranslatableHeader,...> below requires every header, so a missing field fails to compile
    ...getLanguageSuffixedRowColumns<SkillTranslatableHeader>(
      {
        PREFERREDLABEL: skill.preferredLabel,
        ALTLABELS: skill.altLabels,
        DESCRIPTION: skill.description,
        SCOPENOTE: skill.scopeNote,
        DEFINITION: skill.definition,
      },
      SKILL_ARRAY_HEADERS,
      languages
    ),
    REUSELEVEL,
    SKILLTYPE,
    ISLOCALIZED: skill.isLocalized.toString(),
    CREATEDAT: skill.createdAt.toISOString(),
    UPDATEDAT: skill.updatedAt.toISOString(),
  };
};

class SkillToCSVRowTransformer extends Transform {
  private readonly languages: readonly LanguageAPISpecs.Types.ILanguageConfig[];

  constructor(languages: readonly LanguageAPISpecs.Types.ILanguageConfig[]) {
    super({ objectMode: true });
    this.languages = languages;
  }

  _transform(
    skill: ISkillWithTranslations,
    _encoding: BufferEncoding,
    callback: (error?: Error | null, data?: never) => void
  ): void {
    try {
      const transformedRow = transformSkillSpecToCSVRow(skill, this.languages);
      this.push(transformedRow);
      callback();
    } catch (cause: unknown) {
      // Make sure stringification doesn't fail, otherwise throwing an error will cause the stream to hang
      let json: string = "";
      try {
        json = JSON.stringify(skill, translatedValueReplacer, 2);
      } finally {
        const err = new Error(`Failed to transform Skill to CSV row: ${json}`, { cause: cause });
        console.error(err);
        callback(err);
      }
    }
  }
}

// languages: the model's languages, in registry order; one column per translatable field and language
const SkillsToCSVTransform = (
  modelId: string,
  languages: readonly LanguageAPISpecs.Types.ILanguageConfig[]
): Readable => {
  // the stringify is a stream, and we need a new one every time we create a new pipeline
  const skillStringifier = stringify({
    header: true,
    columns: getSkillExportHeaders(languages),
    quoted_string: true,
  });

  return pipeline(
    getRepositoryRegistry().skill.findAllWithTranslations(modelId),
    new SkillToCSVRowTransformer(languages),
    skillStringifier,
    (cause) => {
      if (cause) {
        console.error(new Error("Transforming Skills to CSV failed", { cause: cause }));
      }
    }
  );
};

export default SkillsToCSVTransform;
