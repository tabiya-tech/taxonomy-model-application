import fs from "fs";

import { Model } from "./model";
import { findDifferences } from "scripts/modelDiff/utils/comparing";

type Params = {
  modelPaths: [string, string],
  outputFilePath: string;
};

/**
 * Diff two models
 *
 * @param modelPaths - The paths to the models to diff.
 * @param outputFilePath - The path to the output file.
 */
export async function diff({ modelPaths, outputFilePath }: Params) {
  try {
    console.info("using minuend model path", modelPaths[0]);
    console.info("using subtrahend model path", modelPaths[0]);

    console.info("Diffing models...");

    // Construct the model objects

    const models = modelPaths.map(modelPath => new Model(modelPath));

    // Load the model info and then entities and relations
    await Promise.all(
      models.map(async (model) => {
        // 1. Load the model info in the state.
        await model.loadModelInfo();

        // 2. Load the model entities in the state.
        await model.load();
      })
    );

    // Once the models has been loaded, we can calculate the difference between the two models.
    const differences = findDifferences(models[0], models[1]);

    // Save the output in a JSON file.
    await fs.promises.writeFile(outputFilePath, JSON.stringify(differences, null, 2));
  } catch (e) {
    console.error(e);
    throw e;
  }
}
