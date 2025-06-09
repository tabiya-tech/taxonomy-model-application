import path from "path";
import { readCSV } from "./common";
import { FILENAMES } from "export/async/modelToS3";
import { ESCORelationService } from "./types";
import { IOccupationHierarchyImportRow } from "esco/common/entityToCSV.types";

/**
 * Service for handling Occupation Hierarchy relationships in the taxonomy model
 * Manages parent-child relationships between occupations and occupation groups
 */
export class OccupationHierarchyService extends ESCORelationService {
  /**
   * Loads occupation hierarchy relations from the CSV file
   *
   * @throws Error if the occupation hierarchy CSV file cannot be read or parsed
   */
  async loadFromCSV(): Promise<void> {
    try {
      const result = await readCSV<IOccupationHierarchyImportRow>(
        path.join(this.modelManager.state.modelPath, FILENAMES.OccupationHierarchy),
        this.modelManager.logger
      );

      this.modelManager.state.occupationHierarchy = result.rows;
      this.modelManager.logger.info(`Loaded ${result.rows.length} occupation hierarchy relations`);
    } catch (error) {
      throw new Error(`Failed to load occupation hierarchy from CSV: ${error}`);
    }
  }

  /**
   * Gets entity details based on object type and ID
   *
   * @param objectType - Type of the entity (occupation or occupation group types)
   * @param id - ID of the entity
   * @returns Entity details if found, undefined otherwise
   */
  private getEntityDetails(objectType: string, id: string) {
    const normalizedType = objectType.toLowerCase();

    // Handle occupation types
    if (normalizedType === "escooccupation" || normalizedType === "localoccupation") {
      return this.modelManager.getOccupationById(id);
    }

    // Handle occupation group types
    if (normalizedType === "iscogroup" || normalizedType === "localgroup") {
      return this.modelManager.getOccupationGroupById(id);
    }

    console.warn(`Unknown object type in occupation hierarchy: ${objectType}`);
    return undefined;
  }

  /**
   * Loads original UUIDs for occupation and occupation group entities referenced in the hierarchy
   * This must be called after occupations and occupation groups have been loaded into the model
   *
   * @throws Error if referenced entities cannot be found
   */
  async loadOriginUUIDs(): Promise<void> {
    try {
      let missingParents = 0;
      let missingChildren = 0;

      for (const row of this.modelManager.state.occupationHierarchy) {
        // Find the parent entity by its object type and ID
        const parent = this.getEntityDetails(row.PARENTOBJECTTYPE, row.PARENTID);
        if (parent) {
          row.parentOriginUUID = parent.originUUID;
        } else {
          console.warn(`Parent ${row.PARENTOBJECTTYPE} not found for ID: ${row.PARENTID}`);
          missingParents++;
        }

        // Find the child entity by its object type and ID (FIXED: was using PARENT instead of CHILD)
        const child = this.getEntityDetails(row.CHILDOBJECTTYPE, row.CHILDID);
        if (child) {
          row.childOriginUUID = child.originUUID;
        } else {
          console.warn(`Child ${row.CHILDOBJECTTYPE} not found for ID: ${row.CHILDID}`);
          missingChildren++;
        }
      }

      if (missingParents > 0 || missingChildren > 0) {
        this.modelManager.logger.warn(
          `Found ${missingParents} missing parent references and ${missingChildren} missing child references in occupation hierarchy`
        );
      }

      this.modelManager.logger.info(
        `Loaded original UUIDs for ${this.modelManager.state.occupationHierarchy.length} occupation hierarchy relations`
      );
    } catch (error) {
      throw new Error(`Failed to load original UUIDs for occupation hierarchy: ${error}`);
    }
  }
}
