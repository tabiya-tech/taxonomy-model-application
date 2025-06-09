import path from "path";

import { readCSV } from "./common";
import { ESCORelationService } from "./types";
import { FILENAMES } from "export/async/modelToS3";
import { ISkillToSkillsRelationImportRow } from "esco/common/entityToCSV.types";

export class SkillToSkillService extends ESCORelationService {
  async loadFromCSV(): Promise<void> {
    const result = await readCSV<ISkillToSkillsRelationImportRow>(
      path.join(this.modelManager.state.modelPath, FILENAMES.SkillToSkillRelations)
    );
    this.modelManager.state.skillToSkill = result.rows;
  }
}
