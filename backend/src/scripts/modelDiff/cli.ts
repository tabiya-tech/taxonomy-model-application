#!/usr/bin/env ts-node

// Register the tsconfig paths to resolve module paths correctly
// This is necessary for this CLI, since we are not building the script into a single file
// and need to resolve paths based on the tsconfig settings.
import "tsconfig-paths/register";

import { Command } from "commander";
import { diff } from "./main";

const program = new Command();

program
  .name("model-diff")
  .description("CLI tool to compare two Tabiya taxonomy models and generate difference reports")
  .version("1.0.0");

program
  .requiredOption(
    "-l, --left-model-path <path>",
    "Absolute path to the left model directory (must contain model_info.csv)"
  )
  .requiredOption(
    "-r, --right-model-path <path>",
    "Absolute path to the right model directory (must contain model_info.csv)"
  )
  .requiredOption(
    "-o, --output-folder-path <path>",
    "Absolute path to the output directory where results will be saved"
  )
  .option("-f, --output-file-name <filename>", "Custom filename for the differences output", "differences.json")
  .option("-v, --verbose", "Enable detailed logging and progress information", false)
  .action(
    async (options: {
      leftModelPath: string;
      rightModelPath: string;
      outputFolderPath: string;
      outputFileName: string;
      verbose: boolean;
    }) => {
      const resp = await diff(options);
      console.log(`Differences written to: ${resp.outputPath}`);
    }
  );

program.parse(process.argv);
