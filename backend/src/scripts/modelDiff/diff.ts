import fs from "fs";

import { ModelManager } from "./model/manager";
import { SkillsService } from "./esco/skills";
import { IModelManager } from "./model/types";
import { Change } from "./esco/types";
import { SkillGroupsService } from "./esco/skillGroups";
import { OccupationService } from "./esco/occupations";
import { OccupationGroupsService } from "./esco/occupationGroups";
import path from "path";
import { getDifferencesSummary } from "./summary";

type Params = {
  modelPaths: [string, string];
  outputFolderPath: string;
};

function findDifferences(modelManager1: IModelManager, modelManager2: IModelManager) {
  // Initialize an empty array to store the differences
  // Because JavaScript reference arrays by reference, It will be appended everytime the comparing functions append on it.
  const differences: Change[] = [];

  SkillsService.compareEntities(modelManager1, modelManager2, differences);
  SkillGroupsService.compareEntities(modelManager1, modelManager2, differences);
  OccupationService.compareEntities(modelManager1, modelManager2, differences);
  OccupationGroupsService.compareEntities(modelManager1, modelManager2, differences);

  // Return the array of differences
  return differences;
}


/**
 * Diff two models
 *
 * @param modelPaths - The paths to the models to diff.
 * @param outputFolderPath - The path to the output folder.
 */
export async function diff({ modelPaths, outputFolderPath }: Params) {
  try {
    console.info("using minuend model path", modelPaths[0]);
    console.info("using subtrahend model path", modelPaths[0]);

    console.info("Diffing models...");

    // Construct the model objects

    const modelManagers = modelPaths.map((modelPath) => new ModelManager(modelPath));

    // Load the model info and then entities and relations
    await Promise.all(
      modelManagers.map(async (model) => {
        // 1. Load the model info in the state.
        await model.loadModelInfo();

        // 2. Load the model entities in the state.
        await model.load();
      })
    );

    // Once the models have been loaded, we can calculate the difference between the two models.
    const differences = findDifferences(modelManagers[0], modelManagers[1]);

    // Save the differences in a JSON file.
    const differencesJSONFile = path.join(outputFolderPath, "differences.json");
    await fs.promises.writeFile(differencesJSONFile, JSON.stringify(differences, null, 2));

    // Save the summary in a Markdown file.
    const summary = getDifferencesSummary(differences);
    const summaryMarkdownFile = path.join(outputFolderPath, "summary.md");
    await fs.promises.writeFile(summaryMarkdownFile, summary);
  } catch (e) {
    console.error(e);
    throw e;
  }
}
