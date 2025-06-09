import path from "path";

import { FILENAMES } from "export/async/modelToS3";
import { ESCOEntityService, Skill } from "./types";
import { parseUUIDHistory, readCSV } from "./common";
import { ISkillImportRow } from "esco/common/entityToCSV.types";
import { arrayFromString } from "common/parseNewLineSeparateArray/parseNewLineSeparatedArray";

/**
 * Service for handling Skills entities in the taxonomy model
 * Provides loading from CSV and comparison functionality
 */
export class SkillsService extends ESCOEntityService {
  /**
   * Compares two skill entities and identifies differences in their properties
   *
   * @param leftSkill - The skill from the left model
   * @param rightSkill - The skill from the right model
   * @returns Object containing all property differences found.
   */
  static compareEntities(leftSkill: Skill, rightSkill: Skill): Record<string, Record<string, string | string[]>> {
    const differences: Record<string, Record<string, string | string[]>> = {};

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
        differences[field] = {
          left: leftValue ?? "", // Handle null/undefined values
          right: rightValue ?? "",
        };
      }
    }

    // Special handling for alternative labels (array comparison)
    const leftAltLabels = arrayFromString(leftSkill.row.ALTLABELS);
    const rightAltLabels = arrayFromString(rightSkill.row.ALTLABELS);

    if (leftAltLabels.join(",") !== rightAltLabels.join(",")) {
      differences.ALTLABELS = {
        left: leftAltLabels,
        right: rightAltLabels,
      };
    }

    return differences;
  }

  /**
   * Loads skills data from the CSV file and processes it into the model state
   *
   * @throws Error if the skills CSV file cannot be read or parsed
   */
  async loadFromCSV(): Promise<void> {
    try {
      const result = await readCSV<ISkillImportRow>(
        path.join(this.modelManager.state.modelPath, FILENAMES.Skills),
        this.modelManager.logger
      );

      this.modelManager.state.skills = result.rows.map((row) => {
        const skillEntity = {
          row,
          ...parseUUIDHistory(row.UUIDHISTORY),
          altLabels: arrayFromString(row.ALTLABELS),
          occupations: [],
          parents: [],
          children: [],
        };

        // Cache the entity for fast lookups
        this.modelManager.caches.skills.set(skillEntity.originUUID, skillEntity);

        return skillEntity;
      });

      this.modelManager.logger.info(`Loaded ${this.modelManager.state.skills.length} skills`);
    } catch (error) {
      throw new Error(`Failed to load skills from CSV: ${error}`);
    }
  }
}
