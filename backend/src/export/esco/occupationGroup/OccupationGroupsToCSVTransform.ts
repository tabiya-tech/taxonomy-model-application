import { IOccupationGroupWithTranslations } from "esco/occupationGroup/_shared/OccupationGroup.types";
import {
  getLanguageSuffixedRowColumns,
  getOccupationGroupExportHeaders,
  IOccupationGroupExportRow,
  OccupationGroupTranslatableHeader,
} from "esco/common/entityToCSV.types";
import { pipeline, Readable, Transform } from "stream";
import LanguageAPISpecs from "api-specifications/language";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { stringify } from "csv-stringify";
import { stringFromArray } from "common/parseNewLineSeparateArray/parseNewLineSeparatedArray";
import { CSVObjectTypes, getCSVTypeFromObjectType } from "esco/common/csvObjectTypes";
import { translatedValueReplacer } from "common/language/translatedFields";

// the array-valued translatable header of OccupationGroup; every other translatable header carries a single translated value
const OCCUPATION_GROUP_ARRAY_HEADERS = ["ALTLABELS"] as const;

export const transformOccupationGroupSpecToCSVRow = (
  occupationGroup: IOccupationGroupWithTranslations,
  languages: readonly LanguageAPISpecs.Types.ILanguageConfig[]
): IOccupationGroupExportRow => {
  const GROUPTYPE = getCSVTypeFromObjectType(occupationGroup.groupType);
  if (GROUPTYPE !== CSVObjectTypes.ISCOGroup && GROUPTYPE !== CSVObjectTypes.LocalGroup) {
    throw new Error(`Failed to transform OccupationGroup to CSV row: Invalid groupType: ${occupationGroup.groupType}`);
  }
  return {
    ORIGINURI: occupationGroup.originUri,
    ID: occupationGroup.id,
    UUIDHISTORY: stringFromArray(occupationGroup.UUIDHistory),
    CODE: occupationGroup.code,
    GROUPTYPE: GROUPTYPE,
    // Record<OccupationGroupTranslatableHeader,...> below requires every header, so a missing field fails to compile
    ...getLanguageSuffixedRowColumns<OccupationGroupTranslatableHeader>(
      {
        PREFERREDLABEL: occupationGroup.preferredLabel,
        ALTLABELS: occupationGroup.altLabels,
        DESCRIPTION: occupationGroup.description,
      },
      OCCUPATION_GROUP_ARRAY_HEADERS,
      languages
    ),
    CREATEDAT: occupationGroup.createdAt.toISOString(),
    UPDATEDAT: occupationGroup.updatedAt.toISOString(),
  };
};

class OccupationGroupToCSVRowTransformer extends Transform {
  private readonly languages: readonly LanguageAPISpecs.Types.ILanguageConfig[];

  constructor(languages: readonly LanguageAPISpecs.Types.ILanguageConfig[]) {
    super({ objectMode: true });
    this.languages = languages;
  }

  _transform(
    occupationGroup: IOccupationGroupWithTranslations,
    _encoding: BufferEncoding,
    callback: (error?: Error | null, data?: never) => void
  ): void {
    try {
      const transformedRow = transformOccupationGroupSpecToCSVRow(occupationGroup, this.languages);
      this.push(transformedRow);
      callback();
    } catch (cause: unknown) {
      // Make sure stringification doesn't fail, otherwise throwing an error will cause the stream to hang
      let json: string = "";
      try {
        json = JSON.stringify(occupationGroup, translatedValueReplacer, 2);
      } finally {
        const err = new Error(`Failed to transform OccupationGroup to CSV row: ${json}`, { cause: cause });
        console.error(err);
        callback(err);
      }
    }
  }
}

// languages: the model's languages, in registry order; one column per translatable field and language
const OccupationGroupsToCSVTransform = (
  modelId: string,
  languages: readonly LanguageAPISpecs.Types.ILanguageConfig[]
): Readable => {
  // the stringify is a stream, and we need a new one every time we create a new pipeline
  const occupationGroupStringifier = stringify({
    header: true,
    columns: getOccupationGroupExportHeaders(languages),
    quoted_string: true,
  });

  return pipeline(
    getRepositoryRegistry().OccupationGroup.findAllWithTranslations(modelId),
    new OccupationGroupToCSVRowTransformer(languages),
    occupationGroupStringifier,
    (cause) => {
      if (cause) {
        console.error(new Error("Transforming ESCO occupationGroups to CSV failed", { cause: cause }));
      }
    }
  );
};

export default OccupationGroupsToCSVTransform;
