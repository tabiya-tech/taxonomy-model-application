import fs from "fs";
import path from "path";

import { Differences } from "./types";
import { ModelManager } from "./model/manager";
import { findDifferences } from "./findDifferences";
import { createLogger } from "./logger";

/**
 * Parameters for the model difference calculation
 */
type Params = {
  /** Absolute path to the left model directory containing CSV files */
  leftModelPath: string;
  /** Absolute path to the right model directory containing CSV files */
  rightModelPath: string;
  /** Absolute path to the output directory where results will be saved */
  outputFolderPath: string;
  /** Optional filename for the differences output (defaults to 'differences.json') */
  outputFileName?: string;
  /** Whether to include detailed logging during the process */
  verbose?: boolean;
};

/**
 * Result of the diff operation
 */
interface DiffResult {
  /** Path to the generated differences file */
  outputPath: string;
  /** Summary statistics about the differences found */
  summary: {
    leftOnlyEntities: number;
    rightOnlyEntities: number;
    commonEntitiesWithDiffs: number;
    leftOnlyAssociations: number;
    rightOnlyAssociations: number;
    commonAssociationsWithDiffs: number;
  };
  /** Performance metrics */
  performance: {
    loadTime: number;
    diffTime: number;
    writeTime: number;
    totalTime: number;
  };
}

const logger = createLogger("main");

/**
 * Validates that the required directories and files exist
 *
 * @param modelPath - Path to the model directory
 * @throws Error if validation fails
 */
async function validateModelPath(modelPath: string): Promise<void> {
  if (!modelPath) {
    throw new Error(`Invalid model path: ${modelPath}. Must be a non-empty string.`);
  }

  try {
    const resolvedPath = path.resolve(modelPath);

    const stats = await fs.promises.stat(resolvedPath);
    if (!stats.isDirectory()) {
      throw new Error(`Model path is not a directory: ${resolvedPath}`);
    }

    // Check for required model_info.csv file
    const modelInfoPath = path.join(resolvedPath, "model_info.csv");
    await fs.promises.access(modelInfoPath, fs.constants.R_OK);
  } catch (error) {
    logger.error("Failed to validate model path", error as Error);
    throw error;
  }
}

/**
 * Validates the output directory and creates it if it doesn't exist.
 *
 * @param outputPath - Path to the output directory
 * @throws Error if validation fails
 */
async function validateOutputPath(outputPath: string): Promise<void> {
  if (!outputPath) {
    throw new Error(`Invalid output path: ${outputPath}. Must be a non-empty string.`);
  }

  try {
    const resolvedPath = path.resolve(outputPath);
    await fs.promises.access(resolvedPath, fs.constants.W_OK);
  } catch (error) {
    logger.error("Failed to validate output path", error as Error);
    throw error;
  }
}

/**
 * Loads a model with proper error handling and performance tracking
 *
 * @param modelPath - Path to the model
 * @param modelName - Descriptive name for logging
 * @param verbose - Whether to log detailed information
 * @returns Tuple of [ModelManager, loadTime]
 */
async function loadModel(modelPath: string, modelName: string, verbose: boolean): Promise<[ModelManager, number]> {
  const startTime = Date.now();

  if (verbose) {
    logger.info(`Loading ${modelName} model from: ${modelPath}`);
  }

  try {
    const modelManager = new ModelManager(modelPath);

    // Load the model info in the state
    await modelManager.loadModelInfo();

    if (verbose) {
      modelManager.logger.info(`${modelName} model info loaded: ${modelManager.state.modelName}`);
    }

    // Load the model entities and relations
    await modelManager.load();

    const loadTime = Date.now() - startTime;

    if (verbose) {
      modelManager.logger.info(`${modelName} model loaded successfully in ${loadTime}ms`);
      modelManager.logger.info(`  - Skills: ${modelManager.state.skills?.length ?? 0}`);
      modelManager.logger.info(`  - Skill Groups: ${modelManager.state.skillGroups?.length ?? 0}`);
      modelManager.logger.info(`  - Occupations: ${modelManager.state.occupations?.length ?? 0}`);
      modelManager.logger.info(`  - Occupation Groups: ${modelManager.state.occupationGroups?.length ?? 0}`);
    }

    return [modelManager, loadTime];
  } catch (error) {
    throw new Error(`Failed to load ${modelName} model from ${modelPath}`, { cause: error });
  }
}

/**
 * Calculates summary statistics from the differences object
 *
 * @param differences - The differences object returned by findDifferences
 * @returns Summary statistics
 */
