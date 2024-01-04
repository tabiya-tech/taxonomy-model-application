import { stringify } from "csv-stringify";
import { pipeline, Transform } from "stream";
import { ISkillHierarchyExportRow, skillHierarchyExportHeaders } from "esco/common/entityToCSV.types";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { ISkillHierarchyPair } from "esco/skillHierarchy/skillHierarchy.types";
import { Readable } from "node:stream";
import { getCSVTypeFromObjectObjectType } from "esco/common/csvObjectTypes";
export type IUnpopulatedSkillHierarchy = Omit<ISkillHierarchyPair, "parentDocModel" | "childDocModel">;

export const transformSkillHierarchySpecToCSVRow = (
  skillHierarchy: IUnpopulatedSkillHierarchy
): ISkillHierarchyExportRow => {
  const PARENTOBJECTTYPE = getCSVTypeFromObjectObjectType(skillHierarchy.parentType);
  if (!PARENTOBJECTTYPE) {
    throw new Error(`Failed to transform SkillHierarchy to CSV row: Invalid parentType: ${skillHierarchy.parentType}`);
  }
  const CHILDOBJECTTYPE = getCSVTypeFromObjectObjectType(skillHierarchy.childType);
  if (!CHILDOBJECTTYPE) {
    throw new Error(`Failed to transform SkillHierarchy to CSV row: Invalid childType: ${skillHierarchy.childType}`);
  }

  return {
    // @ts-ignore
    PARENTOBJECTTYPE,
    PARENTID: skillHierarchy.parentId,
    CHILDID: skillHierarchy.childId,
    // @ts-ignore
    CHILDOBJECTTYPE,
    CREATEDAT: skillHierarchy.createdAt.toISOString(),
    UPDATEDAT: skillHierarchy.updatedAt.toISOString(),
  };
};

class SkillHierarchyToCSVRowTransformer extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(
    skillHierarchy: IUnpopulatedSkillHierarchy,
    _encoding: BufferEncoding,
    callback: (error?: Error | null, data?: never) => void
  ): void {
    try {
      const transformedRow = transformSkillHierarchySpecToCSVRow(skillHierarchy);
      this.push(transformedRow);
      callback();
    } catch (cause: unknown) {
      // Make sure stringification doesn't fail, otherwise throwing an error will cause the stream to hang
      let json: string = "";
      try {
        json = JSON.stringify(skillHierarchy, null, 2);
      } finally {
        const err = new Error(`Failed to transform SkillHierarchy to CSV row: ${json}`, { cause: cause });
        console.error(err);
        callback(err);
      }
    }
  }
}

const SkillHierarchyToCSVTransform = (modelId: string): Readable => {
  // the stringify is a stream, and we need a new one every time we create a new pipeline
  const skillHierarchyStringifier = stringify({
    header: true,
    columns: skillHierarchyExportHeaders,
  });

  return pipeline(
    getRepositoryRegistry().skillHierarchy.findAll(modelId),
    new SkillHierarchyToCSVRowTransformer(),
    skillHierarchyStringifier,
    (cause) => {
      if (cause) {
        console.error(new Error("Transforming SkillHierarchy to CSV failed", { cause: cause }));
      }
    }
  );
};

export default SkillHierarchyToCSVTransform;
