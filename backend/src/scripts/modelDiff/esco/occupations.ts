import path from "path";

import { FILENAMES } from "export/async/modelToS3";
import { parseUUIDHistory, readCSV } from "./common";
import { ESCOEntityService, Occupation } from "./types";
import { IOccupationImportRow } from "esco/common/entityToCSV.types";
import { arrayFromString } from "common/parseNewLineSeparateArray/parseNewLineSeparatedArray";

/**
 * Service for handling Occupations entities in the taxonomy model
 * Provides loading from CSV and comparison functionality for occupation data
 */
export class OccupationService extends ESCOEntityService {
  /**
   * Compares two occupation entities and identifies differences in their properties
   *
   * @param leftOccupation - The occupation from the left model
   * @param rightOccupation - The occupation from the right model
   * @returns Object containing all property differences found
   */
  static compareEntities(
    leftOccupation: Occupation,
    rightOccupation: Occupation
  ): Record<string, Record<string, string | string[]>> {
    const differences: Record<string, Record<string, string | string[]>> = {};

    // Define fields that should be compared between occupations
    const comparableFields: (keyof typeof leftOccupation.row)[] = [
      "ORIGINURI",
      "OCCUPATIONGROUPCODE",
      "CODE",
      "PREFERREDLABEL",
      "DESCRIPTION",
      "DEFINITION",
      "SCOPENOTE",
      "REGULATEDPROFESSIONNOTE",
      "ISLOCALIZED",
      "OCCUPATIONTYPE",
    ];

    // Compare each field and record differences
    for (const field of comparableFields) {
      const leftValue = leftOccupation.row[field];
      const rightValue = rightOccupation.row[field];

      if (leftValue !== rightValue) {
        differences[field] = {
          left: leftValue ?? "", // Handle null/undefined values
          right: rightValue ?? "",
        };
      }
    }

    // Special handling for alternative labels (array comparison)
    const leftAltLabels = arrayFromString(leftOccupation.row.ALTLABELS);
    const rightAltLabels = arrayFromString(rightOccupation.row.ALTLABELS);

    if (leftAltLabels.join(",") !== rightAltLabels.join(",")) {
      differences.ALTLABELS = {
        left: leftAltLabels,
        right: rightAltLabels,
      };
    }

    return differences;
  }

  /**
   * Loads occupations data from the CSV file and processes it into the model state
   *
   * @throws Error if the occupations CSV file cannot be read or parsed
   */
  async loadFromCSV(): Promise<void> {
    try {
      const result = await readCSV<IOccupationImportRow>(
        path.join(this.modelManager.state.modelPath, FILENAMES.Occupations),
        this.modelManager.logger
      );

      this.modelManager.state.occupations = result.rows.map((row) => {
        const occupationEntity = {
          row,
          ...parseUUIDHistory(row.UUIDHISTORY),
          altLabels: arrayFromString(row.ALTLABELS),
          children: [],
          parents: [],
          skills: [],
        };

        // Cache the entity for fast lookups
        this.modelManager.caches.occupations.set(occupationEntity.originUUID, occupationEntity);

        return occupationEntity;
      });

      this.modelManager.logger.info(`Loaded ${this.modelManager.state.occupations.length} occupations`);
    } catch (error) {
      throw new Error(`Failed to load occupations from CSV: ${error}`);
    }
  }
}
