import { readCSV } from "./utils";
import path from "path";

type Params = {
  modelPath1: string;
  modelPath2: string;
};

function parseFieldNames(fieldNames: string[]): string[] {
  // Remove UPDATED and CREATED from the field names
  return fieldNames.filter((fieldName) => !["UPDATEDAT", "CREATEDAT"].includes(fieldName));
}

async function compareFiles(path1: string, path2: string) {
  // Read the CSV files
  const { rows: model1Rows, fieldNames: model1FieldNames } = await readCSV(path1);
  const { rows: model2Rows, fieldNames: model2FieldNames } = await readCSV(path2);

  // Check if the field names are the same
  if (JSON.stringify(parseFieldNames(model1FieldNames)) !== JSON.stringify(parseFieldNames(model2FieldNames))) {
    throw new Error("The field names of the two models do not match.");
  }

  // Check if the number of rows is the same
  if (model1Rows.length !== model2Rows.length) {
    throw new Error("The number of rows in the two models do not match.");
  }
}

export async function assertModelsAreEqual({ modelPath1, modelPath2 }: Params): Promise<void> {
  await compareFiles(path.join(modelPath1, "model_info.csv"), path.join(modelPath2, "model_info.csv"));
}
