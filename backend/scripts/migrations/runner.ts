import mongoose from "mongoose";
import { getNewConnection } from "../../src/server/connection/newConnection";
import { getDbURI, readEnvironmentConfiguration, setConfiguration } from "../../src/server/config/config";
import { IMigration, IMigrationResult, MigrationDirection } from "./migration.types";
import { findMigration, MIGRATIONS } from "./migrations";

/**
 * The runner of the data migrations.
 *
 * It runs one migration, by name, in one direction, against the database of the MONGODB_URI environment variable:
 *
 *   yarn migrate:up 0001-model-info-available-languages
 *   yarn migrate:down 0001-model-info-available-languages
 *   yarn migrate:list
 *
 * Nothing is recorded about the run. There is no state collection and no state file: which migrations a database has
 * had applied is known from the runbook of the deployment, not from the database. Both directions of every migration
 * are therefore idempotent, running one twice is a no-op. See ./README.md.
 */

const DIRECTIONS: MigrationDirection[] = ["up", "down"];

/** Prints the migrations that can be run, name first, so that a name can be copied from the output. */
export function printAvailableMigrations(): void {
  console.info("Available migrations:");
  for (const migration of MIGRATIONS) {
    console.info(`  ${migration.name}\n      ${migration.description}`);
  }
}

/** Prints how the runner is invoked, followed by the migrations it can run. */
export function printUsage(): void {
  console.info("Usage: yarn migrate:up <migration-name> | yarn migrate:down <migration-name> | yarn migrate:list");
  console.info("The database is the one of the MONGODB_URI environment variable.");
  printAvailableMigrations();
}

/**
 * Runs the given migration in the given direction against the given database.
 * @param migration the migration to run
 * @param direction whether the migration is applied or reverted
 * @param dbURI the uri of the database to migrate
 * @returns how many documents the migration matched and modified
 */
export async function runMigration(
  migration: IMigration,
  direction: MigrationDirection,
  dbURI: string
): Promise<IMigrationResult> {
  const connection: mongoose.Connection = await getNewConnection(dbURI);
  const startedAt = Date.now();
  try {
    console.info(`Running '${migration.name}' ${direction}...`);
    const result = direction === "up" ? await migration.up(connection) : await migration.down(connection);
    console.info(
      `Migration '${migration.name}' ${direction} completed in ${Date.now() - startedAt}ms: ` +
        `${result.matched} document(s) matched, ${result.modified} document(s) modified.`
    );
    return result;
  } finally {
    await connection.close(false);
  }
}

/**
 * The entry point of the runner.
 * @param argv the arguments the runner was invoked with, i.e. the direction and the name of the migration
 * @returns the exit code, 0 when the migration ran, 1 when the arguments do not address a migration
 */
export async function main(argv: string[]): Promise<number> {
  const [direction, nameOrId] = argv;

  if (direction === "list") {
    printAvailableMigrations();
    return 0;
  }

  if (!DIRECTIONS.includes(direction as MigrationDirection)) {
    console.error(`Unknown direction '${direction ?? ""}', expected one of: ${DIRECTIONS.join(", ")}.`);
    printUsage();
    return 1;
  }

  if (!nameOrId) {
    console.error("No migration given. A migration is always run by name, one at a time.");
    printUsage();
    return 1;
  }

  const migration = findMigration(nameOrId);
  if (!migration) {
    console.error(`Unknown migration '${nameOrId}'.`);
    printAvailableMigrations();
    return 1;
  }

  setConfiguration(readEnvironmentConfiguration());
  await runMigration(migration, direction as MigrationDirection, getDbURI());
  return 0;
}

// Only run when invoked directly (not when imported by a test).
if (require.main === module) {
  main(process.argv.slice(2))
    .then((exitCode) => process.exit(exitCode))
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}
