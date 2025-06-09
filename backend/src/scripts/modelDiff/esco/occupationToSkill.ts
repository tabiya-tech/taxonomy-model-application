import path from "path";

import { readCSV } from "./common";
import { ESCORelationService } from "./types";
import { FILENAMES } from "export/async/modelToS3";
import { IOccupationToSkillRelationImportRow } from "esco/common/entityToCSV.types";

export class OccupationToSkillRelationService extends ESCORelationService {
  async loadFromCSV(): Promise<void> {
    const result = await readCSV<IOccupationToSkillRelationImportRow>(
      path.join(this.modelManager.state.modelPath, FILENAMES.OccupationToSkillRelations)
    );
    this.modelManager.state.occupationToSkill = result.rows;
  }
}
