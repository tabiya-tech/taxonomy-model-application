// mute the console output
import "_test_utilities/consoleMock";

import { Collection, Connection } from "mongoose";
import { randomUUID } from "crypto";
import { getNewConnection } from "server/connection/newConnection";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { setConfiguration } from "server/config/config";
import { initializeSchemaAndModel } from "esco/occupationGroup/model/OccupationGroup.model";
import { ObjectTypes } from "esco/common/objectTypes";
import { getMockObjectId } from "_test_utilities/mockMongoId";
import { getFallbackLanguageConfig } from "common/language/fallbackLanguage";
import migration from "./0003-occupation-groups-localized-fields";

/**
 * The translatable fields of an occupation group, in the shape they are given to the collection.
 * They are inserted without passing through the schema, so that the flat shape, which the schema no longer accepts,
 * can be written exactly as an occupation group that predates the localized fields looks like in the database.
 */
type GivenTranslatableFields = {
  preferredLabel: unknown;
  description: unknown;
  altLabels: unknown[];
};

/** Returns a raw OccupationGroup document carrying the given translatable fields as they are. */
function getRawOccupationGroupDoc(translatableFields: GivenTranslatableFields) {
  return {
    UUID: randomUUID(),
    UUIDHistory: [randomUUID()],
    modelId: getMockObjectId(1),
    code: "1234",
    groupType: ObjectTypes.ISCOGroup,
    originUri: "https://foo.bar/",
    importId: "",
    ...translatableFields,
  };
}

