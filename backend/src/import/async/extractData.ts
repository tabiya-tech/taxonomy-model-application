import {ParsingOptions, read, Sheet2JSONOpts, utils, WorkSheet} from "xlsx";
export function extractData(csvData: Buffer): string[][] {
  const parseOptions: ParsingOptions = {
    type: 'buffer', raw: true
  };
  const workbook = read(csvData, parseOptions);
  const worksheet: WorkSheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonOptions: Sheet2JSONOpts = {
    header: 1
  };
  return utils.sheet_to_json<string[]>(worksheet, jsonOptions);
}