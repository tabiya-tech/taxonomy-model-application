import { stringify } from "csv-stringify";
import { pipeline, Transform } from "stream";
import { IOccupationHierarchyRow, occupationHierarchyHeaders } from "esco/common/entityToCSV.types";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { IOccupationHierarchyPair } from "esco/occupationHierarchy/occupationHierarchy.types";
import { Readable } from "node:stream";

export type IUnpopulatedOccupationHierarchy = Omit<IOccupationHierarchyPair, "parentDocModel" | "childDocModel">;

export const transformOccupationHierarchySpecToCSVRow = (
  occupationHierarchy: IUnpopulatedOccupationHierarchy
): IOccupationHierarchyRow => {
  return {
    PARENTOBJECTTYPE: occupationHierarchy.parentType,
    PARENTID: occupationHierarchy.parentId,
    CHILDID: occupationHierarchy.childId,
    CHILDOBJECTTYPE: occupationHierarchy.childType,
  };
};

class OccupationHierarchyToCSVRowTransformer extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(
    skillHierarchy: IUnpopulatedOccupationHierarchy,
    _encoding: BufferEncoding,
    callback: (error?: Error | null, data?: never) => void
  ): void {
    try {
      const transformedRow = transformOccupationHierarchySpecToCSVRow(skillHierarchy);
      this.push(transformedRow);
      callback();
    } catch (cause: unknown) {
      // Make sure stringification doesn't fail, otherwise throwing an error will cause the stream to hang
      let json: string = "";
      try {
        json = JSON.stringify(skillHierarchy, null, 2);
      } finally {
        const error = new Error(`Failed to transform OccupationHierarchy to CSV row: ${json}`);
        console.error(error, cause);
        callback(error);
      }
    }
  }
}

const OccupationHierarchyToCSVTransform = (modelId: string): Readable => {
  // the stringify is a stream, and we need a new one every time we create a new pipeline
  const occupationHierarchyStringifier = stringify({
    header: true,
    columns: occupationHierarchyHeaders,
  });

  return pipeline(
    getRepositoryRegistry().occupationHierarchy.findAll(modelId),
    new OccupationHierarchyToCSVRowTransformer(),
    occupationHierarchyStringifier,
    (cause) => {
      if (cause) {
        console.error(new Error("Transforming OccupationHierarchy to CSV failed"), cause);
      }
    }
  );
};

export default OccupationHierarchyToCSVTransform;