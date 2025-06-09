import path from "path";

import { readCSV } from "./common";
import { ESCORelationService, OccupationToSKillRelation } from "./types";
import { FILENAMES } from "export/async/modelToS3";
import { IOccupationToSkillRelationImportRow } from "esco/common/entityToCSV.types";

/**
 * Service for handling Occupation-to-Skill relationships in the taxonomy model
 * Manages relationships between occupations and skills including signalling values
 */
export class OccupationToSkillRelationService extends ESCORelationService {
  /**
   * Compares two occupation-to-skill relationships and identifies differences in their properties
   *
   * @param leftRow - The occupation-to-skill relation from the left model
   * @param rightRow - The occupation-to-skill relation from the right model
   * @returns Object containing all property differences found
   */
  static compareRelationships(
    leftRow: OccupationToSKillRelation,
    rightRow: OccupationToSKillRelation
  ): Record<string, Record<string, string | string[]>> {
    const differences: Record<string, Record<string, string | string[]>> = {};

    // Define fields that should be compared between occupation-to-skill relations
    const comparableFields: (keyof typeof leftRow)[] = ["RELATIONTYPE", "SIGNALLINGVALUELABEL", "SIGNALLINGVALUE"];

    // Compare each field and record differences
    for (const field of comparableFields) {
      const leftValue = leftRow[field];
      const rightValue = rightRow[field];

      if (leftValue !== rightValue) {
        differences[field] = {
          left: leftValue ?? "", // Handle null/undefined values
          right: rightValue ?? "",
        };
      }
    }

    return differences;
  }

  /**
   * Loads occupation-to-skill relations from the CSV file
   *
   * @throws Error if the occupation-to-skill relations CSV file cannot be read or parsed
   */
  async loadFromCSV(): Promise<void> {
    try {
      const result = await readCSV<IOccupationToSkillRelationImportRow>(
        path.join(this.modelManager.state.modelPath, FILENAMES.OccupationToSkillRelations),
        this.modelManager.logger
      );

      this.modelManager.state.occupationToSkill = result.rows;
      this.modelManager.logger.info(`Loaded ${result.rows.length} occupation-to-skill relations`);
    } catch (error) {
      throw new Error(`Failed to load occupation-to-skill relations from CSV: ${error}`);
    }
  }

  /**
   * Loads original UUIDs for occupation and skill entities referenced in the relations
   * This must be called after occupations and skills have been loaded into the model
   *
   * @throws Error if referenced entities cannot be found
   */
  async loadOriginUUIDs(): Promise<void> {
    try {
      let missingOccupations = 0;
      let missingSkills = 0;

      for (const row of this.modelManager.state.occupationToSkill) {
        // Find the occupation by its ID
        const occupation = this.modelManager.getOccupationById(row.OCCUPATIONID);
        if (occupation) {
          row.occupationOriginUUID = occupation.originUUID;
        } else {
          this.modelManager.logger.warn(`Occupation not found for ID: ${row.OCCUPATIONID}`);
          missingOccupations++;
        }

        // Find the skill by its ID
        const skill = this.modelManager.getSkillById(row.SKILLID);
        if (skill) {
          row.skillOriginUUID = skill.originUUID;
        } else {
          this.modelManager.logger.warn(`Skill not found for ID: ${row.SKILLID}`);
          missingSkills++;
        }
      }

      if (missingOccupations > 0 || missingSkills > 0) {
        this.modelManager.logger.warn(
          `Found ${missingOccupations} missing occupation references and ${missingSkills} missing skill references in occupation-to-skill relations`
        );
      }

      this.modelManager.logger.info(
        `Loaded original UUIDs for ${this.modelManager.state.occupationToSkill.length} occupation-to-skill relations`
      );
    } catch (error) {
      throw new Error(`Failed to load original UUIDs for occupation-to-skill relations: ${error}`);
    }
  }
}
