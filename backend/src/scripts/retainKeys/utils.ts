import fs from "fs";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import { RecordType } from "./types";

type CSVFileContent<T extends RecordType> = {
  rows: T[];
  fieldNames: string[];
};

/**
 * The function reads a CSV file and returns its content as an array of objects.
 *
 * @param inputFile - The file to read from.
 * @return content - The content of the file as an array of typed objects.
 */
export async function readCSV<T extends RecordType>(inputFile: string): Promise<CSVFileContent<T>> {
  const content = await fs.promises.readFile(inputFile, { encoding: "utf-8" });
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
  }) as T[];

  const fieldNames = records.length > 0 ? Object.keys(records[0]) : [];

  return {
    rows: records,
    fieldNames,
  };
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

/**
 * Build a mapping of keys from two sets of records.
 *
 * 1. The Length of the reference model records, and the targetRecord should match otherwise an error will happen.
 * 2. One update the reference model records to match the length of the target records.
 * 3. The keyField should be Unique both in reference model records, and model to update Records.
 *
 * @param referenceModelRecords - The reference model records to compare against. (One with Original Keys)
 * @param modelToUpdateRecords - The model to update records to compare. (One with New Keys to replace with)
 * @param keyField - The field to rely on, unique for each record.
 */
export function constructKeysMap(
  referenceModelRecords: RecordType[],
  modelToUpdateRecords: RecordType[],
  keyField: string = "CODE"
): Record<string, string> {
  const keysMap1: Record<string, string> = {};
  const keysMap2: Record<string, string> = {};

  for (const referenceRecord of referenceModelRecords) {
    keysMap1[referenceRecord[keyField]] = referenceRecord.ID;
  }

  for (const targetRecord of modelToUpdateRecords) {
    keysMap2[targetRecord[keyField]] = targetRecord.ID;
  }

  const finalKeysMap: Record<string, string> = {};

  for (const [key, value] of Object.entries(keysMap1)) {
    if (key in keysMap2) {
      finalKeysMap[keysMap2[key]] = value;
    }
  }

  if (
    Object.keys(finalKeysMap).length !== referenceModelRecords.length ||
    Object.keys(finalKeysMap).length !== modelToUpdateRecords.length ||
    new Set(Object.values(finalKeysMap)).size !== Object.keys(finalKeysMap).length ||
    new Set(Object.keys(finalKeysMap)).size !== Object.keys(finalKeysMap).length ||
    Object.keys(keysMap2).length !== Object.keys(keysMap1).length
  ) {
    throw new Error("Mismatch in key mappings");
  }

  return finalKeysMap;
}
