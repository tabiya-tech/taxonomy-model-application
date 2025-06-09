import path from "path";

import { ESCOEntityService, OccupationGroup } from "./types";
import { FILENAMES } from "export/async/modelToS3";
import { parseUUIDHistory, readCSV } from "./common";
import { IOccupationGroupImportRow } from "esco/common/entityToCSV.types";
import { arrayFromString } from "common/parseNewLineSeparateArray/parseNewLineSeparatedArray";

/**
 * Service for handling Occupation Groups entities in the taxonomy model
 * Provides loading from CSV and comparison functionality for occupation group hierarchies
 */
export class OccupationGroupsService extends ESCOEntityService {
  /**
   * Compares two occupation group entities and identifies differences in their properties
   *
   * @param leftOccupationGroup - The occupation group from the left model
   * @param rightOccupationGroup - The occupation group from the right model
   * @returns Object containing all property differences found
   */
  static compareEntities(
    leftOccupationGroup: OccupationGroup,
    rightOccupationGroup: OccupationGroup
  ): Record<string, Record<string, string | string[]>> {
    const differences: Record<string, Record<string, string | string[]>> = {};

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
        differences[field] = {
          left: leftValue ?? "", // Handle null/undefined values
          right: rightValue ?? "",
        };
      }
    }

    // Special handling for alternative labels (array comparison)
    const leftAltLabels = arrayFromString(leftOccupationGroup.row.ALTLABELS);
    const rightAltLabels = arrayFromString(rightOccupationGroup.row.ALTLABELS);

    if (leftAltLabels.join(",") !== rightAltLabels.join(",")) {
      differences.ALTLABELS = {
        left: leftAltLabels,
        right: rightAltLabels,
      };
    }

    return differences;
  }

  /**
   * Loads occupation groups data from the CSV file and processes it into the model state
   *
   * @throws Error if the occupation groups CSV file cannot be read or parsed
   */
  async loadFromCSV(): Promise<void> {
    try {
      const result = await readCSV<IOccupationGroupImportRow>(
        path.join(this.modelManager.state.modelPath, FILENAMES.OccupationGroups),
        this.modelManager.logger
      );

      this.modelManager.state.occupationGroups = result.rows.map((row) => {
        const occupationGroupEntity = {
          row,
          ...parseUUIDHistory(row.UUIDHISTORY),
          altLabels: arrayFromString(row.ALTLABELS),
        };

        // Cache the entity for fast lookups
        this.modelManager.caches.occupationGroups.set(occupationGroupEntity.originUUID, occupationGroupEntity);

        return occupationGroupEntity;
      });

      this.modelManager.logger.info(`Loaded ${this.modelManager.state.occupationGroups.length} occupation groups`);
    } catch (error) {
      throw new Error(`Failed to load occupation groups from CSV: ${error}`);
    }
  }
}
