import path from "path";

import { constructDiffObject, readCSV } from "./common";
import { TaxonomyRelationService, SkillToSkillRelation } from "./types";
import { FILENAMES } from "export/async/modelToS3";
import { ISkillToSkillsRelationImportRow } from "esco/common/entityToCSV.types";
import { PropsDiffValue } from "scripts/modelDiff/types";

/**
 * Service for handling Skill-to-Skill relationships in the taxonomy model
 * Manages relationships between skills such as dependencies and requirements
 */
export class SkillToSkillService extends TaxonomyRelationService {
  /**
   * Compares two skill-to-skill relationships and identifies differences in their properties
   *
   * @param leftRow - The skill-to-skill relation from the left model
   * @param rightRow - The skill-to-skill relation from the right model
   * @returns Object containing all property differences found
   */
  static compareRelationships(leftRow: SkillToSkillRelation, rightRow: SkillToSkillRelation): PropsDiffValue[] {
    const differences: PropsDiffValue[] = [];

    // Compare relation type (the only mutable property in skill-to-skill relations)
    if (leftRow.RELATIONTYPE !== rightRow.RELATIONTYPE) {
      differences.push(constructDiffObject("RELATIONTYPE", leftRow.RELATIONTYPE, rightRow.RELATIONTYPE));
    }

    return differences;
  }

  /**
   * Loads skill-to-skill relations from the CSV file
   *
   * @throws Error if the skill-to-skill relations CSV file cannot be read or parsed
   */
  async loadFromCSV(): Promise<void> {
    try {
      const filePath = path.join(this.modelManager.state.modelPath, FILENAMES.SkillToSkillRelations);

      const result = await readCSV<ISkillToSkillsRelationImportRow>(filePath, this.modelManager.logger);

      this.modelManager.state.skillToSkill = result.rows;
      this.modelManager.logger.info(`Loaded ${result.rows.length} skill-to-skill relations`);
      await this.loadOriginUUIDs();
    } catch (error) {
      throw new Error(`Failed to load skill-to-skill relations from CSV: ${error}`);
    }
  }

  /**
   * Loads origin UUIDs for skill entities referenced in the relations
   * This must be called after skills have been loaded into the model.
   *
   * @throws Error if referenced skills cannot be found
   */
  private async loadOriginUUIDs(): Promise<void> {
    try {
      let missingSkills = 0;

      for (const row of this.modelManager.state.skillToSkill) {
        // Find the required skill by its ID
        const required = this.modelManager.getSkillById(row.REQUIREDID);
        if (required) {
          row.requiredSkillOriginUUID = required.originUUID;
        } else {
          this.modelManager.logger.warn(`Required skill not found for ID: ${row.REQUIREDID}`);
          missingSkills++;
        }

        // Find the requiring skill by its ID
        const requiring = this.modelManager.getSkillById(row.REQUIRINGID);
        if (requiring) {
          row.requiringSkillOriginUUID = requiring.originUUID;
        } else {
          this.modelManager.logger.warn(`Requiring skill not found for ID: ${row.REQUIRINGID}`);
          missingSkills++;
        }
      }

      if (missingSkills > 0) {
        this.modelManager.logger.warn(`Found ${missingSkills} missing skill references in skill-to-skill relations`);
      }

      this.modelManager.logger.info(
        `Loaded original UUIDs for ${this.modelManager.state.skillToSkill.length} skill-to-skill relations`
      );
    } catch (error) {
      throw new Error(`Failed to load original UUIDs for skill-to-skill relations: ${error}`);
    }
  }
}
