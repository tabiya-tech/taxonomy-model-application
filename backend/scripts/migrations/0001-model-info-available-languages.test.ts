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

/** The locale of a model that carries its data in English, i.e. one whose short code does not end with "es". */
const GIVEN_ENGLISH_LOCALE = { UUID: randomUUID(), name: "South Africa", shortCode: "ZA" };

/** The locale of a model that carries its data in Spanish, i.e. one whose short code ends with "es". */
const GIVEN_SPANISH_LOCALE = { UUID: randomUUID(), name: "Argentina", shortCode: "AR-es" };

/**
 * Returns a raw ModelInfo document, i.e. one that is inserted into the collection without passing through the schema,
 * exactly as a model that predates the availableLanguages field looks like in the database.
 */
function getRawModelInfoDoc(availableLanguages?: string[] | null, locale: unknown = GIVEN_ENGLISH_LOCALE) {
  return {
    UUID: randomUUID(),
    UUIDHistory: [randomUUID()],
    name: "a model",
    description: "a model that predates the available languages",
    locale,
    license: "a license",
    released: false,
    releaseNotes: "",
    version: "",
    ...(availableLanguages !== undefined ? { availableLanguages } : {}),
  };
}

describe("Test the 0001-model-info-available-languages migration with an in-memory mongodb", () => {
  const givenEnglishShortCode = LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.shortCode;
  const givenSpanishShortCode = "es";
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
    test("should set English on every model that does not declare any language and whose locale is not a Spanish one", async () => {
      // GIVEN three models with an English locale that do not declare any language, one without the field, one with
      // null and one with an empty list
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

      // AND expect every model to declare English
      const expectedAvailableLanguages = givenModelsWithoutLanguages.map(() => [givenEnglishShortCode]);
      expect(await getStoredAvailableLanguages()).toEqual(expectedAvailableLanguages);
    });

    test("should set Spanish on a model whose locale short code ends with 'es'", async () => {
      // GIVEN a model that does not declare any language and whose locale short code ends with "es"
      await modelInfoCollection.insertOne(getRawModelInfoDoc(undefined, GIVEN_SPANISH_LOCALE));

      // WHEN the migration is applied
      const actualResult = await migration.up(dbConnection);

      // THEN expect the model to have been matched and modified
      const expectedResult = { matched: 1, modified: 1 };
      expect(actualResult).toEqual(expectedResult);

      // AND expect the model to declare Spanish
      expect(await getStoredAvailableLanguages()).toEqual([[givenSpanishShortCode]]);
    });

    test("should set Spanish on a model whose locale short code ends with 'es' in any case", async () => {
      // GIVEN a model whose locale short code ends with "ES", the same locale written in upper case
      const givenUpperCaseSpanishLocale = { ...GIVEN_SPANISH_LOCALE, shortCode: "AR-ES" };
      await modelInfoCollection.insertOne(getRawModelInfoDoc(undefined, givenUpperCaseSpanishLocale));

      // WHEN the migration is applied
      await migration.up(dbConnection);

      // THEN expect the model to declare Spanish, the case of the locale does not decide the language
      expect(await getStoredAvailableLanguages()).toEqual([[givenSpanishShortCode]]);
    });

    test("should give every model the language of its own locale, when the models have different locales", async () => {
      // GIVEN a model with a Spanish locale and a model with an English locale, neither declaring any language
      const givenModelsWithDifferentLocales = [
        getRawModelInfoDoc(undefined, GIVEN_SPANISH_LOCALE),
        getRawModelInfoDoc(undefined, GIVEN_ENGLISH_LOCALE),
      ];
      await modelInfoCollection.insertMany(givenModelsWithDifferentLocales);

      // WHEN the migration is applied
      const actualResult = await migration.up(dbConnection);

      // THEN expect both models to have been matched and modified
      const expectedResult = {
        matched: givenModelsWithDifferentLocales.length,
        modified: givenModelsWithDifferentLocales.length,
      };
      expect(actualResult).toEqual(expectedResult);

      // AND expect each model to declare the language of its own locale
      expect(await getStoredAvailableLanguages()).toEqual([[givenSpanishShortCode], [givenEnglishShortCode]]);
    });

    test("should set English on a model that carries no locale at all", async () => {
      // GIVEN a model that declares no language and carries no locale, the shape of a model that was written by hand
      const givenModelWithoutLocale: Record<string, unknown> = getRawModelInfoDoc();
      delete givenModelWithoutLocale.locale;
      await modelInfoCollection.insertOne(givenModelWithoutLocale);

      // WHEN the migration is applied
      await migration.up(dbConnection);

      // THEN expect the model to declare English, the language of every model that is not a Spanish one
      expect(await getStoredAvailableLanguages()).toEqual([[givenEnglishShortCode]]);
    });

    test("should leave the languages of a model that declares them untouched", async () => {
      // GIVEN a model that already declares the languages it carries data in
      const givenDeclaredLanguages = [givenEnglishShortCode, "fr"];
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
      expect(await getStoredAvailableLanguages()).toEqual([[givenEnglishShortCode]]);
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
        getRawModelInfoDoc([givenEnglishShortCode]),
        getRawModelInfoDoc([givenEnglishShortCode, "fr"]),
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
      await modelInfoCollection.insertOne(getRawModelInfoDoc([givenEnglishShortCode]));
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
