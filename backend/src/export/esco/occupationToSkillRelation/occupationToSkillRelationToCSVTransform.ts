import { IOccupationToSkillRelationPair } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";
import {
  IOccupationToSkillRelationExportRow,
  occupationToSkillRelationExportHeaders,
} from "esco/common/entityToCSV.types";
import { pipeline, Transform } from "stream";
import { stringify } from "csv-stringify";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { Readable } from "node:stream";
import {
  getCSVTypeFromObjectType,
  getCSVRelationTypeFromOccupationToSkillRelationType,
} from "esco/common/csvObjectTypes";

export type IUnpopulatedOccupationToSkillRelation = Omit<
  IOccupationToSkillRelationPair,
  "requiringOccupationDocModel" | "requiredSkillDocModel"
>;

export const transformOccupationToSkillRelationSpecToCSVRow = (
  occupationToSkillRelation: IUnpopulatedOccupationToSkillRelation
): IOccupationToSkillRelationExportRow => {
  const OCCUPATIONTYPE = getCSVTypeFromObjectType(occupationToSkillRelation.requiringOccupationType);
  if (OCCUPATIONTYPE === null) {
    throw new Error(
      `Failed to transform OccupationToSkillRelation to CSV row: Invalid requiringOccupationType: ${occupationToSkillRelation.requiringOccupationType}`
    );
  }
  const RELATIONTYPE = getCSVRelationTypeFromOccupationToSkillRelationType(occupationToSkillRelation.relationType);
  if (RELATIONTYPE === null) {
    throw new Error(
      `Failed to transform OccupationToSkillRelation to CSV row: Invalid relationType: ${occupationToSkillRelation.relationType}`
    );
  }
  return {
    //@ts-ignore
    OCCUPATIONTYPE,
    OCCUPATIONID: occupationToSkillRelation.requiringOccupationId,
    RELATIONTYPE,
    SKILLID: occupationToSkillRelation.requiredSkillId,
    CREATEDAT: occupationToSkillRelation.createdAt.toISOString(),
    UPDATEDAT: occupationToSkillRelation.updatedAt.toISOString(),
  };
};

class OccupationToSkillRelationToCSVRowTransformer extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(
    occupationToSkillRelation: IUnpopulatedOccupationToSkillRelation,
    _encoding: BufferEncoding,
    callback: (error?: Error | null, data?: never) => void
  ): void {
    try {
      const transformedRow = transformOccupationToSkillRelationSpecToCSVRow(occupationToSkillRelation);
      this.push(transformedRow);
      callback();
    } catch (cause: unknown) {
      // Make sure stringification doesn't fail, otherwise throwing an error will cause the stream to hang
      let json: string = "";
      try {
        json = JSON.stringify(occupationToSkillRelation, null, 2);
      } finally {
        const err = new Error(`Failed to transform occupationToSkillRelation to CSV row: ${json}`, { cause: cause });
        console.error(err);
        callback(err);
      }
    }
  }
}

const OccupationToSkillRelationToCSVTransform = (modelId: string): Readable => {
  // the stringify is a stream, and we need a new one every time we create a new pipeline
  const occupationToSkillRelationStringifier = stringify({
    header: true,
    columns: occupationToSkillRelationExportHeaders,
  });

  return pipeline(
    getRepositoryRegistry().occupationToSkillRelation.findAll(modelId),
    new OccupationToSkillRelationToCSVRowTransformer(),
    occupationToSkillRelationStringifier,
    (cause) => {
      if (cause) {
        console.error(new Error("Transforming occupationToSkillRelation to CSV failed", { cause: cause }));
      }
    }
  );
};

export default OccupationToSkillRelationToCSVTransform;
