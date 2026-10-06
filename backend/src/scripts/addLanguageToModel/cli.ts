#!/usr/bin/env ts-node

// Resolves the project's path aliases (e.g. "server/...") since this CLI runs standalone, unbundled.
import "tsconfig-paths/register";

import { Command } from "commander";
import { getNewConnection } from "server/connection/newConnection";
import { getDbURI, readEnvironmentConfiguration, setConfiguration } from "server/config/config";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { addLanguageToModel, DEFAULT_REPORT_FILE_NAME } from "./main";

const program = new Command();

program
  .name("add-language-to-model")
  .description(
    "Adds a new language to an already imported model by matching an incoming CSV against existing entities " +
      "(by importId) and merging the new language into their localized fields. Never re-imports the taxonomy, " +
      "never changes a UUID, never touches hierarchies or relations, and never creates an entity."
  )
  .version("1.0.0");

program
  .requiredOption("-m, --model-id <id>", "The id of the model to add the language to")
  .requiredOption("-l, --language <shortCode>", "The short code of the language to add, e.g. fr")
  .option("--occupation-groups-csv <path>", "Path to the occupation groups CSV carrying the new language's columns")
  .option("--occupations-csv <path>", "Path to the occupations CSV carrying the new language's columns")
  .option("--skills-csv <path>", "Path to the skills CSV carrying the new language's columns")
  .option("--skill-groups-csv <path>", "Path to the skill groups CSV carrying the new language's columns")
  .requiredOption("-o, --output-folder-path <path>", "Absolute path to the output directory for the summary report")
  .option("-f, --output-file-name <filename>", "Custom filename for the summary report", DEFAULT_REPORT_FILE_NAME)
  .option("--dry-run", "Report matched, unmatched and would-change counts without writing anything", false)
  .option("-v, --verbose", "Enable detailed logging and progress information", false)
  .action(
    async (options: {
      modelId: string;
      language: string;
      occupationGroupsCsv?: string;
      occupationsCsv?: string;
      skillsCsv?: string;
      skillGroupsCsv?: string;
      outputFolderPath: string;
      outputFileName: string;
      dryRun: boolean;
      verbose: boolean;
    }) => {
      setConfiguration(readEnvironmentConfiguration());
      const dbURI = getDbURI();
      if (!dbURI) {
        console.error(
          "MONGODB_URI is not set. Set it to the connection string of the database that holds the model, e.g.:\n" +
            '  export MONGODB_URI="mongodb://localhost:27017/"\n' +
            "See README.md for details."
        );
        process.exitCode = 1;
        return;
      }
      const connection = await getNewConnection(dbURI);
      try {
        await getRepositoryRegistry().initialize(connection);
        const result = await addLanguageToModel({
          modelId: options.modelId,
          languageShortCode: options.language,
          occupationGroupsCsvPath: options.occupationGroupsCsv,
          occupationsCsvPath: options.occupationsCsv,
          skillsCsvPath: options.skillsCsv,
          skillGroupsCsvPath: options.skillGroupsCsv,
          outputFolderPath: options.outputFolderPath,
          outputFileName: options.outputFileName,
          dryRun: options.dryRun,
          verbose: options.verbose,
        });

        console.log(`Report written to: ${result.outputPath}`);
        console.log(
          `Totals: ${result.totals.totalRows} row(s), ${result.totals.matched} matched ` +
            `(${result.totals.changed} changed, ${result.totals.unchanged} unchanged), ${result.totals.unmatched} unmatched`
        );
        if (result.dryRun) {
          console.log("Dry run: no changes were written.");
        } else {
          console.log(`availableLanguages updated: ${result.availableLanguagesUpdated}`);
          console.log(`\n${result.embeddingsFollowUpCommand}`);
        }
      } finally {
        await connection.close(false);
      }
    }
  );

program.parse(process.argv);
