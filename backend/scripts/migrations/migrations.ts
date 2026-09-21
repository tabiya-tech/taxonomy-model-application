import modelInfoAvailableLanguages from "./0001-model-info-available-languages";
import occupationsLocalizedFields from "./0002-occupations-localized-fields";
import occupationGroupsLocalizedFields from "./0003-occupation-groups-localized-fields";
import skillsLocalizedFields from "./0004-skills-localized-fields";
import { IMigration } from "./migration.types";

/**
 * The migrations of the backend, in the order they were introduced.
 *
 * A migration is added here so that the runner can find it by name. Nothing in this list implies an order of
 * execution: migrations are run one by one, by hand, see ./README.md.
 */
export const MIGRATIONS: readonly IMigration[] = [
  modelInfoAvailableLanguages,
  occupationsLocalizedFields,
  occupationGroupsLocalizedFields,
  skillsLocalizedFields,
];

/**
 * Finds the migration to run.
 *
 * A migration is addressed by its name, e.g. "0001-model-info-available-languages". The file name it was copied from
 * and the leading id on their own are accepted too, e.g. "0001-model-info-available-languages.ts" and "0001", so that
 * a name copied from the directory listing or shortened by hand still resolves.
 *
 * @param nameOrId the name, the file name, or the id of the migration to find
 * @returns the migration, or undefined when no migration goes by that name
 */
export function findMigration(nameOrId: string): IMigration | undefined {
  const wanted = nameOrId.trim().replace(/\.ts$/, "").toLowerCase();
  return MIGRATIONS.find(
    (migration) => migration.name.toLowerCase() === wanted || migration.name.split("-")[0] === wanted
  );
}
