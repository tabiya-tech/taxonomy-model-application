import path from "path";
import { readCSV } from "./common";
import { FILENAMES } from "export/async/modelToS3";
import { ESCORelationService } from "./types";
import { IOccupationHierarchyImportRow } from "esco/common/entityToCSV.types";

export class OccupationHierarchyService extends ESCORelationService {
  async loadFromCSV(): Promise<void> {
    const result = await readCSV<IOccupationHierarchyImportRow>(
      path.join(this.modelManager.state.modelPath, FILENAMES.OccupationHierarchy)
    );

    this.modelManager.state.occupationHierarchy = result.rows;
  }
}
