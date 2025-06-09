import path from "path";

import { FILENAMES } from "export/async/modelToS3";
import { TaxonomyEntityService, Skill } from "./types";
import { compareArrayFields, constructDiffObject, parseUUIDHistory, readCSV } from "./common";
import { ISkillImportRow } from "esco/common/entityToCSV.types";
import { PropsDiffValue } from "scripts/modelDiff/types";

/**
 * Service for handling Skills entities in the taxonomy model
 * Provides loading from CSV and comparison functionality.
 */
export class SkillsService extends TaxonomyEntityService {
  /**
   * Compares two skill entities and identifies differences in their properties
   *
   * @param leftSkill - The skill from the left model
   * @param rightSkill - The skill from the right model
   * @returns Object containing all property differences found.
   */
  static compareEntities(leftSkill: Skill, rightSkill: Skill): PropsDiffValue[] {
    const differences: PropsDiffValue[] = [];

    // Define fields that should be compared between skills
    const comparableFields: (keyof typeof leftSkill.row)[] = [
      "ORIGINURI",
      "PREFERREDLABEL",
      "DESCRIPTION",
      "DEFINITION",
      "SCOPENOTE",
      "REUSELEVEL",
      "SKILLTYPE",
      "ISLOCALIZED",
    ];

    // Compare each field and record differences
    for (const field of comparableFields) {
      const leftValue = leftSkill.row[field];
      const rightValue = rightSkill.row[field];

      if (leftValue !== rightValue) {
        differences.push(constructDiffObject(field, leftValue, rightValue));
      }
    }

    // Special handling for alternative labels (array comparison)
    compareArrayFields(leftSkill.row.ALTLABELS, rightSkill.row.ALTLABELS, "ALTLABELS", differences);

    return differences;
  }

  /**
   * Loads skill data from the CSV file and processes it into the model state.
   *
   * @throws Error if the skills CSV file cannot be read or parsed.
   */
  async loadFromCSV(): Promise<void> {
    try {
      const filePath = path.join(this.modelManager.state.modelPath, FILENAMES.Skills);

      const result = await readCSV<ISkillImportRow>(filePath, this.modelManager.logger);

      this.modelManager.state.skills = result.rows.map((row) => {
        const skillEntity = { row, ...parseUUIDHistory(row.UUIDHISTORY) };

        // Cache the entity for fast lookups
        this.modelManager.caches.skills.UUIDS.set(skillEntity.originUUID, skillEntity);
        this.modelManager.caches.skills.IDS.set(skillEntity.row.ID, skillEntity);

        return skillEntity;
      });

      this.modelManager.logger.info(`Loaded ${this.modelManager.state.skills.length} skills`);
    } catch (error) {
      throw new Error(`Failed to load skills from CSV.`, { cause: error });
    }
  }
}
