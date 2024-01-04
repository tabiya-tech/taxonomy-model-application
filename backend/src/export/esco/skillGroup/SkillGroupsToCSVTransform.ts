import { ISkillGroupExportRow, skillGroupExportHeaders } from "esco/common/entityToCSV.types";
import { pipeline, Transform } from "stream";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { stringify } from "csv-stringify";
import { ISkillGroup } from "esco/skillGroup/skillGroup.types";
import { Readable } from "node:stream";
import { stringFromArray } from "../../../import/esco/common/parseNewLineSeparatedArray";

export type IUnpopulatedSkillGroup = Omit<ISkillGroup, "parents" | "children">;

export const transformSkillGroupSpecToCSVRow = (skillGroup: IUnpopulatedSkillGroup): ISkillGroupExportRow => {
  return {
    ORIGINURI: skillGroup.originUri,
    ID: skillGroup.id,
    UUIDHISTORY: stringFromArray(skillGroup.UUIDHistory),
    CODE: skillGroup.code,
    PREFERREDLABEL: skillGroup.preferredLabel,
    ALTLABELS: stringFromArray(skillGroup.altLabels),
    DESCRIPTION: skillGroup.description,
    SCOPENOTE: skillGroup.scopeNote,
    CREATEDAT: skillGroup.createdAt.toISOString(),
    UPDATEDAT: skillGroup.updatedAt.toISOString(),
  };
};

class SkillGroupToCSVRowTransformer extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(
    skillGroup: IUnpopulatedSkillGroup,
    _encoding: BufferEncoding,
    callback: (error?: Error | null, data?: never) => void
  ): void {
    try {
      const transformedRow = transformSkillGroupSpecToCSVRow(skillGroup);
      this.push(transformedRow);
      callback();
    } catch (cause: unknown) {
      // Make sure stringification doesn't fail, otherwise throwing an error will cause the stream to hang
      let json: string = "";
      try {
        json = JSON.stringify(skillGroup, null, 2);
      } finally {
        const err = new Error(`Failed to transform SkillGroup to CSV row: ${json}`, { cause: cause });
        console.error(err);
        callback(err);
      }
    }
  }
}

const SkillGroupsToCSVTransform = (modelId: string): Readable => {
  // the stringify is a stream, and we need a new one every time we create a new pipeline
  const skillGroupStringifier = stringify({
    header: true,
    columns: skillGroupExportHeaders,
  });

  return pipeline(
    getRepositoryRegistry().skillGroup.findAll(modelId),
    new SkillGroupToCSVRowTransformer(),
    skillGroupStringifier,
    (cause) => {
      if (cause) {
        console.error(new Error("Transforming SkillGroups to CSV failed", { cause: cause }));
      }
    }
  );
};

export default SkillGroupsToCSVTransform;
