import { IOccupationToSkillRelationPair } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";
import { IOccupationToSkillRelationRow, occupationToSkillRelationHeaders } from "esco/common/entityToCSV.types";
import { pipeline, Transform } from "stream";
import { stringify } from "csv-stringify";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { Readable } from "node:stream";

export type IUnpopulatedOccupationToSkillRelation = Omit<
  IOccupationToSkillRelationPair,
  "requiringOccupationDocModel" | "requiredSkillDocModel"
>;

export const transformOccupationToSkillRelationSpecToCSVRow = (
  occupationToSkillRelation: IUnpopulatedOccupationToSkillRelation
): IOccupationToSkillRelationRow => {
  return {
    OCCUPATIONTYPE: occupationToSkillRelation.requiringOccupationType,
    OCCUPATIONID: occupationToSkillRelation.requiringOccupationId,
    RELATIONTYPE: occupationToSkillRelation.relationType,
    SKILLID: occupationToSkillRelation.requiredSkillId,
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
        const error = new Error(`Failed to transform occupationToSkillRelation to CSV row: ${json}`);
        console.error(error, cause);
        callback(error);
      }
    }
  }
}

const OccupationToSkillRelationToCSVTransform = (modelId: string): Readable => {
  // the stringify is a stream, and we need a new one every time we create a new pipeline
  const occupationToSkillRelationStringifier = stringify({
    header: true,
    columns: occupationToSkillRelationHeaders,
  });

  return pipeline(
    getRepositoryRegistry().occupationToSkillRelation.findAll(modelId),
    new OccupationToSkillRelationToCSVRowTransformer(),
    occupationToSkillRelationStringifier,
    (cause) => {
      if (cause) {
        console.error(new Error("Transforming occupationToSkillRelation to CSV failed"), cause);
      }
    }
  );
};

export default OccupationToSkillRelationToCSVTransform;