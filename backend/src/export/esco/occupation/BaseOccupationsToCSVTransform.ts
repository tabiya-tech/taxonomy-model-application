import { stringify } from "csv-stringify";
import { pipeline, Transform } from "stream";
import { IOccupation } from "esco/occupations/occupation/occupation.types";
import { IOccupationExportRow, occupationExportHeaders } from "esco/common/entityToCSV.types";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { ObjectTypes } from "esco/common/objectTypes";
import { Readable } from "node:stream";
import { getCSVTypeFromObjectObjectType } from "../../../esco/common/csvObjectTypes";
import { stringFromArray } from "../../../import/esco/common/parseNewLineSeparatedArray";

export type IUnpopulatedOccupation = Omit<IOccupation, "parent" | "children" | "requiresSkills">;

export const transformOccupationSpecToCSVRow = (occupation: IUnpopulatedOccupation): IOccupationExportRow => {
  const OCCUPATIONTYPE = getCSVTypeFromObjectObjectType(occupation.occupationType);
  if (!OCCUPATIONTYPE) {
    throw new Error(`Failed to transform Occupation to CSV row: Invalid occupationType: ${occupation.occupationType}`);
  }
  return {
    ORIGINURI: occupation.originUri,
    ID: occupation.id,
    UUIDHISTORY: stringFromArray(occupation.UUIDHistory),
    ISCOGROUPCODE: occupation.ISCOGroupCode,
    CODE: occupation.code,
    PREFERREDLABEL: occupation.preferredLabel,
    ALTLABELS: stringFromArray(occupation.altLabels),
    DESCRIPTION: occupation.description,
    DEFINITION: occupation.definition,
    SCOPENOTE: occupation.scopeNote,
    REGULATEDPROFESSIONNOTE: occupation.regulatedProfessionNote,
    // @ts-ignore
    OCCUPATIONTYPE,
    CREATEDAT: occupation.createdAt.toISOString(),
    UPDATEDAT: occupation.updatedAt.toISOString(),
  };
};

class OccupationToCSVRowTransformer extends Transform {
  readonly occupationType: ObjectTypes.ESCOOccupation | ObjectTypes.LocalOccupation;

  constructor(occupationType: ObjectTypes.ESCOOccupation | ObjectTypes.LocalOccupation) {
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
        const err = new Error(`Failed to transform ${this.occupationType} occupation to CSV row: ${json}`, {
          cause: cause,
        });
        console.error(err);
        callback(err);
      }
    }
  }
}

const BaseOccupationsToCSVTransform = (
  modelId: string,
  occupationType: ObjectTypes.ESCOOccupation | ObjectTypes.LocalOccupation
): Readable => {
  // the stringify is a stream, and we need a new one every time we create a new pipeline
  const occupationStringifier = stringify({
    header: true,
    columns: occupationExportHeaders,
  });

  return pipeline(
    getRepositoryRegistry().occupation.findAll(modelId, occupationType),
    new OccupationToCSVRowTransformer(occupationType),
    occupationStringifier,
    (cause) => {
      if (cause) {
        console.error(new Error(`Transforming ${occupationType} occupations to CSV failed`, { cause: cause }));
      }
    }
  );
};

export default BaseOccupationsToCSVTransform;
