import { parse } from "csv-parse/sync";
import fs from "fs";

// returns the number of records in a csv file
export function countCSVRecords(file: string): number {
  const content = fs.readFileSync(file);
  const parser = parse(content, { columns: true });
  expect(parser.length).toBeGreaterThan(0);
  return parser.length;
}
