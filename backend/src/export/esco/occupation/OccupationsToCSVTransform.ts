import { stringify } from "csv-stringify";
import { pipeline, Transform } from "stream";
import LanguageAPISpecs from "api-specifications/language";
import { IOccupationWithTranslations } from "esco/occupations/_shared/occupation.types";
import {
  getLanguageSuffixedRowColumns,
  getOccupationExportHeaders,
  IOccupationExportRow,
  OccupationTranslatableHeader,
} from "esco/common/entityToCSV.types";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { Readable } from "node:stream";
import { CSVObjectTypes, getCSVTypeFromObjectType } from "esco/common/csvObjectTypes";
import { stringFromArray } from "common/parseNewLineSeparateArray/parseNewLineSeparatedArray";
import { translatedValueReplacer } from "common/language/translatedFields";

// the array-valued translatable header of Occupation; every other translatable header carries a single translated value
const OCCUPATION_ARRAY_HEADERS = ["ALTLABELS"] as const;

export const transformOccupationSpecToCSVRow = (
  occupation: IOccupationWithTranslations,
  languages: readonly LanguageAPISpecs.Types.ILanguageConfig[]
): IOccupationExportRow => {
  const OCCUPATIONTYPE = getCSVTypeFromObjectType(occupation.occupationType);
  if (OCCUPATIONTYPE !== CSVObjectTypes.ESCOOccupation && OCCUPATIONTYPE !== CSVObjectTypes.LocalOccupation) {
    throw new Error(`Failed to transform Occupation to CSV row: Invalid occupationType: ${occupation.occupationType}`);
  }
  return {
    ORIGINURI: occupation.originUri,
    ID: occupation.id,
    UUIDHISTORY: stringFromArray(occupation.UUIDHistory),
    OCCUPATIONGROUPCODE: occupation.occupationGroupCode,
    CODE: occupation.code,
    // Record<OccupationTranslatableHeader,...> below requires every header, so a missing field fails to compile
    ...getLanguageSuffixedRowColumns<OccupationTranslatableHeader>(
      {
        PREFERREDLABEL: occupation.preferredLabel,
        ALTLABELS: occupation.altLabels,
        DESCRIPTION: occupation.description,
        DEFINITION: occupation.definition,
        SCOPENOTE: occupation.scopeNote,
        REGULATEDPROFESSIONNOTE: occupation.regulatedProfessionNote,
      },
      OCCUPATION_ARRAY_HEADERS,
      languages
    ),
    OCCUPATIONTYPE,
    ISLOCALIZED: occupation.isLocalized.toString(),
    CREATEDAT: occupation.createdAt.toISOString(),
    UPDATEDAT: occupation.updatedAt.toISOString(),
  };
};

class OccupationToCSVRowTransformer extends Transform {
  private readonly languages: readonly LanguageAPISpecs.Types.ILanguageConfig[];

  constructor(languages: readonly LanguageAPISpecs.Types.ILanguageConfig[]) {
    super({ objectMode: true });
    this.languages = languages;
  }

  _transform(
    occupation: IOccupationWithTranslations,
    _encoding: BufferEncoding,
    callback: (error?: Error | null, data?: never) => void
  ): void {
    try {
      const transformedRow = transformOccupationSpecToCSVRow(occupation, this.languages);
      this.push(transformedRow);
      callback();
    } catch (cause: unknown) {
      // Make sure stringification doesn't fail, otherwise throwing an error will cause the stream to hang
      let json: string = "";
      try {
        json = JSON.stringify(occupation, translatedValueReplacer, 2);
      } finally {
        const err = new Error(`Failed to transform Occupation to CSV row: ${json}`, {
          cause: cause,
        });
        console.error(err);
        callback(err);
      }
    }
  }
}

// languages: the model's languages, in registry order; one column per translatable field and language
const OccupationsToCSVTransform = (
  modelId: string,
  languages: readonly LanguageAPISpecs.Types.ILanguageConfig[]
): Readable => {
  // the stringify is a stream, and we need a new one every time we create a new pipeline
  const occupationStringifier = stringify({
    header: true,
    columns: getOccupationExportHeaders(languages),
    quoted_string: true,
  });

  return pipeline(
    getRepositoryRegistry().occupation.findAllWithTranslations(modelId),
    new OccupationToCSVRowTransformer(languages),
    occupationStringifier,
    (cause) => {
      if (cause) {
        console.error(new Error(`Transforming Occupations to CSV failed`, { cause: cause }));
      }
    }
  );
};

export default OccupationsToCSVTransform;
