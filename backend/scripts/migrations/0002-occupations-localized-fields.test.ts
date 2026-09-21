// suppress chatty log output when testing
import "_test_utilities/consoleMock";

import mongoose, { Connection } from "mongoose";
import { randomUUID } from "crypto";
import { getNewConnection } from "server/connection/newConnection";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { initializeSchemaAndModel } from "esco/occupations/model/occupation.model";
import { buildMigrationUpdate, migrateOccupationsLocalizedFields } from "./0002-occupations-localized-fields";
import migration from "./0002-occupations-localized-fields";
import { ObjectTypes } from "esco/common/objectTypes";
import { getMockObjectId } from "_test_utilities/mockMongoId";

describe("Test the 0002-occupations-localized-fields migration with an in-memory mongodb", () => {
  let dbConnection: Connection;
  let OccupationModel: mongoose.Model<never>;

  beforeAll(async () => {
    // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("OccupationsLocalizedFieldsMigrationTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    OccupationModel = initializeSchemaAndModel(dbConnection) as unknown as mongoose.Model<never>;
  });

  afterAll(async () => {
    if (dbConnection) {
      await dbConnection.dropDatabase();
      await dbConnection.close(false);
    }
  });

  afterEach(async () => {
    await OccupationModel.collection.deleteMany({});
  });

  // inserts a document via the native driver, bypassing the (already localized) schema, so a pre-migration
  // (flat string) document can be seeded
  async function insertPreMigrationOccupation(overrides: Record<string, unknown> = {}) {
    const doc = {
      UUID: randomUUID(),
      modelId: getMockObjectId(1),
      UUIDHistory: [randomUUID()],
      originUri: "https://foo.bar",
      occupationGroupCode: "1234",
      code: "1234.1",
      preferredLabel: "mine surveyor",
      altLabels: ["surveyor", "mine engineer"],
      description: "a description",
      definition: "a definition",
      scopeNote: "a scope note",
      regulatedProfessionNote: "a regulated profession note",
      occupationType: ObjectTypes.ESCOOccupation,
      isLocalized: false,
      importId: "import-1",
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
    const { insertedId } = await OccupationModel.collection.insertOne(doc);
    return insertedId;
  }

  describe("Test up()", () => {
    test("should rewrite a flat string preferredLabel/description/definition/scopeNote/regulatedProfessionNote and altLabels into localized sub documents", async () => {
      // GIVEN an Occupation document that is still in the old, flat string shape
      const givenId = await insertPreMigrationOccupation();

      // WHEN the migration runs
      const actualStats = await migration.up(dbConnection);

      // THEN expect one document to have been matched and modified
      expect(actualStats).toEqual({ matched: 1, modified: 1 });
      // AND the document's translatable fields to be rewritten as localized sub documents keyed by "en"
      const actualDoc = await OccupationModel.collection.findOne({ _id: givenId });
      expect(actualDoc).toMatchObject({
        preferredLabel: { en: "mine surveyor" },
        description: { en: "a description" },
        definition: { en: "a definition" },
        scopeNote: { en: "a scope note" },
        regulatedProfessionNote: { en: "a regulated profession note" },
        altLabels: [{ en: "surveyor" }, { en: "mine engineer" }],
      });
      // AND the monolingual fields to be left untouched
      expect(actualDoc).toMatchObject({
        code: "1234.1",
        occupationType: ObjectTypes.ESCOOccupation,
        isLocalized: false,
      });
    });

    test("should be idempotent: running the migration again on an already migrated document changes nothing", async () => {
      // GIVEN an Occupation document that is still in the old, flat string shape
      const givenId = await insertPreMigrationOccupation();
      // AND the migration has already run once
      await migration.up(dbConnection);
      const givenMigratedDoc = await OccupationModel.collection.findOne({ _id: givenId });

      // WHEN the migration runs again
      const actualStats = await migration.up(dbConnection);

      // THEN expect no document to have been matched this time, since it was already migrated
      expect(actualStats).toEqual({ matched: 0, modified: 0 });
      // AND the document to be unchanged
      const actualDoc = await OccupationModel.collection.findOne({ _id: givenId });
      expect(actualDoc).toEqual(givenMigratedDoc);
    });

    test("should be resumable: a mix of already migrated and not yet migrated documents are handled correctly in one run", async () => {
      // GIVEN one Occupation document that is already migrated (as if a previous run was interrupted after it)
      const givenMigratedId = await insertPreMigrationOccupation({ code: "1234.1", UUID: randomUUID() });
      await OccupationModel.collection.updateOne(
        { _id: givenMigratedId },
        {
          $set: {
            preferredLabel: { en: "already migrated" },
            description: { en: "a description" },
            definition: { en: "a definition" },
            scopeNote: { en: "a scope note" },
            regulatedProfessionNote: { en: "a regulated profession note" },
            altLabels: [{ en: "surveyor" }, { en: "mine engineer" }],
          },
        }
      );
      // AND another Occupation document that is not yet migrated
      const givenNotYetMigratedId = await insertPreMigrationOccupation({ code: "1234.2", UUID: randomUUID() });

      // WHEN the migration runs
      const actualStats = await migration.up(dbConnection);

      // THEN expect only the not-yet-migrated document to have been matched and modified
      expect(actualStats).toEqual({ matched: 1, modified: 1 });
      const actualMigratedDoc = await OccupationModel.collection.findOne({ _id: givenMigratedId });
      expect(actualMigratedDoc?.preferredLabel).toEqual({ en: "already migrated" });
      const actualNotYetMigratedDoc = await OccupationModel.collection.findOne({ _id: givenNotYetMigratedId });
      expect(actualNotYetMigratedDoc?.preferredLabel).toEqual({ en: "mine surveyor" });
    });

    test("should rewrite an empty altLabels array as an empty array, and treat it as already migrated on the next run", async () => {
      // GIVEN an Occupation document with an empty altLabels array
      const givenId = await insertPreMigrationOccupation({ altLabels: [] });

      // WHEN the migration runs
      const actualFirstRunStats = await migration.up(dbConnection);

      // THEN expect altLabels to remain an empty array
      const actualDoc = await OccupationModel.collection.findOne({ _id: givenId });
      expect(actualDoc?.altLabels).toEqual([]);
      // AND expect the document to have been counted as matched (its other fields were still flat strings)
      expect(actualFirstRunStats).toEqual({ matched: 1, modified: 1 });

      // WHEN the migration runs again
      const actualSecondRunStats = await migration.up(dbConnection);

      // THEN expect the document to now be counted as already migrated, since an empty altLabels array must not be
      // mistaken for the old (flat array of strings) shape on every run
      expect(actualSecondRunStats).toEqual({ matched: 0, modified: 0 });
    });
  });

  describe("Test down()", () => {
    test("should flatten a localized preferredLabel/description/definition/scopeNote/regulatedProfessionNote and altLabels back to plain strings", async () => {
      // GIVEN an Occupation document that is already migrated
      const givenId = await insertPreMigrationOccupation();
      await migration.up(dbConnection);

      // WHEN the migration is reverted
      const actualStats = await migration.down(dbConnection);

      // THEN expect one document to have been matched and modified
      expect(actualStats).toEqual({ matched: 1, modified: 1 });
      // AND the document's translatable fields to be back to plain strings/arrays
      const actualDoc = await OccupationModel.collection.findOne({ _id: givenId });
      expect(actualDoc).toMatchObject({
        preferredLabel: "mine surveyor",
        description: "a description",
        definition: "a definition",
        scopeNote: "a scope note",
        regulatedProfessionNote: "a regulated profession note",
        altLabels: ["surveyor", "mine engineer"],
      });
    });

    test("should be idempotent, a second run is a no-op", async () => {
      // GIVEN an Occupation document that has already been reverted
      await insertPreMigrationOccupation();
      await migration.up(dbConnection);
      await migration.down(dbConnection);

      // WHEN the migration is reverted again
      const actualStats = await migration.down(dbConnection);

      // THEN expect no document to have been matched
      expect(actualStats).toEqual({ matched: 0, modified: 0 });
    });
  });

  test("should restore the documents to the shape they had, when it is applied and then reverted", async () => {
    // GIVEN an Occupation document that is still in the old, flat string shape
    const givenId = await insertPreMigrationOccupation();
    const givenDoc = await OccupationModel.collection.findOne({ _id: givenId });

    // WHEN the migration is applied and then reverted
    await migration.up(dbConnection);
    await migration.down(dbConnection);

    // THEN expect the document to be back to its original shape
    const actualDoc = await OccupationModel.collection.findOne({ _id: givenId });
    expect(actualDoc).toEqual(givenDoc);
  });

  describe("buildMigrationUpdate()", () => {
    test("should return null for a document whose translatable fields are already localized sub documents", () => {
      // GIVEN a document whose translatable fields are already localized sub documents
      const givenDoc = {
        preferredLabel: { en: "mine surveyor" },
        description: { en: "a description" },
        definition: { en: "a definition" },
        scopeNote: { en: "a scope note" },
        regulatedProfessionNote: { en: "a regulated profession note" },
        altLabels: [{ en: "surveyor" }],
      };

      // WHEN building the migration update for it
      const actualUpdate = buildMigrationUpdate(givenDoc);

      // THEN expect no update to be needed
      expect(actualUpdate).toBeNull();
    });

    test("should return an update only for the fields that are still flat strings, when a document is partially migrated", () => {
      // GIVEN a document whose preferredLabel is already migrated but whose description is still a flat string
      const givenDoc = {
        preferredLabel: { en: "mine surveyor" },
        description: "a description",
      };

      // WHEN building the migration update for it
      const actualUpdate = buildMigrationUpdate(givenDoc);

      // THEN expect the update to only contain the still-flat description
      expect(actualUpdate).toEqual({ description: { en: "a description" } });
    });
  });

  test("migrateOccupationsLocalizedFields() should match up() one-for-one", async () => {
    // GIVEN an Occupation document that is still in the old, flat string shape
    await insertPreMigrationOccupation();

    // WHEN the exported helper runs directly
    const actualStats = await migrateOccupationsLocalizedFields(dbConnection);

    // THEN expect the same result as running the migration's up()
    expect(actualStats).toEqual({ matched: 1, modified: 1 });
  });
});
