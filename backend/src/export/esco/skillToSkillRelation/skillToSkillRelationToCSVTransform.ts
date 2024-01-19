import { stringify } from "csv-stringify";
import { pipeline, Transform } from "stream";
import { ISkillToSkillsRelationExportRow, skillToSkillRelationExportHeaders } from "esco/common/entityToCSV.types";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { ISkillToSkillRelationPair } from "esco/skillToSkillRelation/skillToSkillRelation.types";

export type IUnpopulatedSkillToSkillRelation = Omit<
  ISkillToSkillRelationPair,
  "requiringSkillDocModel" | "requiredSkillDocModel"
>;

export const transformSkillRelationSpecToCSVRow = (
  skillRelation: IUnpopulatedSkillToSkillRelation
): ISkillToSkillsRelationExportRow => {
  return {
    REQUIRINGID: skillRelation.requiringSkillId,
    RELATIONTYPE: skillRelation.relationType,
    REQUIREDID: skillRelation.requiredSkillId,
    CREATEDAT: skillRelation.createdAt.toISOString(),
    UPDATEDAT: skillRelation.updatedAt.toISOString(),
  };
};

class SkillToSkillRelationToCSVRowTransformer extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(
    skillRelation: IUnpopulatedSkillToSkillRelation,
    _encoding: BufferEncoding,
    callback: (error?: Error | null, data?: never) => void
  ): void {
    try {
      const transformedRow = transformSkillRelationSpecToCSVRow(skillRelation);
      this.push(transformedRow);
      callback();
    } catch (cause: unknown) {
      // Make sure stringification doesn't fail, otherwise throwing an error will cause the stream to hang
      let json: string = "";
      try {
        json = JSON.stringify(skillRelation, null, 2);
      } finally {
        const err = new Error(`Failed to transform SkillToSkillRelation to CSV row: ${json}`, { cause: cause });
        console.error(err);
        callback(err);
      }
    }
  }
}

const SkillToSkillRelationToCSVTransform = (modelId: string): Transform => {
  // the stringify is a stream, and we need a new one every time we create a new pipeline
  const skillToSkillRelationStringifier = stringify({
    header: true,
    columns: skillToSkillRelationExportHeaders,
  });

  return pipeline(
    getRepositoryRegistry().skillToSkillRelation.findAll(modelId),
    new SkillToSkillRelationToCSVRowTransformer(),
    skillToSkillRelationStringifier,
    (cause) => {
      if (cause) {
        console.error(new Error("Transforming SkillToSkillRelation to CSV failed", { cause: cause }));
      }
    }
  );
};

export default SkillToSkillRelationToCSVTransform;
