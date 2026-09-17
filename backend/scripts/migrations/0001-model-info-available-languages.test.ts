// mute the console output
import "_test_utilities/consoleMock";

import { Collection, Connection } from "mongoose";
import { randomUUID } from "crypto";
import { getNewConnection } from "server/connection/newConnection";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { setConfiguration } from "server/config/config";
import { initializeSchemaAndModel } from "modelInfo/modelInfoModel";
import LanguageAPISpecs from "api-specifications/language";
import migration from "./0001-model-info-available-languages";

/**
 * Returns a raw ModelInfo document, i.e. one that is inserted into the collection without passing through the schema,
 * exactly as a model that predates the availableLanguages field looks like in the database.
 */
function getRawModelInfoDoc(availableLanguages?: string[] | null) {
  return {
    UUID: randomUUID(),
    UUIDHistory: [randomUUID()],
    name: "a model",
    description: "a model that predates the available languages",
    locale: { UUID: randomUUID(), name: "South Africa", shortCode: "ZA" },
    license: "a license",
    released: false,
    releaseNotes: "",
    version: "",
    ...(availableLanguages !== undefined ? { availableLanguages } : {}),
  };
}

describe("Test the 0001-model-info-available-languages migration with an in-memory mongodb", () => {
  const givenFallbackShortCode = LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.shortCode;
  let dbConnection: Connection;
  let modelInfoCollection: Collection;

  beforeAll(async () => {
    // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const givenConfig = getTestConfiguration("ModelInfoAvailableLanguagesMigrationTestDB");
    setConfiguration(givenConfig);
    dbConnection = await getNewConnection(givenConfig.dbURI);
    // the collection is taken from the model so that the test and the migration agree on its name
    modelInfoCollection = initializeSchemaAndModel(dbConnection).collection;
  });

  afterAll(async () => {
    if (dbConnection) {
      await dbConnection.dropDatabase();
      await dbConnection.close(false); // do not force close as there might be pending mongo operations
    }
  });

  afterEach(async () => {
    await modelInfoCollection.deleteMany({});
  });

  /** Reads the availableLanguages of every model, in insertion order, as they are stored in the database. */
  async function getStoredAvailableLanguages(): Promise<(string[] | undefined)[]> {
    const storedModels = await modelInfoCollection.find({}).sort({ _id: 1 }).toArray();
    return storedModels.map((storedModel) => storedModel.availableLanguages);
  }

  describe("Test up()", () => {
    test("should set the fall back language on every model that does not declare any language", async () => {
      // GIVEN three models that do not declare any language, one without the field, one with null and one with an
      // empty list
      const givenModelsWithoutLanguages = [getRawModelInfoDoc(), getRawModelInfoDoc(null), getRawModelInfoDoc([])];
      await modelInfoCollection.insertMany(givenModelsWithoutLanguages);

      // WHEN the migration is applied
      const actualResult = await migration.up(dbConnection);

      // THEN expect every model to have been matched and modified
      const expectedResult = {
        matched: givenModelsWithoutLanguages.length,
        modified: givenModelsWithoutLanguages.length,
      };
      expect(actualResult).toEqual(expectedResult);

      // AND expect every model to declare the fall back language
      const expectedAvailableLanguages = givenModelsWithoutLanguages.map(() => [givenFallbackShortCode]);
      expect(await getStoredAvailableLanguages()).toEqual(expectedAvailableLanguages);
    });

    test("should leave the languages of a model that declares them untouched", async () => {
      // GIVEN a model that already declares the languages it carries data in
      const givenDeclaredLanguages = [givenFallbackShortCode, "fr"];
      await modelInfoCollection.insertOne(getRawModelInfoDoc(givenDeclaredLanguages));

      // WHEN the migration is applied
      const actualResult = await migration.up(dbConnection);

      // THEN expect no model to have been matched
      const expectedResult = { matched: 0, modified: 0 };
      expect(actualResult).toEqual(expectedResult);

      // AND expect the model to still declare the same languages
      expect(await getStoredAvailableLanguages()).toEqual([givenDeclaredLanguages]);
    });

    test("should be idempotent, a second run is a no-op", async () => {
      // GIVEN a model that does not declare any language, which the migration has already been applied to
      await modelInfoCollection.insertOne(getRawModelInfoDoc());
      await migration.up(dbConnection);

      // WHEN the migration is applied a second time
      const actualResult = await migration.up(dbConnection);

      // THEN expect no model to have been matched
      const expectedResult = { matched: 0, modified: 0 };
      expect(actualResult).toEqual(expectedResult);

      // AND expect the model to still declare the fall back language
      expect(await getStoredAvailableLanguages()).toEqual([[givenFallbackShortCode]]);
    });

    test("should do nothing when there is no model at all", async () => {
      // GIVEN an empty collection of models
      // WHEN the migration is applied
      const actualResult = await migration.up(dbConnection);

      // THEN expect no model to have been matched
      const expectedResult = { matched: 0, modified: 0 };
      expect(actualResult).toEqual(expectedResult);
    });
  });

  describe("Test down()", () => {
    test("should remove the languages from every model that declares them", async () => {
      // GIVEN two models that declare the languages they carry data in, one of them more than one
      const givenModelsWithLanguages = [
        getRawModelInfoDoc([givenFallbackShortCode]),
        getRawModelInfoDoc([givenFallbackShortCode, "fr"]),
      ];
      await modelInfoCollection.insertMany(givenModelsWithLanguages);

      // WHEN the migration is reverted
      const actualResult = await migration.down(dbConnection);

      // THEN expect every model to have been matched and modified
      const expectedResult = { matched: givenModelsWithLanguages.length, modified: givenModelsWithLanguages.length };
      expect(actualResult).toEqual(expectedResult);

      // AND expect no model to declare any language
      const expectedAvailableLanguages = givenModelsWithLanguages.map(() => undefined);
      expect(await getStoredAvailableLanguages()).toEqual(expectedAvailableLanguages);
    });

    test("should be idempotent, a second run is a no-op", async () => {
      // GIVEN a model the migration has already been reverted for
      await modelInfoCollection.insertOne(getRawModelInfoDoc([givenFallbackShortCode]));
      await migration.down(dbConnection);

      // WHEN the migration is reverted a second time
      const actualResult = await migration.down(dbConnection);

      // THEN expect no model to have been matched
      const expectedResult = { matched: 0, modified: 0 };
      expect(actualResult).toEqual(expectedResult);

      // AND expect the model to still not declare any language
      expect(await getStoredAvailableLanguages()).toEqual([undefined]);
    });
  });

  test("should restore the models to the shape they had, when it is applied and then reverted", async () => {
    // GIVEN a model that predates the available languages
    const givenModel = getRawModelInfoDoc();
    await modelInfoCollection.insertOne(givenModel);

    // WHEN the migration is applied and then reverted
    await migration.up(dbConnection);
    await migration.down(dbConnection);

    // THEN expect the model to not declare any language, as before the migration
    expect(await getStoredAvailableLanguages()).toEqual([undefined]);
  });
});
