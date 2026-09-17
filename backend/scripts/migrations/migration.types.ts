import mongoose from "mongoose";

/**
 * The outcome of a migration step.
 *
 * The counts are reported by the runner so that a run can be compared with the size of the collection, e.g. a second
 * run of an already applied migration matches nothing and is a no-op.
 */
export interface IMigrationResult {
  /** The number of documents the step matched, i.e. the documents that still needed the change. */
  matched: number;
  /** The number of documents the step actually modified. */
  modified: number;
}

/**
 * A single, manually run data migration.
 *
 * Migrations are not tracked: nothing records that a migration ran, there is no state collection and no state file.
 * They are run by name, by hand, against a `MONGODB_URI`, and both steps are idempotent so that running one twice is
 * harmless. See ./README.md for the runbook.
 */
export interface IMigration {
  /** The name the migration is run by, e.g. "0001-model-info-available-languages". It matches the file name. */
  readonly name: string;
  /** What the migration does, shown when the available migrations are listed. */
  readonly description: string;
  /**
   * Applies the migration.
   * @param connection an open connection to the database to migrate
   * @returns how many documents needed the change and how many were changed
   */
  up(connection: mongoose.Connection): Promise<IMigrationResult>;
  /**
   * Reverts the migration.
   * @param connection an open connection to the database to migrate
   * @returns how many documents needed the change and how many were changed
   */
  down(connection: mongoose.Connection): Promise<IMigrationResult>;
}

/** The direction a migration is run in. */
export type MigrationDirection = "up" | "down";
