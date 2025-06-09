import path from "path";

import { FILENAMES } from "export/async/modelToS3";
import { compareArrayFields, constructDiffObject, parseUUIDHistory, readCSV } from "./common";
import { TaxonomyEntityService, Occupation } from "./types";
import { IOccupationImportRow } from "esco/common/entityToCSV.types";
import { PropsDiffValue } from "scripts/modelDiff/types";

/**
 * Service for handling Occupations entities in the taxonomy model
 * Provides loading from CSV and comparison functionality for occupation data.
 */
export class OccupationService extends TaxonomyEntityService {
  /**
   * Compares two occupation entities and identifies differences in their properties
   *
   * @param leftOccupation - The occupation from the left model
   * @param rightOccupation - The occupation from the right model
   * @returns Object containing all property differences found.
   */
  static compareEntities(leftOccupation: Occupation, rightOccupation: Occupation): PropsDiffValue[] {
    const differences: PropsDiffValue[] = [];

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
        differences.push(constructDiffObject(field, leftValue, rightValue));
      }
    }

    // Special handling for alternative labels (array comparison)
    compareArrayFields(leftOccupation.row.ALTLABELS, rightOccupation.row.ALTLABELS, "ALTLABELS", differences);

    return differences;
  }

  /**
   * Loads occupation data from the CSV file and processes it into the model state.
   * @throws Error if the occupations CSV file cannot be read or parsed.
   */
  async loadFromCSV(): Promise<void> {
    try {
      const filePath = path.join(this.modelManager.state.modelPath, FILENAMES.Occupations);

      const result = await readCSV<IOccupationImportRow>(filePath, this.modelManager.logger);

      this.modelManager.state.occupations = result.rows.map((row) => {
        const occupationEntity = { row, ...parseUUIDHistory(row.UUIDHISTORY) };

        // Cache the entity for fast lookups
        this.modelManager.caches.occupations.UUIDS.set(occupationEntity.originUUID, occupationEntity);
        this.modelManager.caches.occupations.IDS.set(occupationEntity.row.ID, occupationEntity);

        return occupationEntity;
      });

      this.modelManager.logger.info(`Loaded ${this.modelManager.state.occupations.length} occupations`);
    } catch (error) {
      throw new Error(`Failed to load occupations from CSV.`, { cause: error });
    }
  }
}
