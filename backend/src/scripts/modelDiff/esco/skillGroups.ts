import path from "path";

import { FILENAMES } from "export/async/modelToS3";
import { compareArrayFields, constructDiffObject, parseUUIDHistory, readCSV } from "./common";
import { TaxonomyEntityService, SkillGroup } from "./types";
import { ISkillGroupImportRow } from "esco/common/entityToCSV.types";
import { PropsDiffValue } from "scripts/modelDiff/types";

/**
 * Service for handling Skill Groups entities in the taxonomy model
 *
 * Provides loading from CSV and comparison functionality for skill group hierarchies.
 */
export class SkillGroupsService extends TaxonomyEntityService {
  /**
   * Compares two skill group entities and identifies differences in their properties.
   *
   * @param leftSkillGroup - The skill group from the left model
   * @param rightSkillGroup - The skill group from the right model.
   *
   * @returns Object containing all property differences found.
   */
  static compareEntities(leftSkillGroup: SkillGroup, rightSkillGroup: SkillGroup): PropsDiffValue[] {
    const differences: PropsDiffValue[] = [];

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
        differences.push(constructDiffObject(field, leftValue, rightValue));
      }
    }

    // Special handling for alternative labels (array comparison)
    compareArrayFields(leftSkillGroup.row.ALTLABELS, rightSkillGroup.row.ALTLABELS, "ALTLABELS", differences);

    return differences;
  }

  /**
   * Loads skill groups data from the CSV file and processes it into the model state.
   * @throws Error if the skill groups CSV file cannot be read or parsed.
   */
  async loadFromCSV(): Promise<void> {
    try {
      const filePath = path.join(this.modelManager.state.modelPath, FILENAMES.SkillGroups);

      const result = await readCSV<ISkillGroupImportRow>(filePath, this.modelManager.logger);

      this.modelManager.state.skillGroups = result.rows.map((row) => {
        const skillGroupEntity = { row, ...parseUUIDHistory(row.UUIDHISTORY) };

        // Cache the entity for fast lookups
        this.modelManager.caches.skillGroups.UUIDS.set(skillGroupEntity.originUUID, skillGroupEntity);
        this.modelManager.caches.skillGroups.IDS.set(skillGroupEntity.row.ID, skillGroupEntity);

        return skillGroupEntity;
      });

      this.modelManager.logger.info(`Loaded ${this.modelManager.state.skillGroups.length} skill groups`);
    } catch (error) {
      throw new Error(`Failed to load skill groups from CSV.`, { cause: error });
    }
  }
}
