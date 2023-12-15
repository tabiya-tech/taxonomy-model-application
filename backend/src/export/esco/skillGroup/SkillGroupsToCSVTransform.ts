import { ISkillGroupRow, skillGroupHeaders } from "esco/common/entityToCSV.types";
import { pipeline, Transform } from "stream";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { stringify } from "csv-stringify";
import { ISkillGroup } from "esco/skillGroup/skillGroup.types";
import { Readable } from "node:stream";

export type IUnpopulatedSkillGroup = Omit<ISkillGroup, "parents" | "children">;

export const transformSkillGroupSpecToCSVRow = (skillGroup: IUnpopulatedSkillGroup): ISkillGroupRow => {
  return {
    ESCOURI: skillGroup.ESCOUri,
    ID: skillGroup.id,
    UUIDHISTORY: skillGroup.UUIDHistory.join("\n"),
    CODE: skillGroup.code,
    PREFERREDLABEL: skillGroup.preferredLabel,
    ALTLABELS: skillGroup.altLabels.join("\n"),
    DESCRIPTION: skillGroup.description,
    SCOPENOTE: skillGroup.scopeNote,
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
        const error = new Error(`Failed to transform SkillGroup to CSV row: ${json}`);
        console.error(error, cause);
        callback(error);
      }
    }
  }
}

const SkillGroupsToCSVTransform = (modelId: string): Readable => {
  // the stringify is a stream, and we need a new one every time we create a new pipeline
  const skillGroupStringifier = stringify({
    header: true,
    columns: skillGroupHeaders,
  });

  return pipeline(
    getRepositoryRegistry().skillGroup.findAll(modelId),
    new SkillGroupToCSVRowTransformer(),
    skillGroupStringifier,
    (cause) => {
      if (cause) {
        console.error(new Error("Transforming SkillGroups to CSV failed"), cause);
      }
    }
  );
};

export default SkillGroupsToCSVTransform;
