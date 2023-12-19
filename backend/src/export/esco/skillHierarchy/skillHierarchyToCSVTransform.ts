import { stringify } from "csv-stringify";
import { pipeline, Transform } from "stream";
import { ISkillHierarchyExportRow, skillHierarchyExportHeaders } from "esco/common/entityToCSV.types";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { ISkillHierarchyPair } from "esco/skillHierarchy/skillHierarchy.types";
import { Readable } from "node:stream";

export type IUnpopulatedSkillHierarchy = Omit<ISkillHierarchyPair, "parentDocModel" | "childDocModel">;

export const transformSkillHierarchySpecToCSVRow = (
  skillHierarchy: IUnpopulatedSkillHierarchy
): ISkillHierarchyExportRow => {
  return {
    PARENTOBJECTTYPE: skillHierarchy.parentType,
    PARENTID: skillHierarchy.parentId,
    CHILDID: skillHierarchy.childId,
    CHILDOBJECTTYPE: skillHierarchy.childType,
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
        const error = new Error(`Failed to transform SkillHierarchy to CSV row: ${json}`);
        console.error(error, cause);
        callback(error);
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
        console.error(new Error("Transforming SkillHierarchy to CSV failed"), cause);
      }
    }
  );
};

export default SkillHierarchyToCSVTransform;
