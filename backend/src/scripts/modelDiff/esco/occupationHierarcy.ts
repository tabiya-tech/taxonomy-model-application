import path from "path";
import { readCSV } from "./common";
import { FILENAMES } from "export/async/modelToS3";
import { TaxonomyRelationService } from "./types";
import { IOccupationHierarchyImportRow } from "esco/common/entityToCSV.types";
import { InvalidModelError } from "scripts/modelDiff/errors";
import { ObjectTypes } from "esco/common/objectTypes";

/**
 * Service for handling Occupation Hierarchy relationships in the taxonomy model
 * Manages parent-child relationships between occupations and occupation groups.
 */
export class OccupationHierarchyService extends TaxonomyRelationService {
  async loadFromCSV(): Promise<void> {
    try {
      const filePath = path.join(this.modelManager.state.modelPath, FILENAMES.OccupationHierarchy);

      const result = await readCSV<IOccupationHierarchyImportRow>(filePath, this.modelManager.logger);

      this.modelManager.state.occupationHierarchy = result.rows;

      this.modelManager.logger.info(`Loaded ${result.rows.length} occupation hierarchy relations`);

      await this.loadOriginUUIDs();
    } catch (error) {
      throw new Error(`Failed to load occupation hierarchy from CSV`, { cause: error });
    }
  }

  /**
   * Gets entity details based on object type and ID.
   *
   * @param objectType - Type of the entity (occupation or occupation group types)
   * @param id - ID of the entity.
   */
  private getEntityDetails(objectType: string, id: string) {
    // Handle occupation types
    if (objectType === ObjectTypes.ESCOOccupation || objectType === ObjectTypes.LocalOccupation) {
      const occupation = this.modelManager.getOccupationById(id);
      if (!occupation) {
        throw new InvalidModelError(`Occupation not found by id ${id}`);
      }

      return occupation;
    }

    // Handle occupation group types
    if (objectType === ObjectTypes.ISCOGroup || objectType === ObjectTypes.LocalGroup) {
      const record = this.modelManager.getOccupationGroupById(id);
      if (!record) {
        throw new InvalidModelError(`Occupation group not found by id ${id}`);
      }

      return record;
    }

    this.modelManager.logger.warn(`Unknown object type in occupation hierarchy: ${objectType}`);

    throw new Error("Unknown object type in occupation hierarchy: " + objectType);
  }

  /**
   * Loads original UUIDs for occupation and occupation group entities referenced in the hierarchy
   * This must be called after occupations and occupation groups have been loaded into the model.
   *
   * @throws Error if referenced entities cannot be found
   */
  private async loadOriginUUIDs(): Promise<void> {
    try {
      for (const row of this.modelManager.state.occupationHierarchy) {
        // Find the parent entity by its object type and ID
        const parent = this.getEntityDetails(row.PARENTOBJECTTYPE, row.PARENTID);
        row.parentOriginUUID = parent.originUUID;

        // Find the child entity by its object type and ID.
        const child = this.getEntityDetails(row.CHILDOBJECTTYPE, row.CHILDID);
        row.childOriginUUID = child.originUUID;
      }

      this.modelManager.logger.info(
        `Loaded original UUIDs for ${this.modelManager.state.occupationHierarchy.length} occupation hierarchy relations`
      );
    } catch (error) {
      throw new Error(`Failed to load original UUIDs for occupation hierarchy`, { cause: error });
    }
  }
}
