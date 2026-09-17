// mute the console output
import "_test_utilities/consoleMock";

import { main } from "./runner";
import { findMigration, MIGRATIONS } from "./migrations";

describe("Test the migration runner", () => {
  const givenMigration = MIGRATIONS[0];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Test findMigration()", () => {
    test("should find a migration by its name", () => {
      // GIVEN the name of a migration
      const givenName = givenMigration.name;

      // WHEN the migration is looked up
      const actualMigration = findMigration(givenName);

      // THEN expect the migration to be found
      expect(actualMigration).toBe(givenMigration);
    });

    test("should find a migration by the name of its file", () => {
      // GIVEN the name of the file of a migration
      const givenFileName = `${givenMigration.name}.ts`;

      // WHEN the migration is looked up
      const actualMigration = findMigration(givenFileName);

      // THEN expect the migration to be found
      expect(actualMigration).toBe(givenMigration);
    });

    test("should find a migration by its id", () => {
      // GIVEN the id of a migration, i.e. the leading part of its name
      const givenId = givenMigration.name.split("-")[0];

      // WHEN the migration is looked up
      const actualMigration = findMigration(givenId);

      // THEN expect the migration to be found
      expect(actualMigration).toBe(givenMigration);
    });

    test("should not find a migration that does not exist", () => {
      // GIVEN a name no migration goes by
      const givenUnknownName = "9999-a-migration-that-does-not-exist";

      // WHEN the migration is looked up
      const actualMigration = findMigration(givenUnknownName);

      // THEN expect no migration to be found
      expect(actualMigration).toBeUndefined();
    });
  });

  describe("Test main()", () => {
    test("should run the migration the arguments address", async () => {
      // GIVEN a migration that can be applied
      const givenUpSpy = jest.spyOn(givenMigration, "up").mockResolvedValueOnce({ matched: 1, modified: 1 });

      // WHEN the runner is invoked to apply it by name
      const actualExitCode = await main(["up", givenMigration.name]);

      // THEN expect the migration to have been applied
      expect(givenUpSpy).toHaveBeenCalledTimes(1);

      // AND expect the runner to report success
      expect(actualExitCode).toEqual(0);
    });

    test("should revert the migration the arguments address", async () => {
      // GIVEN a migration that can be reverted
      const givenDownSpy = jest.spyOn(givenMigration, "down").mockResolvedValueOnce({ matched: 1, modified: 1 });

      // WHEN the runner is invoked to revert it by name
      const actualExitCode = await main(["down", givenMigration.name]);

      // THEN expect the migration to have been reverted
      expect(givenDownSpy).toHaveBeenCalledTimes(1);

      // AND expect the runner to report success
      expect(actualExitCode).toEqual(0);
    });

    test("should list the migrations without running any of them", async () => {
      // GIVEN the runner is asked to list the migrations
      const givenArgs = ["list"];

      // WHEN the runner is invoked
      const actualExitCode = await main(givenArgs);

      // THEN expect the runner to report success
      expect(actualExitCode).toEqual(0);

      // AND expect every migration to have been listed
      MIGRATIONS.forEach((migration) => {
        expect(console.info).toHaveBeenCalledWith(expect.stringContaining(migration.name));
      });
    });

    test("should fail when no migration is given", async () => {
      // GIVEN a direction without the name of a migration
      const givenArgs = ["up"];

      // WHEN the runner is invoked
      const actualExitCode = await main(givenArgs);

      // THEN expect the runner to report a failure
      expect(actualExitCode).toEqual(1);

      // AND expect the caller to be told that a migration is run by name
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining("No migration given"));
    });

    test("should fail when the direction is not known", async () => {
      // GIVEN a direction that is neither up nor down
      const givenArgs = ["sideways", MIGRATIONS[0].name];

      // WHEN the runner is invoked
      const actualExitCode = await main(givenArgs);

      // THEN expect the runner to report a failure
      expect(actualExitCode).toEqual(1);

      // AND expect the caller to be told which direction is unknown
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining("sideways"));
    });

    test("should fail when the migration is not known", async () => {
      // GIVEN the name of a migration that does not exist
      const givenUnknownName = "9999-a-migration-that-does-not-exist";

      // WHEN the runner is invoked to apply it
      const actualExitCode = await main(["up", givenUnknownName]);

      // THEN expect the runner to report a failure
      expect(actualExitCode).toEqual(1);

      // AND expect the caller to be told which migration is unknown
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining(givenUnknownName));
    });
  });
});
