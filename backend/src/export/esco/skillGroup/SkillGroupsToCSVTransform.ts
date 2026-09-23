import {
  getLanguageSuffixedRowColumns,
  getSkillGroupExportHeaders,
  ISkillGroupExportRow,
  SkillGroupTranslatableHeader,
} from "esco/common/entityToCSV.types";
import { pipeline, Transform } from "stream";
import LanguageAPISpecs from "api-specifications/language";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { stringify } from "csv-stringify";
import { ISkillGroupWithTranslations } from "esco/skillGroup/_shared/skillGroup.types";
import { Readable } from "node:stream";
import { stringFromArray } from "common/parseNewLineSeparateArray/parseNewLineSeparatedArray";
import { translatedValueReplacer } from "common/language/translatedFields";

// the array-valued translatable header of SkillGroup; every other translatable header carries a single translated value
const SKILL_GROUP_ARRAY_HEADERS = ["ALTLABELS"] as const;

export const transformSkillGroupSpecToCSVRow = (
  skillGroup: ISkillGroupWithTranslations,
  languages: readonly LanguageAPISpecs.Types.ILanguageConfig[]
): ISkillGroupExportRow => {
  return {
    ORIGINURI: skillGroup.originUri,
    ID: skillGroup.id,
    UUIDHISTORY: stringFromArray(skillGroup.UUIDHistory),
    CODE: skillGroup.code,
    // Record<SkillGroupTranslatableHeader,...> below requires every header, so a missing field fails to compile
    ...getLanguageSuffixedRowColumns<SkillGroupTranslatableHeader>(
      {
        PREFERREDLABEL: skillGroup.preferredLabel,
        ALTLABELS: skillGroup.altLabels,
        DESCRIPTION: skillGroup.description,
        SCOPENOTE: skillGroup.scopeNote,
      },
      SKILL_GROUP_ARRAY_HEADERS,
      languages
    ),
    CREATEDAT: skillGroup.createdAt.toISOString(),
    UPDATEDAT: skillGroup.updatedAt.toISOString(),
  };
};

class SkillGroupToCSVRowTransformer extends Transform {
  private readonly languages: readonly LanguageAPISpecs.Types.ILanguageConfig[];

  constructor(languages: readonly LanguageAPISpecs.Types.ILanguageConfig[]) {
    super({ objectMode: true });
    this.languages = languages;
  }

  _transform(
    skillGroup: ISkillGroupWithTranslations,
    _encoding: BufferEncoding,
    callback: (error?: Error | null, data?: never) => void
  ): void {
    try {
      const transformedRow = transformSkillGroupSpecToCSVRow(skillGroup, this.languages);
      this.push(transformedRow);
      callback();
    } catch (cause: unknown) {
      // Make sure stringification doesn't fail, otherwise throwing an error will cause the stream to hang
      let json: string = "";
      try {
        json = JSON.stringify(skillGroup, translatedValueReplacer, 2);
      } finally {
        const err = new Error(`Failed to transform SkillGroup to CSV row: ${json}`, { cause: cause });
        console.error(err);
        callback(err);
      }
    }
  }
}

// languages: the model's languages, in registry order; one column per translatable field and language
const SkillGroupsToCSVTransform = (
  modelId: string,
  languages: readonly LanguageAPISpecs.Types.ILanguageConfig[]
): Readable => {
  // the stringify is a stream, and we need a new one every time we create a new pipeline
  const skillGroupStringifier = stringify({
    header: true,
    columns: getSkillGroupExportHeaders(languages),
    quoted_string: true,
  });

  return pipeline(
    getRepositoryRegistry().skillGroup.findAllWithTranslations(modelId),
    new SkillGroupToCSVRowTransformer(languages),
    skillGroupStringifier,
    (cause) => {
      if (cause) {
        console.error(new Error("Transforming SkillGroups to CSV failed", { cause: cause }));
      }
    }
  );
};

export default SkillGroupsToCSVTransform;
