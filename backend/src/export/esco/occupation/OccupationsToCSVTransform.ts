import { stringify } from "csv-stringify";
import { pipeline, Transform } from "stream";
import { IOccupation } from "esco/occupations/occupation.types";
import { IOccupationExportRow, occupationExportHeaders } from "esco/common/entityToCSV.types";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { Readable } from "node:stream";
import { CSVObjectTypes, getCSVTypeFromObjectType } from "esco/common/csvObjectTypes";
import { stringFromArray } from "common/parseNewLineSeparateArray/parseNewLineSeparatedArray";

export type IUnpopulatedOccupation = Omit<IOccupation, "parent" | "children" | "requiresSkills">;

export const transformOccupationSpecToCSVRow = (occupation: IUnpopulatedOccupation): IOccupationExportRow => {
  const OCCUPATIONTYPE = getCSVTypeFromObjectType(occupation.occupationType);
  if (OCCUPATIONTYPE !== CSVObjectTypes.ESCOOccupation && OCCUPATIONTYPE !== CSVObjectTypes.LocalOccupation) {
    throw new Error(`Failed to transform Occupation to CSV row: Invalid occupationType: ${occupation.occupationType}`);
  }
  return {
    ORIGINURI: occupation.originUri,
    ID: occupation.id,
    UUIDHISTORY: stringFromArray(occupation.UUIDHistory),
    OCCUPATIONGROUPCODE: occupation.OccupationGroupCode,
    CODE: occupation.code,
    PREFERREDLABEL: occupation.preferredLabel,
    ALTLABELS: stringFromArray(occupation.altLabels),
    DESCRIPTION: occupation.description,
    DEFINITION: occupation.definition,
    SCOPENOTE: occupation.scopeNote,
    REGULATEDPROFESSIONNOTE: occupation.regulatedProfessionNote,
    OCCUPATIONTYPE,
    ISLOCALIZED: occupation.isLocalized.toString(),
    CREATEDAT: occupation.createdAt.toISOString(),
    UPDATEDAT: occupation.updatedAt.toISOString(),
  };
};

class OccupationToCSVRowTransformer extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(
    occupation: IUnpopulatedOccupation,
    _encoding: BufferEncoding,
    callback: (error?: Error | null, data?: never) => void
  ): void {
    try {
      const transformedRow = transformOccupationSpecToCSVRow(occupation);
      this.push(transformedRow);
      callback();
    } catch (cause: unknown) {
      // Make sure stringification doesn't fail, otherwise throwing an error will cause the stream to hang
      let json: string = "";
      try {
        json = JSON.stringify(occupation, null, 2);
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

const OccupationsToCSVTransform = (modelId: string): Readable => {
  // the stringify is a stream, and we need a new one every time we create a new pipeline
  const occupationStringifier = stringify({
    header: true,
    columns: occupationExportHeaders,
    quoted_string: true,
  });

  return pipeline(
    getRepositoryRegistry().occupation.findAll(modelId),
    new OccupationToCSVRowTransformer(),
    occupationStringifier,
    (cause) => {
      if (cause) {
        console.error(new Error(`Transforming Occupations to CSV failed`, { cause: cause }));
      }
    }
  );
};

export default OccupationsToCSVTransform;
