import { stringify } from "csv-stringify";
import { pipeline, Transform } from "stream";
import { IOccupationHierarchyExportRow, occupationHierarchyExportHeaders } from "esco/common/entityToCSV.types";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { IOccupationHierarchyPair } from "esco/occupationHierarchy/occupationHierarchy.types";
import { Readable } from "node:stream";
import { getCSVTypeFromObjectType } from "esco/common/csvObjectTypes";

export type IUnpopulatedOccupationHierarchy = Omit<IOccupationHierarchyPair, "parentDocModel" | "childDocModel">;

export const transformOccupationHierarchySpecToCSVRow = (
  occupationHierarchy: IUnpopulatedOccupationHierarchy
): IOccupationHierarchyExportRow => {
  const PARENTOBJECTTYPE = getCSVTypeFromObjectType(occupationHierarchy.parentType);
  if (PARENTOBJECTTYPE === null) {
    throw new Error(
      `Failed to transform OccupationHierarchy to CSV row: Invalid parentType: ${occupationHierarchy.parentType}`
    );
  }
  const CHILDOBJECTTYPE = getCSVTypeFromObjectType(occupationHierarchy.childType);
  if (CHILDOBJECTTYPE === null) {
    throw new Error(
      `Failed to transform OccupationHierarchy to CSV row: Invalid childType: ${occupationHierarchy.childType}`
    );
  }
  return {
    //@ts-ignore
    PARENTOBJECTTYPE,
    PARENTID: occupationHierarchy.parentId,
    CHILDID: occupationHierarchy.childId,
    //@ts-ignore
    CHILDOBJECTTYPE,
    CREATEDAT: occupationHierarchy.createdAt.toISOString(),
    UPDATEDAT: occupationHierarchy.updatedAt.toISOString(),
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
        const err = new Error(`Failed to transform OccupationHierarchy to CSV row: ${json}`, { cause: cause });
        console.error(err);
        callback(err);
      }
    }
  }
}

const OccupationHierarchyToCSVTransform = (modelId: string): Readable => {
  // the stringify is a stream, and we need a new one every time we create a new pipeline
  const occupationHierarchyStringifier = stringify({
    header: true,
    columns: occupationHierarchyExportHeaders,
  });

  return pipeline(
    getRepositoryRegistry().occupationHierarchy.findAll(modelId),
    new OccupationHierarchyToCSVRowTransformer(),
    occupationHierarchyStringifier,
    (cause) => {
      if (cause) {
        console.error(new Error("Transforming OccupationHierarchy to CSV failed", { cause: cause }));
      }
    }
  );
};

export default OccupationHierarchyToCSVTransform;
