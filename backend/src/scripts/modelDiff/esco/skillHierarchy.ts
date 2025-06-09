import path from "path";
import { readCSV } from "./common";
import { ESCORelationService } from "./types";
import { FILENAMES } from "export/async/modelToS3";
import { ISkillHierarchyImportRow } from "esco/common/entityToCSV.types";

export class SkillHierarchyService extends ESCORelationService {
  async loadFromCSV(): Promise<void> {
    const result = await readCSV<ISkillHierarchyImportRow>(
      path.join(this.modelManager.state.modelPath, FILENAMES.SkillHierarchy)
    );

    this.modelManager.state.skillHierarchy = result.rows;
  }
}
