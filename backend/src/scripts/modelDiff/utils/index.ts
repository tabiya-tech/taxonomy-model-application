import fs from "fs";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import { RecordType } from "scripts/modelDiff/types";

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