function calculateSummary(differences: Differences) {
  if (!differences) {
    throw new Error("Differences object is null or undefined");
  }

  return {
    leftOnlyEntities: differences.left?.entities?.length ?? 0,
    rightOnlyEntities: differences.right?.entities?.length ?? 0,
    commonEntitiesWithDiffs: differences.common?.entities?.length ?? 0,
    leftOnlyAssociations: differences.left?.associations?.length ?? 0,
    rightOnlyAssociations: differences.right?.associations?.length ?? 0,
    commonAssociationsWithDiffs: differences.common?.associations?.length ?? 0,
  };
}

/**
 * Compare two taxonomy models and generate a detailed differences report
 *
 * This function loads two taxonomy models from their respective paths,
 * compares all entities (skills, occupations, etc.) and their relationships,
 * and generates a comprehensive differences report saved as JSON.
 *
 * @returns Promise<DiffResult> - Object containing output path, summary statistics, and performance metrics
 * @throws Error if validation fails, models cannot be loaded, or output cannot be written
 */
export async function diff({
  leftModelPath,
  rightModelPath,
  outputFolderPath,
  outputFileName = "differences.json",
  verbose = false,
}: Params): Promise<DiffResult> {
  const totalStartTime = Date.now();

  try {
    if (verbose) {
      logger.info("=== Tabiya Model Difference Analysis ===");
      logger.info(`Left model path: ${leftModelPath}`);
      logger.info(`Right model path: ${rightModelPath}`);
      logger.info(`Output folder: ${outputFolderPath}`);
      logger.info(`Output filename: ${outputFileName}`);
    }

    // Validate input paths and create an output directory if needed
    if (verbose) logger.info("Validating paths...");
    await Promise.all([
      validateModelPath(leftModelPath),
      validateModelPath(rightModelPath),
      validateOutputPath(outputFolderPath),
    ]);

    // Load both models in parallel with performance tracking
    if (verbose) logger.info("Loading models...");
    const loadStartTime = Date.now();

    const [[leftModelManager, leftLoadTime], [rightModelManager, rightLoadTime]] = await Promise.all([
      loadModel(leftModelPath, "Left", verbose),
      loadModel(rightModelPath, "Right", verbose),
    ]);

    if (verbose) {
      leftModelManager.logger.info(`Left model loaded in ${leftLoadTime}ms`);
      rightModelManager.logger.info(`Right model loaded in ${rightLoadTime}ms`);
    }

    const totalLoadTime = Date.now() - loadStartTime;

    if (verbose) {
      logger.info(`All models loaded in ${totalLoadTime}ms`);
      logger.info("Calculating differences...");
    }

    // Calculate differences between the two models
    const diffStartTime = Date.now();
    const differences = findDifferences(leftModelManager, rightModelManager);
    const diffTime = Date.now() - diffStartTime;

    if (verbose) {
      logger.info(`Differences calculated in ${diffTime}ms`);
    }

    // Generate summary statistics
    const summary = calculateSummary(differences);

    if (verbose) {
      logger.info("\n=== Differences Summary ===");
      logger.info(`Entities only in left model: ${summary.leftOnlyEntities}`);
      logger.info(`Entities only in right model: ${summary.rightOnlyEntities}`);
      logger.info(`Common entities with differences: ${summary.commonEntitiesWithDiffs}`);
      logger.info(`Associations only in left model: ${summary.leftOnlyAssociations}`);
      logger.info(`Associations only in right model: ${summary.rightOnlyAssociations}`);
      logger.info(`Common associations with differences: ${summary.commonAssociationsWithDiffs}`);
    }

    // Save the differences to a JSON file
    if (verbose) logger.info("\nSaving results...");
    const writeStartTime = Date.now();

    if (!outputFileName || outputFileName.trim() === "") {
      throw new Error("Output filename cannot be empty");
    }

    const outputPath = path.resolve(path.join(outputFolderPath, outputFileName));

    await fs.promises.writeFile(outputPath, JSON.stringify(differences, null, 2), "utf-8");

    const writeTime = Date.now() - writeStartTime;
    const totalTime = Date.now() - totalStartTime;

    const result: DiffResult = {
      outputPath,
      summary,
      performance: {
        loadTime: totalLoadTime,
        diffTime,
        writeTime,
        totalTime,
      },
    };

    if (verbose) {
      logger.info(`Results saved to: ${outputPath}`);
      logger.info(`\n=== Performance Summary ===`);
      logger.info(`Total time: ${totalTime}ms`);
      logger.info(`  - Loading: ${totalLoadTime}ms`);
      logger.info(`  - Diffing: ${diffTime}ms`);
      logger.info(`  - Writing: ${writeTime}ms`);
      logger.info("\n=== Analysis Complete ===");
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Model diff failed: ${errorMessage}`, error as Error);
    throw new Error(`Failed to compare models: ${errorMessage}`);
  }
}
