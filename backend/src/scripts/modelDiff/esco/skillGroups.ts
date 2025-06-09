import path from "path";

import { FILENAMES } from "export/async/modelToS3";
import { parseUUIDHistory, readCSV } from "./common";
import { ESCOEntityService, SkillGroup } from "./types";
import { ISkillGroupImportRow } from "esco/common/entityToCSV.types";
import { arrayFromString } from "common/parseNewLineSeparateArray/parseNewLineSeparatedArray";

/**
 * Service for handling Skill Groups entities in the taxonomy model
 * Provides loading from CSV and comparison functionality for skill group hierarchies
 */
export class SkillGroupsService extends ESCOEntityService {
  /**
   * Compares two skill group entities and identifies differences in their properties
   *
   * @param leftSkillGroup - The skill group from the left model
   * @param rightSkillGroup - The skill group from the right model
   * @returns Object containing all property differences found
   */
  static compareEntities(
    leftSkillGroup: SkillGroup,
    rightSkillGroup: SkillGroup
  ): Record<string, Record<string, string | string[]>> {
    const differences: Record<string, Record<string, string | string[]>> = {};

    // Define fields that should be compared between skill groups
    const comparableFields: (keyof typeof leftSkillGroup.row)[] = [
      "ORIGINURI",
      "PREFERREDLABEL",
      "DESCRIPTION",
      "SCOPENOTE",
    ];

    // Compare each field and record differences
    for (const field of comparableFields) {
      const leftValue = leftSkillGroup.row[field];
      const rightValue = rightSkillGroup.row[field];

      if (leftValue !== rightValue) {
        differences[field] = {
          left: leftValue ?? "", // Handle null/undefined values
          right: rightValue ?? "",
        };
      }
    }

    // Special handling for alternative labels (array comparison)
    const leftAltLabels = arrayFromString(leftSkillGroup.row.ALTLABELS);
    const rightAltLabels = arrayFromString(rightSkillGroup.row.ALTLABELS);

    if (leftAltLabels.join(",") !== rightAltLabels.join(",")) {
      differences.ALTLABELS = {
        left: leftAltLabels,
        right: rightAltLabels,
      };
    }

    return differences;
  }

  /**
   * Loads skill groups data from the CSV file and processes it into the model state
   *
   * @throws Error if the skill groups CSV file cannot be read or parsed
   */
  async loadFromCSV(): Promise<void> {
    try {
      const result = await readCSV<ISkillGroupImportRow>(
        path.join(this.modelManager.state.modelPath, FILENAMES.SkillGroups),
        this.modelManager.logger
      );

      this.modelManager.state.skillGroups = result.rows.map((row) => {
        const skillGroupEntity = {
          row,
          ...parseUUIDHistory(row.UUIDHISTORY),
          altLabels: arrayFromString(row.ALTLABELS),
          children: [],
          parents: [],
        };

        // Cache the entity for fast lookups
        this.modelManager.caches.skillGroups.set(skillGroupEntity.originUUID, skillGroupEntity);

        return skillGroupEntity;
      });

      this.modelManager.logger.info(`Loaded ${this.modelManager.state.skillGroups.length} skill groups`);
    } catch (error) {
      throw new Error(`Failed to load skill groups from CSV: ${error}`);
    }
  }
}
