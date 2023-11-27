import { ISkillRow, skillHeaders } from "esco/common/entityToCSV.types";
import { pipeline, Transform } from "stream";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { stringify } from "csv-stringify";
import { ISkill } from "esco/skill/skills.types";
import { Readable } from "node:stream";

export type IUnpopulatedSkill = Omit<
  ISkill,
  "parents" | "children" | "requiresSkills" | "requiredBySkills" | "requiredByOccupations"
>;

export const transformSkillSpecToCSVRow = (skill: IUnpopulatedSkill): ISkillRow => {
  return {
    ESCOURI: skill.ESCOUri,
    ID: skill.id,
    ORIGINUUID: skill.originUUID,
    PREFERREDLABEL: skill.preferredLabel,
    ALTLABELS: skill.altLabels.length ? skill.altLabels.join("\n") : "",
    DESCRIPTION: skill.description,
    SCOPENOTE: skill.scopeNote,
    DEFINITION: skill.definition,
    REUSELEVEL: skill.reuseLevel,
    SKILLTYPE: skill.skillType,
  };
};

class SkillToCSVRowTransformer extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(
    skill: IUnpopulatedSkill,
    _encoding: BufferEncoding,
    callback: (error?: Error | null, data?: never) => void
  ): void {
    try {
      const transformedRow = transformSkillSpecToCSVRow(skill);
      this.push(transformedRow);
      callback();
    } catch (cause: unknown) {
      // Make sure stringification doesn't fail, otherwise throwing an error will cause the stream to hang
      let json: string = "";
      try {
        json = JSON.stringify(skill, null, 2);
      } finally {
        const error = new Error(`Failed to transform Skill to CSV row: ${json}`);
        console.error(error, cause);
        callback(error);
      }
    }
  }
}

const SkillsToCSVTransform = (modelId: string): Readable => {
  // the stringify is a stream, and we need a new one every time we create a new pipeline
  const skillStringifier = stringify({
    header: true,
    columns: skillHeaders,
  });

  return pipeline(
    getRepositoryRegistry().skill.findAll(modelId),
    new SkillToCSVRowTransformer(),
    skillStringifier,
    (cause) => {
      if (cause) {
        console.error(new Error("Transforming Skills to CSV failed"), cause);
      }
    }
  );
};

export default SkillsToCSVTransform;
