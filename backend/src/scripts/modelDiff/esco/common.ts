/**
 * Common utilities for ESCO model processing
 */

import fs from "fs";
import { parse } from "csv-parse/sync";

import { CSVFileRecordType, UUIDHistoryParsed } from "./types";
import { arrayFromString } from "common/parseNewLineSeparateArray/parseNewLineSeparatedArray";
import { Logger } from "scripts/modelDiff/logger";
import { DifferencesValue, PropsDiffValue } from "../types";

/**
 * Structure representing the content of a parsed CSV file
 */
type CSVFileContent<T extends CSVFileRecordType> = {
  /** Array of parsed rows from the CSV */
  rows: T[];
};

/**
 * Parses a string representing a UUID history into structured information
 *
 * UUID history is typically stored as a newline-separated string where:
 * — The first UUID is the most recent
 * — The last UUID is the original.
 *
 * @param UUIDHistory - A string containing the history of UUIDs
 *
 * @returns Parsed UUID history with recent and origin UUIDs identified,
 */
export function parseUUIDHistory(UUIDHistory: string): UUIDHistoryParsed {
  if (!UUIDHistory || UUIDHistory.trim().length === 0) {
    throw new Error("UUID history cannot be empty");
  }

  const history = arrayFromString(UUIDHistory);

  if (history.length === 0) {
    throw new Error("UUID history must contain at least one UUID");
  }

  return {
    UUIDHistory: history,
    recentUUID: history[0],
    originUUID: history[history.length - 1],
  };
}

/**
 * Reads and parses a CSV file into typed objects
 *
 * This function handles the complete CSV processing pipeline:
 * 1. Reads the file from disk
 * 2. Parses CSV content with proper configuration
 * 4. Returns structured data.
 *
 * @param inputFile - Absolute path to the CSV file to read
 * @param logger - Logger instance for logging messages.
 *
 * @returns Promise resolving to structured CSV content with typed rows
 *
 * @throws Error if the file cannot be read or CSV parsing fails.
 */
export async function readCSV<T extends CSVFileRecordType>(
  inputFile: string,
  logger: Logger
): Promise<CSVFileContent<T>> {
  // Validate an input file path.
  if (!inputFile || inputFile.trim().length === 0) {
    throw new Error("Input file path cannot be empty");
  }

  // Check if the file exists and is readable
  try {
    await fs.promises.access(inputFile, fs.constants.R_OK);
  } catch (accessError) {
    throw new Error(`Cannot access file: ${inputFile}.`, { cause: accessError });
  }

  try {
    // Read file content
    const content = await fs.promises.readFile(inputFile, { encoding: "utf-8" });

    // Parse CSV with robust configuration
    const records = parse(content, {
      columns: true, // Use the first line as headers
      skip_empty_lines: true, // Skip empty lines
      trim: true, // Trim whitespace from values
      relaxColumnCount: true, // Allow inconsistent column counts
      skipRecordsWithError: false, // Don't skip records with errors
    }) as T[];

    logger.info(`Successfully parsed ${records.length} rows from ${inputFile}`);

    return {
      rows: records,
    };
  } catch (error) {
    throw new Error(`Failed to read CSV file '${inputFile}'.`, { cause: error });
  }
}

/**
 * Compares two array fields represented as strings and records differences
 *
 * @param leftValue
 * @param rightValue
 * @param key - the field name to record differences under
 * @param differences
 */
export function compareArrayFields(leftValue: string, rightValue: string, key: string, differences: PropsDiffValue[]) {
  const formattedLeftValue = arrayFromString(leftValue);
  const formattedRightValue = arrayFromString(rightValue);

  if (formattedLeftValue.join(",") !== formattedRightValue.join(",")) {
    differences.push(constructDiffObject(key, formattedLeftValue, formattedRightValue));
  }
}

export function constructDiffObject(
  fieldName: string,
  leftValue: DifferencesValue,
  rightValue: DifferencesValue
): PropsDiffValue {
  return {
    key: {
      name: fieldName,
    },
    value: {
      left: leftValue,
      right: rightValue,
    },
  };
}
