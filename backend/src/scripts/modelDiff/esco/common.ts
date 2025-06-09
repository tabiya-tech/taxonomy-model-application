/**
 * Common utilities for ESCO model processing
 */

import fs from "fs";
import { parse } from "csv-parse/sync";

import { RecordType } from "./types";
import { arrayFromString } from "common/parseNewLineSeparateArray/parseNewLineSeparatedArray";
import { Logger } from "scripts/modelDiff/logger";
import { stringify } from "csv-stringify";

/**
 * Structure representing the content of a parsed CSV file
 */
type CSVFileContent<T extends RecordType> = {
  /** Array of parsed rows from the CSV */
  rows: T[];
  /** Field names extracted from the CSV header */
  fieldNames: string[];
};

/**
 * Parsed UUID history information
 */
type UUIDHistoryParsed = {
  /** Complete history of UUIDs as an array */
  UUIDHistory: string[];
  /** Most recent UUID (first in history) */
  recentUUID: string;
  /** Original UUID (last in history) */
  originUUID: string;
};

/**
 * Parses a string representing a UUID history into structured information
 *
 * UUID history is typically stored as a newline-separated string where:
 * - The first UUID is the most recent
 * - The last UUID is the original
 *
 * @param UUIDHistory - A string containing the history of UUIDs
 * @returns Parsed UUID history with recent and original UUIDs identified
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
 * 3. Extracts field names from headers
 * 4. Returns structured data
 *
 * @param inputFile - Absolute path to the CSV file to read
 * @param logger - Logger instance for logging messages
 * @returns Promise resolving to structured CSV content with typed rows
 * @throws Error if file cannot be read or CSV parsing fails
 */
export async function readCSV<T extends RecordType>(inputFile: string, logger: Logger): Promise<CSVFileContent<T>> {
  try {
    // Validate input file path
    if (!inputFile || inputFile.trim().length === 0) {
      throw new Error("Input file path cannot be empty");
    }

    // Check if file exists and is readable
    try {
      await fs.promises.access(inputFile, fs.constants.R_OK);
    } catch (accessError) {
      throw new Error(`Cannot access file: ${inputFile}. ${accessError}`);
    }

    // Read file content
    const content = await fs.promises.readFile(inputFile, { encoding: "utf-8" });

    if (!content || content.trim().length === 0) {
      throw new Error(`File is empty: ${inputFile}`);
    }

    // Parse CSV with robust configuration
    const records = parse(content, {
      columns: true, // Use first line as headers
      skip_empty_lines: true, // Skip empty lines
      trim: true, // Trim whitespace from values
      relaxColumnCount: true, // Allow inconsistent column counts
      skipRecordsWithError: false, // Don't skip records with errors
    }) as T[];

    // Extract field names from the first record (if any)
    const fieldNames = records.length > 0 ? Object.keys(records[0]) : [];

    if (fieldNames.length === 0) {
      logger.warn(`No fields found in CSV file: ${inputFile}`);
    }

    logger.info(`Successfully parsed ${records.length} rows from ${inputFile}`);

    return {
      rows: records,
      fieldNames,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to read CSV file '${inputFile}': ${error.message}`);
    }
    throw new Error(`Failed to read CSV file '${inputFile}': ${String(error)}`);
  }
}

/**
 * Save the CSV content in a file
 * @param outputFile - Writable file
 * @param content - The content to write
 * @param fieldNames - The field names to write.
 */
export async function writeCSV(outputFile: string, content: RecordType[], fieldNames: string[]): Promise<void> {
  const csvContent = stringify(content, {
    header: true,
    columns: fieldNames,
    quoted_string: true,
  });

  await fs.promises.writeFile(outputFile, csvContent, { encoding: "utf-8" });
}
