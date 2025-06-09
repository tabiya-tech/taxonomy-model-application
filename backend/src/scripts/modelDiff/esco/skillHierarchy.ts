import path from "path";
import { readCSV } from "./common";
import { ESCORelationService } from "./types";
import { FILENAMES } from "export/async/modelToS3";
import { ISkillHierarchyImportRow } from "esco/common/entityToCSV.types";

/**
 * Service for handling Skill Hierarchy relationships in the taxonomy model
 * Manages parent-child relationships between skills and skill groups
 */
export class SkillHierarchyService extends ESCORelationService {
  /**
   * Loads skill hierarchy relations from the CSV file
   *
   * @throws Error if the skill hierarchy CSV file cannot be read or parsed
   */
  async loadFromCSV(): Promise<void> {
    try {
      const result = await readCSV<ISkillHierarchyImportRow>(
        path.join(this.modelManager.state.modelPath, FILENAMES.SkillHierarchy),
        this.modelManager.logger
      );

      this.modelManager.state.skillHierarchy = result.rows;
      this.modelManager.logger.info(`Loaded ${result.rows.length} skill hierarchy relations`);
    } catch (error) {
      throw new Error(`Failed to load skill hierarchy from CSV: ${error}`);
    }
  }

  /**
   * Gets entity details based on object type and ID
   *
   * @param objectType - Type of the entity ("skill" or "skillgroup")
   * @param id - ID of the entity
   * @returns Entity details if found, undefined otherwise
   */
  private getEntityDetails(objectType: string, id: string) {
    const normalizedType = objectType.toLowerCase();

    if (normalizedType === "skill") {
      return this.modelManager.getSkillById(id);
    }

    if (normalizedType === "skillgroup") {
      return this.modelManager.getSkillGroupById(id);
    }

    this.modelManager.logger.warn(`Unknown object type in skill hierarchy: ${objectType}`);
    return undefined;
  }

  /**
   * Loads original UUIDs for skill and skill group entities referenced in the hierarchy
   * This must be called after skills and skill groups have been loaded into the model
   *
   * @throws Error if referenced entities cannot be found
   */
  async loadOriginUUIDs(): Promise<void> {
    try {
      let missingParents = 0;
      let missingChildren = 0;

      for (const row of this.modelManager.state.skillHierarchy) {
        // Find the parent entity by its object type and ID
        const parent = this.getEntityDetails(row.PARENTOBJECTTYPE, row.PARENTID);
        if (parent) {
          row.parentOriginUUID = parent.originUUID;
        } else {
          this.modelManager.logger.warn(`Parent ${row.PARENTOBJECTTYPE} not found for ID: ${row.PARENTID}`);
          missingParents++;
        }

        // Find the child entity by its object type and ID (FIXED: was using PARENT instead of CHILD)
        const child = this.getEntityDetails(row.CHILDOBJECTTYPE, row.CHILDID);
        if (child) {
          row.childOriginUUID = child.originUUID;
        } else {
          this.modelManager.logger.warn(`Child ${row.CHILDOBJECTTYPE} not found for ID: ${row.CHILDID}`);
          missingChildren++;
        }
      }

      if (missingParents > 0 || missingChildren > 0) {
        this.modelManager.logger.warn(
          `Found ${missingParents} missing parent references and ${missingChildren} missing child references in skill hierarchy`
        );
      }

      this.modelManager.logger.info(
        `Loaded original UUIDs for ${this.modelManager.state.skillHierarchy.length} skill hierarchy relations`
      );
    } catch (error) {
      throw new Error(`Failed to load original UUIDs for skill hierarchy: ${error}`);
    }
  }
}
