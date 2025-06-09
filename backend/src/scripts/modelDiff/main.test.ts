//mute chatty console
import "_test_utilities/consoleMock";

import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

import { diff } from "./main";
import { Differences } from "./types";

import Mock = jest.Mock;

function getTestModelPath(version: string): string {
  const basePath = path.resolve(__dirname, "_test_data_", "given");
  return path.join(basePath, version);
}

function getTestDifferencesPath(filename: string): string {
  const basePath = path.resolve(__dirname, "_test_data_", "output");
  return path.join(basePath, filename);
}

export function getRandomTestOutputPath() {
  // Ensure the output directory exists
  const outputPath = path.resolve(__dirname, "..", "..", "..", "tmp", "modelDiff", randomUUID());
  fs.mkdirSync(outputPath, { recursive: true });

  return outputPath;
}

const v0ModelPath = getTestModelPath("v0");
const v1ModelPath = getTestModelPath("v1");
const v2ModelPath = getTestModelPath("v2");

const emptyDiffPath = getTestDifferencesPath("empty.json");

const v1v0DiffPath = getTestDifferencesPath("v1-v0.json");
const v2v0DiffPath = getTestDifferencesPath("v2-v0.json");

const v2v1DiffPath = getTestDifferencesPath("v2-v1.json");
const v1v2DiffPath = getTestDifferencesPath("v1-v2.json");

describe("modelDiff", () => {
  beforeEach(() => {
    // Clear console errors and warnings before each test
    (console.error as Mock).mockClear();
    (console.warn as Mock).mockClear();
  });

  test.each([
    // GIVEN similar models, differences should be empty.
    [v0ModelPath, v0ModelPath, emptyDiffPath],
    [v1ModelPath, v1ModelPath, emptyDiffPath],
    [v2ModelPath, v2ModelPath, emptyDiffPath],

    // For different models, differences should be found.
    [v1ModelPath, v0ModelPath, v1v0DiffPath],
    [v2ModelPath, v0ModelPath, v2v0DiffPath],

    [v2ModelPath, v1ModelPath, v2v1DiffPath],
    [v1ModelPath, v2ModelPath, v1v2DiffPath],
  ])(
    "should return expected changes given the left and the right models",
    async (givenLeftModelPath, givenRightModelPath, expectedDifferencesPath) => {
      // GIVEN left and right model paths.
      // AND a random output folder path is created.
      const outputFolderPath = getRandomTestOutputPath();

      // WHEN the left and the right models are compared.
      // AND the output is written to the output folder.
      const difference = await diff({
        leftModelPath: givenLeftModelPath,
        rightModelPath: givenRightModelPath,
        outputFileName: "output.json",
        outputFolderPath,
      });

      // THEN the output file should be created
      const differencesJSON: Differences = JSON.parse(fs.readFileSync(difference.outputPath, "utf-8"));

      // AND should match the content from the expected differences file
      const expectedDifferencesJSON: Differences = JSON.parse(fs.readFileSync(expectedDifferencesPath, "utf-8"));

      expect(differencesJSON.left).toStrictEqual(expectedDifferencesJSON.left);
      expect(differencesJSON.right).toStrictEqual(expectedDifferencesJSON.right);
      expect(differencesJSON.common).toStrictEqual(expectedDifferencesJSON.common);

      // AND no console errors or warnings should be logged
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();

      // Delete the output folder after the test
      fs.rmSync(outputFolderPath, { recursive: true, force: true });
    }
  );
});
