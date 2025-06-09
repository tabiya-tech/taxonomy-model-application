import path from "path";

import { TaxonomyEntityService, OccupationGroup } from "./types";
import { FILENAMES } from "export/async/modelToS3";
import { compareArrayFields, constructDiffObject, parseUUIDHistory, readCSV } from "./common";
import { IOccupationGroupImportRow } from "esco/common/entityToCSV.types";
import { PropsDiffValue } from "scripts/modelDiff/types";

/**
 * Service for handling Occupation Groups entities in the taxonomy model
 * Provides loading from CSV and comparison functionality for occupation group hierarchies.
 */
export class OccupationGroupsService extends TaxonomyEntityService {
  /**
   * Compares two occupation group entities and identifies differences in their properties.
   *
   * @param leftOccupationGroup - The occupation group from the left model
   * @param rightOccupationGroup - The occupation group from the right model.
   *
   * @returns Object containing all property differences found.
   */
  static compareEntities(
    leftOccupationGroup: OccupationGroup,
    rightOccupationGroup: OccupationGroup
  ): PropsDiffValue[] {
    const differences: PropsDiffValue[] = [];

    // Define fields that should be compared between occupation groups
    const comparableFields: (keyof typeof leftOccupationGroup.row)[] = [
      "ORIGINURI",
      "CODE",
      "PREFERREDLABEL",
      "DESCRIPTION",
      "GROUPTYPE",
    ];

    // Compare each field and record differences
    for (const field of comparableFields) {
      const leftValue = leftOccupationGroup.row[field];
      const rightValue = rightOccupationGroup.row[field];

      if (leftValue !== rightValue) {
        differences.push(constructDiffObject(field, leftValue, rightValue));
      }
    }

    // Compare the ALT LABELS field, an array
    compareArrayFields(leftOccupationGroup.row.ALTLABELS, rightOccupationGroup.row.ALTLABELS, "ALTLABELS", differences);

    return differences;
  }

  /**
   * Loads occupation groups data from the CSV file and processes it into the model state.
   *
   * @throws Error if the occupation groups CSV file cannot be read or parsed.
   */
  async loadFromCSV(): Promise<void> {
    try {
      // Read the occupation groups CSV file
      const filePath = path.join(this.modelManager.state.modelPath, FILENAMES.OccupationGroups);

      const result = await readCSV<IOccupationGroupImportRow>(filePath, this.modelManager.logger);

      // Update the model state with the loaded occupation groups.
      this.modelManager.state.occupationGroups = result.rows.map((row) => {
        const occupationGroupEntity = { row, ...parseUUIDHistory(row.UUIDHISTORY) };

        // Cache the entity for fast lookups
        this.modelManager.caches.occupationGroups.UUIDS.set(occupationGroupEntity.originUUID, occupationGroupEntity);
        this.modelManager.caches.occupationGroups.IDS.set(occupationGroupEntity.row.ID, occupationGroupEntity);

        return occupationGroupEntity;
      });

      this.modelManager.logger.info(`Loaded ${this.modelManager.state.occupationGroups.length} occupation groups`);
    } catch (error) {
      throw new Error(`Failed to load occupation groups from CSV: ${error}`);
    }
  }
}