describe("Test the 0003-occupation-groups-localized-fields migration with an in-memory mongodb", () => {
  const givenFallbackDbKeyName = getFallbackLanguageConfig().dbKeyName;
  let dbConnection: Connection;
  let occupationGroupCollection: Collection;

  beforeAll(async () => {
    // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const givenConfig = getTestConfiguration("OccupationGroupsLocalizedFieldsMigrationTestDB");
    setConfiguration(givenConfig);
    dbConnection = await getNewConnection(givenConfig.dbURI);
    // the collection is taken from the model so that the test and the migration agree on its name
    occupationGroupCollection = initializeSchemaAndModel(dbConnection).collection;
  });

  afterAll(async () => {
    if (dbConnection) {
      await dbConnection.dropDatabase();
      await dbConnection.close(false); // do not force close as there might be pending mongo operations
    }
  });

  afterEach(async () => {
    await occupationGroupCollection.deleteMany({});
  });

  /** Reads the translatable fields of every occupation group, in insertion order, as they are stored. */
  async function getStoredTranslatableFields(): Promise<GivenTranslatableFields[]> {
    const storedGroups = await occupationGroupCollection.find({}).sort({ _id: 1 }).toArray();
    return storedGroups.map((storedGroup) => ({
      preferredLabel: storedGroup.preferredLabel,
      description: storedGroup.description,
      altLabels: storedGroup.altLabels,
    }));
  }

  /** Reads the fields that the migration must never touch, in insertion order. */
  async function getStoredMonolingualFields(): Promise<{ code: string; groupType: string }[]> {
    const storedGroups = await occupationGroupCollection.find({}).sort({ _id: 1 }).toArray();
    return storedGroups.map((storedGroup) => ({ code: storedGroup.code, groupType: storedGroup.groupType }));
  }

  const givenFlatFields: GivenTranslatableFields = {
    preferredLabel: "Managers",
    description: "A description of the group",
    altLabels: ["Chiefs", "Leaders"],
  };

  const expectedLocalizedFields: GivenTranslatableFields = {
    preferredLabel: { [givenFallbackDbKeyName]: "Managers" },
    description: { [givenFallbackDbKeyName]: "A description of the group" },
    altLabels: [{ [givenFallbackDbKeyName]: "Chiefs" }, { [givenFallbackDbKeyName]: "Leaders" }],
  };

  describe("Test up()", () => {
    test("should rewrite the translatable fields of every occupation group that carries them as flat values", async () => {
      // GIVEN two occupation groups whose translatable fields are flat values
      const givenGroupsWithFlatFields = [
        getRawOccupationGroupDoc(givenFlatFields),
        getRawOccupationGroupDoc(givenFlatFields),
      ];
      await occupationGroupCollection.insertMany(givenGroupsWithFlatFields);

      // WHEN the migration is applied
      const actualResult = await migration.up(dbConnection);

      // THEN expect every occupation group to have been matched and modified
      const expectedResult = { matched: givenGroupsWithFlatFields.length, modified: givenGroupsWithFlatFields.length };
      expect(actualResult).toEqual(expectedResult);

      // AND expect every translatable field to be a localized sub document keyed by the fall back language
      const expectedStoredFields = givenGroupsWithFlatFields.map(() => expectedLocalizedFields);
      expect(await getStoredTranslatableFields()).toEqual(expectedStoredFields);
    });

    test("should rewrite an empty flat value into an empty value for the fall back language", async () => {
      // GIVEN an occupation group whose description is an empty string, which the flat schema allowed
      const givenGroupWithEmptyDescription = getRawOccupationGroupDoc({
        preferredLabel: "Managers",
        description: "",
        altLabels: [],
      });
      await occupationGroupCollection.insertOne(givenGroupWithEmptyDescription);

      // WHEN the migration is applied
      await migration.up(dbConnection);

      // THEN expect the empty description to be translated to an empty value rather than dropped
      const expectedStoredFields: GivenTranslatableFields = {
        preferredLabel: { [givenFallbackDbKeyName]: "Managers" },
        description: { [givenFallbackDbKeyName]: "" },
        altLabels: [],
      };
      expect(await getStoredTranslatableFields()).toEqual([expectedStoredFields]);
    });

    test("should leave an occupation group whose fields are already localized untouched", async () => {
      // GIVEN an occupation group whose translatable fields are already localized sub documents
      await occupationGroupCollection.insertOne(getRawOccupationGroupDoc(expectedLocalizedFields));

      // WHEN the migration is applied
      const actualResult = await migration.up(dbConnection);

      // THEN expect no occupation group to have been matched
      const expectedResult = { matched: 0, modified: 0 };
      expect(actualResult).toEqual(expectedResult);

      // AND expect its translatable fields to be unchanged
      expect(await getStoredTranslatableFields()).toEqual([expectedLocalizedFields]);
    });

    test("should rewrite only the flat fields of a half migrated occupation group, which is how an interrupted run resumes", async () => {
      // GIVEN an occupation group whose preferredLabel was already rewritten but whose other fields were not, the
      // state an interrupted run leaves behind
      const givenHalfMigratedGroup = getRawOccupationGroupDoc({
        preferredLabel: { [givenFallbackDbKeyName]: "Managers" },
        description: "A description of the group",
        altLabels: ["Chiefs", { [givenFallbackDbKeyName]: "Leaders" }],
      });
      await occupationGroupCollection.insertOne(givenHalfMigratedGroup);

      // WHEN the migration is applied
      const actualResult = await migration.up(dbConnection);

      // THEN expect the occupation group to have been matched and modified
      const expectedResult = { matched: 1, modified: 1 };
      expect(actualResult).toEqual(expectedResult);

      // AND expect every translatable field to be localized, the already localized ones unchanged
      expect(await getStoredTranslatableFields()).toEqual([expectedLocalizedFields]);
    });

    test("should be idempotent, a second run is a no-op", async () => {
      // GIVEN an occupation group the migration has already been applied to
      await occupationGroupCollection.insertOne(getRawOccupationGroupDoc(givenFlatFields));
      await migration.up(dbConnection);

      // WHEN the migration is applied a second time
      const actualResult = await migration.up(dbConnection);

      // THEN expect no occupation group to have been matched
      const expectedResult = { matched: 0, modified: 0 };
      expect(actualResult).toEqual(expectedResult);

      // AND expect its translatable fields to still be localized
      expect(await getStoredTranslatableFields()).toEqual([expectedLocalizedFields]);
    });

    test("should leave code and groupType untouched", async () => {
      // GIVEN an occupation group whose translatable fields are flat values
      const givenGroup = getRawOccupationGroupDoc(givenFlatFields);
      await occupationGroupCollection.insertOne(givenGroup);

      // WHEN the migration is applied
      await migration.up(dbConnection);

      // THEN expect the monolingual fields to be exactly as they were
      const expectedMonolingualFields = { code: givenGroup.code, groupType: givenGroup.groupType };
      expect(await getStoredMonolingualFields()).toEqual([expectedMonolingualFields]);
    });

    test("should do nothing when there is no occupation group at all", async () => {
      // GIVEN an empty collection of occupation groups
      // WHEN the migration is applied
      const actualResult = await migration.up(dbConnection);

      // THEN expect no occupation group to have been matched
      const expectedResult = { matched: 0, modified: 0 };
      expect(actualResult).toEqual(expectedResult);
    });
  });

  describe("Test down()", () => {
    test("should flatten the translatable fields of every occupation group that carries them as localized sub documents", async () => {
      // GIVEN two occupation groups whose translatable fields are localized sub documents
      const givenGroupsWithLocalizedFields = [
        getRawOccupationGroupDoc(expectedLocalizedFields),
        getRawOccupationGroupDoc(expectedLocalizedFields),
      ];
      await occupationGroupCollection.insertMany(givenGroupsWithLocalizedFields);

      // WHEN the migration is reverted
      const actualResult = await migration.down(dbConnection);

      // THEN expect every occupation group to have been matched and modified
      const expectedResult = {
        matched: givenGroupsWithLocalizedFields.length,
        modified: givenGroupsWithLocalizedFields.length,
      };
      expect(actualResult).toEqual(expectedResult);

      // AND expect every translatable field to be the flat value of the fall back language
      const expectedStoredFields = givenGroupsWithLocalizedFields.map(() => givenFlatFields);
      expect(await getStoredTranslatableFields()).toEqual(expectedStoredFields);
    });

    test("should keep only the fall back language of a field that is translated into several languages", async () => {
      // GIVEN an occupation group whose preferredLabel is translated into the fall back language and into French
      const givenGroupWithSeveralLanguages = getRawOccupationGroupDoc({
        preferredLabel: { [givenFallbackDbKeyName]: "Managers", fr: "Cadres" },
        description: { [givenFallbackDbKeyName]: "A description of the group" },
        altLabels: [{ [givenFallbackDbKeyName]: "Chiefs", fr: "Chefs" }],
      });
      await occupationGroupCollection.insertOne(givenGroupWithSeveralLanguages);

      // WHEN the migration is reverted
      await migration.down(dbConnection);

      // THEN expect only the fall back language to have survived, the flat shape carries a single language
      const expectedStoredFields: GivenTranslatableFields = {
        preferredLabel: "Managers",
        description: "A description of the group",
        altLabels: ["Chiefs"],
      };
      expect(await getStoredTranslatableFields()).toEqual([expectedStoredFields]);
    });

    test("should flatten a field that is not translated in the fall back language to an empty string", async () => {
      // GIVEN an occupation group whose description is translated into French only
      const givenGroupWithoutFallback = getRawOccupationGroupDoc({
        preferredLabel: { [givenFallbackDbKeyName]: "Managers" },
        description: { fr: "Une description" },
        altLabels: [{ fr: "Chefs" }],
      });
      await occupationGroupCollection.insertOne(givenGroupWithoutFallback);

      // WHEN the migration is reverted
      await migration.down(dbConnection);

      // THEN expect the untranslated values to become empty strings, the closest the flat shape gets
      const expectedStoredFields: GivenTranslatableFields = {
        preferredLabel: "Managers",
        description: "",
        altLabels: [""],
      };
      expect(await getStoredTranslatableFields()).toEqual([expectedStoredFields]);
    });

    test("should be idempotent, a second run is a no-op", async () => {
      // GIVEN an occupation group the migration has already been reverted for
      await occupationGroupCollection.insertOne(getRawOccupationGroupDoc(expectedLocalizedFields));
      await migration.down(dbConnection);

      // WHEN the migration is reverted a second time
      const actualResult = await migration.down(dbConnection);

      // THEN expect no occupation group to have been matched
      const expectedResult = { matched: 0, modified: 0 };
      expect(actualResult).toEqual(expectedResult);

      // AND expect its translatable fields to still be flat values
      expect(await getStoredTranslatableFields()).toEqual([givenFlatFields]);
    });
  });

  test("should restore the occupation groups to the shape they had, when it is applied and then reverted", async () => {
    // GIVEN an occupation group that predates the localized fields
    await occupationGroupCollection.insertOne(getRawOccupationGroupDoc(givenFlatFields));

    // WHEN the migration is applied and then reverted
    await migration.up(dbConnection);
    await migration.down(dbConnection);

    // THEN expect its translatable fields to be the flat values they were before the migration
    expect(await getStoredTranslatableFields()).toEqual([givenFlatFields]);
  });
});
