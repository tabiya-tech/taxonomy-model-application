import { stringify } from "csv-stringify";
import { pipeline, Transform } from "stream";
import { IOccupation } from "esco/occupation/occupation.types";
import { IOccupationRow, occupationHeaders } from "esco/common/entityToCSV.types";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { OccupationType } from "esco/common/objectTypes";
import { Readable } from "node:stream";

export type IUnpopulatedOccupation = Omit<IOccupation, "parent" | "children" | "requiresSkills">;

export const transformOccupationSpecToCSVRow = (occupation: IUnpopulatedOccupation): IOccupationRow => {
  return {
    ESCOURI: occupation.ESCOUri,
    ID: occupation.id,
    UUIDHISTORY: occupation.UUIDHistory.join("\n"),
    ISCOGROUPCODE: occupation.ISCOGroupCode,
    CODE: occupation.code,
    PREFERREDLABEL: occupation.preferredLabel,
    ALTLABELS: occupation.altLabels.join("\n"),
    DESCRIPTION: occupation.description,
    DEFINITION: occupation.definition,
    SCOPENOTE: occupation.scopeNote,
    REGULATEDPROFESSIONNOTE: occupation.regulatedProfessionNote,
    OCCUPATIONTYPE: occupation.occupationType,
  };
};

class OccupationToCSVRowTransformer extends Transform {
  readonly occupationType: OccupationType.ESCO | OccupationType.LOCAL;

  constructor(occupationType: OccupationType.ESCO | OccupationType.LOCAL) {
    super({ objectMode: true });
    this.occupationType = occupationType;
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
        const error = new Error(`Failed to transform ${this.occupationType} occupation to CSV row: ${json}`);
        console.error(error, cause);
        callback(error);
      }
    }
  }
}

const BaseOccupationsToCSVTransform = (
  modelId: string,
  occupationType: OccupationType.ESCO | OccupationType.LOCAL
): Readable => {
  // the stringify is a stream, and we need a new one every time we create a new pipeline
  const occupationStringifier = stringify({
    header: true,
    columns: occupationHeaders,
  });

  return pipeline(
    getRepositoryRegistry().occupation.findAll(modelId, occupationType),
    new OccupationToCSVRowTransformer(occupationType),
    occupationStringifier,
    (cause) => {
      if (cause) {
        console.error(new Error(`Transforming ${occupationType} occupations to CSV failed`), cause);
      }
    }
  );
};

export default BaseOccupationsToCSVTransform;