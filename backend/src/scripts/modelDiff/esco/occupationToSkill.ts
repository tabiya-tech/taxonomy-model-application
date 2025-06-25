import path from "path";

import { constructDiffObject, readCSV } from "./common";
import { TaxonomyRelationService, OccupationToSKillRelation } from "./types";
import { FILENAMES } from "export/async/modelToS3";
import { IOccupationToSkillRelationImportRow } from "esco/common/entityToCSV.types";
import { PropsDiffValue } from "scripts/modelDiff/types";
import { InvalidModelError } from "scripts/modelDiff/errors";

/**
 * Service for handling Occupation-to-Skill relationships in the taxonomy model
 *
 * Manages relationships between occupations and skills including signaling values.
 */
export class OccupationToSkillRelationService extends TaxonomyRelationService {
  /**
   * Compares two occupation-to-skill relationships and identifies differences in their properties
   *
   * @param leftRow - The occupation-to-skill relation from the left model
   * @param rightRow - The occupation-to-skill relation from the right model.
   *
   * @returns Object containing all property differences found.
   */
  static compareRelationships(
    leftRow: OccupationToSKillRelation,
    rightRow: OccupationToSKillRelation
  ): PropsDiffValue[] {
    const differences: PropsDiffValue[] = [];

    // Define fields that should be compared between occupation-to-skill relations
    const comparableFields: (keyof typeof leftRow)[] = ["RELATIONTYPE", "SIGNALLINGVALUELABEL", "SIGNALLINGVALUE"];

    // Compare each field and record differences
    for (const field of comparableFields) {
      const leftValue = leftRow[field];
      const rightValue = rightRow[field];

      if (leftValue !== rightValue) {
        differences.push(constructDiffObject(field, leftValue ?? "", rightValue ?? ""));
      }
    }

    return differences;
  }

  /**
   * Loads occupation-to-skill relations from the CSV file
   *
   * @throws Error if the occupation-to-skill relations CSV file cannot be read or parsed.
   */
  async loadFromCSV(): Promise<void> {
    try {
      const filePath = path.join(this.modelManager.state.modelPath, FILENAMES.OccupationToSkillRelations);

      const result = await readCSV<IOccupationToSkillRelationImportRow>(filePath, this.modelManager.logger);

      this.modelManager.state.occupationToSkill = result.rows;
      this.modelManager.logger.info(`Loaded ${result.rows.length} occupation-to-skill relations`);

      await this.loadOriginUUIDs();
    } catch (error) {
      throw new Error(`Failed to load occupation-to-skill relations from CSV`, { cause: error });
    }
  }

  /**
   * Loads origin UUIDs for occupation and skill entities referenced in the relations
   * This must be called after occupations and skills have been loaded into the model.
   *
   * @throws Error if referenced entities cannot be found
   */
  private async loadOriginUUIDs(): Promise<void> {
    let missingOccupations = 0;
    let missingSkills = 0;

    try {
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
    } catch (error) {
      throw new Error(`Failed to load original UUIDs for occupation-to-skill relations.`, { cause: error });
    }

    if (missingOccupations > 0 || missingSkills > 0) {
      throw new InvalidModelError(
        `Found ${missingOccupations} missing occupation references and ${missingSkills} missing skill references in occupation-to-skill relations`
      );
    }

    this.modelManager.logger.info(
      `Loaded original UUIDs for ${this.modelManager.state.occupationToSkill.length} occupation-to-skill relations`
    );
  }
}
