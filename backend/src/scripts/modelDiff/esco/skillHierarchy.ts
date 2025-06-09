import path from "path";
import { readCSV } from "./common";
import { TaxonomyRelationService } from "./types";
import { FILENAMES } from "export/async/modelToS3";
import { ISkillHierarchyImportRow } from "esco/common/entityToCSV.types";
import { ObjectTypes } from "esco/common/objectTypes";

import { InvalidModelError } from "scripts/modelDiff/errors";

/**
 * Service for handling Skill Hierarchy relationships in the taxonomy model
 * Manages parent-child relationships between skills and skill groups.
 */
export class SkillHierarchyService extends TaxonomyRelationService {
  /**
   * Loads skill hierarchy relations from the CSV file
   *
   * @throws Error if the skill hierarchy CSV file cannot be read or parsed.
   */
  async loadFromCSV(): Promise<void> {
    try {
      const filePath = path.join(this.modelManager.state.modelPath, FILENAMES.SkillHierarchy);

      const result = await readCSV<ISkillHierarchyImportRow>(filePath, this.modelManager.logger);

      this.modelManager.state.skillHierarchy = result.rows;
      this.modelManager.logger.info(`Loaded ${result.rows.length} skill hierarchy relations`);

      await this.loadOriginUUIDs();
    } catch (error) {
      throw new Error(`Failed to load skill hierarchy from CSV`, { cause: error });
    }
  }

  /**
   * Gets entity details based on object type and ID
   *
   * @param objectType - Type of the entity ("skill" or "skill group")
   * @param id - ID of the entity.
   */
  private getEntityDetails(objectType: string, id: string) {
    const normalizedType = objectType.toLowerCase();

    if (normalizedType === ObjectTypes.Skill) {
      const skill = this.modelManager.getSkillById(id);
      if (!skill) {
        throw new InvalidModelError(`Skill not found by id ${id}`);
      }

      return skill;
    }

    if (normalizedType === ObjectTypes.SkillGroup) {
      const skillGroup = this.modelManager.getSkillGroupById(id);

      if (!skillGroup) {
        throw new InvalidModelError(`Skill group not found by id ${id}`);
      }

      return skillGroup;
    }

    this.modelManager.logger.warn(`Unknown object type in skill hierarchy: ${objectType}`);
    throw new Error("Unknown object type in skill hierarchy: " + objectType);
  }

  /**
   * Loads original UUIDs for skill and skill group entities referenced in the hierarchy
   * This must be called after skills and skill groups have been loaded into the model.
   *
   * @throws Error if referenced entities cannot be found
   */
  private async loadOriginUUIDs(): Promise<void> {
    try {
      for (const row of this.modelManager.state.skillHierarchy) {
        // Find the parent entity by its object type and ID
        const parent = this.getEntityDetails(row.PARENTOBJECTTYPE, row.PARENTID);
        row.parentOriginUUID = parent.originUUID;

        // Find the child entity by its object type and ID
        const child = this.getEntityDetails(row.CHILDOBJECTTYPE, row.CHILDID);
        row.childOriginUUID = child.originUUID;
      }

      this.modelManager.logger.info(
        `Loaded original UUIDs for ${this.modelManager.state.skillHierarchy.length} skill hierarchy relations`
      );
    } catch (error) {
      throw new Error(`Failed to load original UUIDs for skill hierarchy: ${error}`);
    }
  }
}
