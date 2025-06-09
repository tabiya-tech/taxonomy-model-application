import fs from "fs";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

import { Change, ChangeType, Entity, RecordType } from "./types";
import { arrayFromString } from "common/parseNewLineSeparateArray/parseNewLineSeparatedArray";
import { IModelManager } from "../model/types";
import { diffArrays, diffWords } from "diff";

type CSVFileContent<T extends RecordType> = {
  rows: T[];
  fieldNames: string[];
};

/**
 * Parses a string representing a UUID history into an array and extracts relevant details.
 *
 * @param {string} UUIDHistory - A string containing the history of UUIDs, typically separated by a specific delimiter.
 * @return {UUIDHistoryParsed} An object containing the parsed UUID history as an array, the most recent UUID, and the original UUID.
 */
type UUIDHistoryParsed = {
  UUIDHistory: string[];
  recentUUID: string;
  originalUUID: string;
};

export function parseUUIDHistory(UUIDHistory: string): UUIDHistoryParsed {
  const history = arrayFromString(UUIDHistory);

  return {
    UUIDHistory: history,
    recentUUID: history[0],
    originalUUID: history[history.length - 1],
  };
}

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

export function compareESCOEntity(
  model: IModelManager,
  entity1: Entity,
  entity2: Entity,
  differences: Change[],
  entityName: "skill" | "occupation" | "skillGroup" | "occupationGroup"
) {
  if (entity1.row.PREFERREDLABEL !== entity2.row.PREFERREDLABEL) {
    differences.push({
      type: ChangeType.NOT_EQUAL,
      entityType: entityName,
      label: "preferredLabel",
      identifier: entity1.row.ID,
      changes: diffWords(entity1.row.PREFERREDLABEL, entity2.row.PREFERREDLABEL),
      entity: entity1.originalUUID,
      entityLabel: entity1.row.PREFERREDLABEL,
      modelId: model.state.modelId,
      modelName: model.state.getModelName()
    });
  }

  if (entity1.row.DESCRIPTION !== entity2.row.DESCRIPTION) {
    differences.push({
      type: ChangeType.NOT_EQUAL,
      entityType: entityName,
      label: "description",
      changes: diffWords(entity1.row.DESCRIPTION, entity2.row.DESCRIPTION),
      identifier: entity1.row.ID,
      entity: entity1.originalUUID,
      entityLabel: entity1.row.PREFERREDLABEL,
      modelId: model.state.modelId,
      modelName: model.state.getModelName()
    });
  }

  if (entity1.row.ALTLABELS !== entity2.row.ALTLABELS) {
    differences.push({
      type: ChangeType.NOT_EQUAL,
      entityType: entityName,
      label: "altLabels",
      changes: diffWords(entity1.row.ALTLABELS, entity2.row.ALTLABELS),
      identifier: entity1.row.ID,
      entity: entity1.originalUUID,
      entityLabel: entity1.row.PREFERREDLABEL,
      modelId: model.state.modelId,
      modelName: model.state.getModelName()
    });
  }
}

export function arrayMatch(array1: string[], array2: string[]) {
  const sortStrings = (a: string, b: string) => a.localeCompare(b);

  array1.sort(sortStrings);
  array2.sort(sortStrings);

  const diff = diffArrays(array1, array2);

  return diff.every((part) => part.added === false && part.removed === false);
}
