// mute the console output
import "_test_utilities/consoleMock";

import { Collection, Connection, Types } from "mongoose";
import { randomUUID } from "crypto";
import { getNewConnection } from "server/connection/newConnection";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { setConfiguration } from "server/config/config";
import { initializeSchemaAndModel } from "esco/skillGroup/model/SkillGroup.model";
import { initializeSchemaAndModel as initializeModelInfoSchemaAndModel } from "modelInfo/modelInfoModel";
import { getMockObjectId } from "_test_utilities/mockMongoId";
import { getFallbackLanguageConfig } from "common/language/fallbackLanguage";
import migration from "./0005-skill-groups-localized-fields";

/**
 * The translatable fields of a skill group, in the shape they are given to the collection.
 * They are inserted without passing through the schema, so that the flat shape, which the schema no longer accepts,
 * can be written exactly as a skill group that predates the localized fields looks like in the database.
 */
type GivenTranslatableFields = {
  preferredLabel: unknown;
  description: unknown;
  scopeNote: unknown;
  altLabels: unknown[];
};

/**
 * The id of the model that the skill groups of a test belong to, unless the test gives them another one.
 * It is the model that is inserted before each test, declaring the fall back language.
 */
let givenDefaultModelId: Types.ObjectId;

/** Returns a raw SkillGroup document carrying the given translatable fields as they are. */
function getRawSkillGroupDoc(
  translatableFields: GivenTranslatableFields,
  modelId: Types.ObjectId = givenDefaultModelId
) {
  return {
    UUID: randomUUID(),
    UUIDHistory: [randomUUID()],
    modelId,
    code: "S1.3.5",
    originUri: "https://foo.bar/",
    importId: "",
    ...translatableFields,
  };
}

/**
 * Returns a raw ModelInfo document declaring the given languages. Only the languages matter to the migration, the
 * rest of the fields are what a model carries, so that the document is a realistic one.
 */
function getRawModelInfoDoc(availableLanguages?: string[]) {
  return {
    UUID: randomUUID(),
    UUIDHistory: [randomUUID()],
    name: "a model",
    description: "a model the skill groups belong to",
    locale: { UUID: randomUUID(), name: "South Africa", shortCode: "ZA" },
    license: "a license",
    released: false,
    releaseNotes: "",
    version: "",
    ...(availableLanguages !== undefined ? { availableLanguages } : {}),
  };
}

describe("Test the 0005-skill-groups-localized-fields migration with an in-memory mongodb", () => {
  const givenFallbackDbKeyName = getFallbackLanguageConfig().dbKeyName;
  const givenFallbackShortCode = getFallbackLanguageConfig().shortCode;
  let dbConnection: Connection;
  let skillGroupCollection: Collection;
  let modelInfoCollection: Collection;

  beforeAll(async () => {
    // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const givenConfig = getTestConfiguration("SkillGroupsLocalizedFieldsMigrationTestDB");
    setConfiguration(givenConfig);
    dbConnection = await getNewConnection(givenConfig.dbURI);
    // the collections are taken from the models so that the test and the migration agree on their names
    skillGroupCollection = initializeSchemaAndModel(dbConnection).collection;
    modelInfoCollection = initializeModelInfoSchemaAndModel(dbConnection).collection;
  });

  /** Inserts a model declaring the given languages and returns its id. */
  async function insertModel(availableLanguages?: string[]): Promise<Types.ObjectId> {
    const insertResult = await modelInfoCollection.insertOne(getRawModelInfoDoc(availableLanguages));
    return insertResult.insertedId;
  }

  beforeEach(async () => {
    // every skill group belongs to a model, and the language of the model is what its values are keyed by
    givenDefaultModelId = await insertModel([givenFallbackShortCode]);
  });

  afterAll(async () => {
    if (dbConnection) {
      await dbConnection.dropDatabase();
      await dbConnection.close(false); // do not force close as there might be pending mongo operations
    }
  });

  afterEach(async () => {
    await skillGroupCollection.deleteMany({});
    await modelInfoCollection.deleteMany({});
  });

  /** Reads the translatable fields of every skill group, in insertion order, as they are stored. */
  async function getStoredTranslatableFields(): Promise<GivenTranslatableFields[]> {
    const storedGroups = await skillGroupCollection.find({}).sort({ _id: 1 }).toArray();
    return storedGroups.map((storedGroup) => ({
      preferredLabel: storedGroup.preferredLabel,
      description: storedGroup.description,
      scopeNote: storedGroup.scopeNote,
      altLabels: storedGroup.altLabels,
    }));
  }

  /** Reads the field that the migration must never touch, in insertion order. */
  async function getStoredMonolingualFields(): Promise<{ code: string }[]> {
    const storedGroups = await skillGroupCollection.find({}).sort({ _id: 1 }).toArray();
    return storedGroups.map((storedGroup) => ({ code: storedGroup.code }));
  }

  const givenFlatFields: GivenTranslatableFields = {
    preferredLabel: "Management",
    description: "A description of the group",
    scopeNote: "A scope note of the group",
    altLabels: ["Managing", "Leading"],
  };

  const expectedLocalizedFields: GivenTranslatableFields = {
    preferredLabel: { [givenFallbackDbKeyName]: "Management" },
    description: { [givenFallbackDbKeyName]: "A description of the group" },
    scopeNote: { [givenFallbackDbKeyName]: "A scope note of the group" },
    altLabels: [{ [givenFallbackDbKeyName]: "Managing" }, { [givenFallbackDbKeyName]: "Leading" }],
  };

  describe("Test up()", () => {
    test("should rewrite the translatable fields of every skill group that carries them as flat values", async () => {
      // GIVEN two skill groups whose translatable fields are flat values
      const givenGroupsWithFlatFields = [getRawSkillGroupDoc(givenFlatFields), getRawSkillGroupDoc(givenFlatFields)];
      await skillGroupCollection.insertMany(givenGroupsWithFlatFields);

      // WHEN the migration is applied
      const actualResult = await migration.up(dbConnection);

      // THEN expect every skill group to have been matched and modified
      const expectedResult = { matched: givenGroupsWithFlatFields.length, modified: givenGroupsWithFlatFields.length };
      expect(actualResult).toEqual(expectedResult);

      // AND expect every translatable field to be a localized sub document keyed by the fall back language
      const expectedStoredFields = givenGroupsWithFlatFields.map(() => expectedLocalizedFields);
      expect(await getStoredTranslatableFields()).toEqual(expectedStoredFields);
    });

    test("should rewrite an empty flat value into an empty value for the fall back language", async () => {
      // GIVEN a skill group whose description and scopeNote are empty strings, which the flat schema allowed
      const givenGroupWithEmptyValues = getRawSkillGroupDoc({
        preferredLabel: "Management",
        description: "",
        scopeNote: "",
        altLabels: [],
      });
      await skillGroupCollection.insertOne(givenGroupWithEmptyValues);

      // WHEN the migration is applied
      await migration.up(dbConnection);

      // THEN expect the empty values to be translated to empty values rather than dropped
      const expectedStoredFields: GivenTranslatableFields = {
        preferredLabel: { [givenFallbackDbKeyName]: "Management" },
        description: { [givenFallbackDbKeyName]: "" },
        scopeNote: { [givenFallbackDbKeyName]: "" },
        altLabels: [],
      };
      expect(await getStoredTranslatableFields()).toEqual([expectedStoredFields]);
    });

    test("should leave a skill group whose fields are already localized untouched", async () => {
      // GIVEN a skill group whose translatable fields are already localized sub documents
      await skillGroupCollection.insertOne(getRawSkillGroupDoc(expectedLocalizedFields));

      // WHEN the migration is applied
      const actualResult = await migration.up(dbConnection);

      // THEN expect no skill group to have been matched
      const expectedResult = { matched: 0, modified: 0 };
      expect(actualResult).toEqual(expectedResult);

      // AND expect its translatable fields to be unchanged
      expect(await getStoredTranslatableFields()).toEqual([expectedLocalizedFields]);
    });

    test("should rewrite only the flat fields of a half migrated skill group, which is how an interrupted run resumes", async () => {
      // GIVEN a skill group whose preferredLabel was already rewritten but whose other fields were not, the state an
      // interrupted run leaves behind
      const givenHalfMigratedGroup = getRawSkillGroupDoc({
        preferredLabel: { [givenFallbackDbKeyName]: "Management" },
        description: "A description of the group",
        scopeNote: "A scope note of the group",
        altLabels: ["Managing", { [givenFallbackDbKeyName]: "Leading" }],
      });
      await skillGroupCollection.insertOne(givenHalfMigratedGroup);

      // WHEN the migration is applied
      const actualResult = await migration.up(dbConnection);

      // THEN expect the skill group to have been matched and modified
      const expectedResult = { matched: 1, modified: 1 };
      expect(actualResult).toEqual(expectedResult);

      // AND expect every translatable field to be localized, the already localized ones unchanged
      expect(await getStoredTranslatableFields()).toEqual([expectedLocalizedFields]);
    });

    test("should be idempotent, a second run is a no-op", async () => {
      // GIVEN a skill group the migration has already been applied to
      await skillGroupCollection.insertOne(getRawSkillGroupDoc(givenFlatFields));
      await migration.up(dbConnection);

      // WHEN the migration is applied a second time
      const actualResult = await migration.up(dbConnection);

      // THEN expect no skill group to have been matched
      const expectedResult = { matched: 0, modified: 0 };
      expect(actualResult).toEqual(expectedResult);

      // AND expect its translatable fields to still be localized
      expect(await getStoredTranslatableFields()).toEqual([expectedLocalizedFields]);
    });

    test("should leave code untouched", async () => {
      // GIVEN a skill group whose translatable fields are flat values
      const givenGroup = getRawSkillGroupDoc(givenFlatFields);
      await skillGroupCollection.insertOne(givenGroup);

      // WHEN the migration is applied
      await migration.up(dbConnection);

      // THEN expect the monolingual field to be exactly as it was
      const expectedMonolingualFields = { code: givenGroup.code };
      expect(await getStoredMonolingualFields()).toEqual([expectedMonolingualFields]);
    });

    test("should not add a definition nor a regulatedProfessionNote, they are not fields of a skill group", async () => {
      // GIVEN a skill group whose translatable fields are flat values
      await skillGroupCollection.insertOne(getRawSkillGroupDoc(givenFlatFields));

      // WHEN the migration is applied
      await migration.up(dbConnection);

      // THEN expect the stored skill group to carry neither of the two fields
      const actualStoredGroup = await skillGroupCollection.findOne({});
      expect(actualStoredGroup).not.toHaveProperty("definition");
      expect(actualStoredGroup).not.toHaveProperty("regulatedProfessionNote");
    });

    test("should key the values of the skill groups of a model by the first language the model declares", async () => {
      // GIVEN a model that declares Spanish first, and a skill group of that model with flat fields
      const givenSpanishShortCode = "es";
      const givenSpanishModelId = await insertModel([givenSpanishShortCode, givenFallbackShortCode]);
      await skillGroupCollection.insertOne(getRawSkillGroupDoc(givenFlatFields, givenSpanishModelId));

      // WHEN the migration is applied
      const actualResult = await migration.up(dbConnection);

      // THEN expect the skill group to have been matched and modified
      const expectedResult = { matched: 1, modified: 1 };
      expect(actualResult).toEqual(expectedResult);

      // AND expect its translatable fields to be keyed by the first language of its model, not by the fall back one
      const expectedStoredFields: GivenTranslatableFields = {
        preferredLabel: { [givenSpanishShortCode]: "Management" },
        description: { [givenSpanishShortCode]: "A description of the group" },
        scopeNote: { [givenSpanishShortCode]: "A scope note of the group" },
        altLabels: [{ [givenSpanishShortCode]: "Managing" }, { [givenSpanishShortCode]: "Leading" }],
      };
      expect(await getStoredTranslatableFields()).toEqual([expectedStoredFields]);
    });

    test("should key the values of every skill group by the language of its own model, when the models declare different languages", async () => {
      // GIVEN a skill group of a model that declares Spanish and one of the model that declares the fall back language
      const givenSpanishShortCode = "es";
      const givenSpanishModelId = await insertModel([givenSpanishShortCode]);
      await skillGroupCollection.insertMany([
        getRawSkillGroupDoc(givenFlatFields, givenSpanishModelId),
        getRawSkillGroupDoc(givenFlatFields),
      ]);

      // WHEN the migration is applied
      const actualResult = await migration.up(dbConnection);

      // THEN expect both skill groups to have been matched and modified
      const expectedResult = { matched: 2, modified: 2 };
      expect(actualResult).toEqual(expectedResult);

      // AND expect each of them to be keyed by the language of its own model
      const expectedSpanishFields: GivenTranslatableFields = {
        preferredLabel: { [givenSpanishShortCode]: "Management" },
        description: { [givenSpanishShortCode]: "A description of the group" },
        scopeNote: { [givenSpanishShortCode]: "A scope note of the group" },
        altLabels: [{ [givenSpanishShortCode]: "Managing" }, { [givenSpanishShortCode]: "Leading" }],
      };
      expect(await getStoredTranslatableFields()).toEqual([expectedSpanishFields, expectedLocalizedFields]);
    });

    test("should key the values by the fall back language, when the model declares no language the registry knows about", async () => {
      // GIVEN a skill group of a model that declares no language at all, and one of a model that declares a language
      // that the registry does not know about
      const givenModelWithoutLanguagesId = await insertModel();
      const givenModelWithAnUnknownLanguageId = await insertModel(["not-a-language"]);
      await skillGroupCollection.insertMany([
        getRawSkillGroupDoc(givenFlatFields, givenModelWithoutLanguagesId),
        getRawSkillGroupDoc(givenFlatFields, givenModelWithAnUnknownLanguageId),
      ]);

      // WHEN the migration is applied
      const actualResult = await migration.up(dbConnection);

      // THEN expect both skill groups to have been matched and modified
      const expectedResult = { matched: 2, modified: 2 };
      expect(actualResult).toEqual(expectedResult);

      // AND expect both of them to be keyed by the fall back language
      expect(await getStoredTranslatableFields()).toEqual([expectedLocalizedFields, expectedLocalizedFields]);
    });

    test("should leave a skill group whose model does not exist untouched, and report it", async () => {
      // GIVEN a skill group that belongs to a model that is not in the collection of the models
      const givenModelIdThatDoesNotExist = getMockObjectId(999);
      await skillGroupCollection.insertOne(getRawSkillGroupDoc(givenFlatFields, givenModelIdThatDoesNotExist));

      // WHEN the migration is applied
      const actualResult = await migration.up(dbConnection);

      // THEN expect no skill group to have been matched, there is no language to key its values by
      const expectedResult = { matched: 0, modified: 0 };
      expect(actualResult).toEqual(expectedResult);

      // AND expect its translatable fields to still be flat values
      expect(await getStoredTranslatableFields()).toEqual([givenFlatFields]);

      // AND expect the skill group that was left behind to have been reported
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("1 skill group(s) were left untouched"));
    });

    test("should do nothing when there is no skill group at all", async () => {
      // GIVEN an empty collection of skill groups
      // WHEN the migration is applied
      const actualResult = await migration.up(dbConnection);

      // THEN expect no skill group to have been matched
      const expectedResult = { matched: 0, modified: 0 };
      expect(actualResult).toEqual(expectedResult);
    });
  });

  describe("Test down()", () => {
    test("should flatten the translatable fields of every skill group that carries them as localized sub documents", async () => {
      // GIVEN two skill groups whose translatable fields are localized sub documents
      const givenGroupsWithLocalizedFields = [
        getRawSkillGroupDoc(expectedLocalizedFields),
        getRawSkillGroupDoc(expectedLocalizedFields),
      ];
      await skillGroupCollection.insertMany(givenGroupsWithLocalizedFields);

      // WHEN the migration is reverted
      const actualResult = await migration.down(dbConnection);

      // THEN expect every skill group to have been matched and modified
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
      // GIVEN a skill group whose preferredLabel is translated into the fall back language and into French
      const givenGroupWithSeveralLanguages = getRawSkillGroupDoc({
        preferredLabel: { [givenFallbackDbKeyName]: "Management", fr: "Gestion" },
        description: { [givenFallbackDbKeyName]: "A description of the group" },
        scopeNote: { [givenFallbackDbKeyName]: "A scope note of the group" },
        altLabels: [{ [givenFallbackDbKeyName]: "Managing", fr: "Gerer" }],
      });
      await skillGroupCollection.insertOne(givenGroupWithSeveralLanguages);

      // WHEN the migration is reverted
      await migration.down(dbConnection);

      // THEN expect only the fall back language to have survived, the flat shape carries a single language
      const expectedStoredFields: GivenTranslatableFields = {
        preferredLabel: "Management",
        description: "A description of the group",
        scopeNote: "A scope note of the group",
        altLabels: ["Managing"],
      };
      expect(await getStoredTranslatableFields()).toEqual([expectedStoredFields]);
    });

    test("should flatten a field that is not translated in the fall back language to an empty string", async () => {
      // GIVEN a skill group whose description is translated into French only
      const givenGroupWithoutFallback = getRawSkillGroupDoc({
        preferredLabel: { [givenFallbackDbKeyName]: "Management" },
        description: { fr: "Une description" },
        scopeNote: { fr: "Une note" },
        altLabels: [{ fr: "Gerer" }],
      });
      await skillGroupCollection.insertOne(givenGroupWithoutFallback);

      // WHEN the migration is reverted
      await migration.down(dbConnection);

      // THEN expect the untranslated values to become empty strings, the closest the flat shape gets
      const expectedStoredFields: GivenTranslatableFields = {
        preferredLabel: "Management",
        description: "",
        scopeNote: "",
        altLabels: [""],
      };
      expect(await getStoredTranslatableFields()).toEqual([expectedStoredFields]);
    });

    test("should flatten the values of the language of the model, not the ones of the fall back language", async () => {
      // GIVEN a skill group of a model that declares Spanish, translated into Spanish and into the fall back language
      const givenSpanishShortCode = "es";
      const givenSpanishModelId = await insertModel([givenSpanishShortCode]);
      await skillGroupCollection.insertOne(
        getRawSkillGroupDoc(
          {
            preferredLabel: { [givenSpanishShortCode]: "Gestion", [givenFallbackDbKeyName]: "Management" },
            description: { [givenSpanishShortCode]: "Una descripcion", [givenFallbackDbKeyName]: "A description" },
            scopeNote: { [givenSpanishShortCode]: "Una nota", [givenFallbackDbKeyName]: "A scope note" },
            altLabels: [{ [givenSpanishShortCode]: "Gestionar", [givenFallbackDbKeyName]: "Managing" }],
          },
          givenSpanishModelId
        )
      );

      // WHEN the migration is reverted
      await migration.down(dbConnection);

      // THEN expect the values of the language of the model to have survived
      const expectedStoredFields: GivenTranslatableFields = {
        preferredLabel: "Gestion",
        description: "Una descripcion",
        scopeNote: "Una nota",
        altLabels: ["Gestionar"],
      };
      expect(await getStoredTranslatableFields()).toEqual([expectedStoredFields]);
    });

    test("should be idempotent, a second run is a no-op", async () => {
      // GIVEN a skill group the migration has already been reverted for
      await skillGroupCollection.insertOne(getRawSkillGroupDoc(expectedLocalizedFields));
      await migration.down(dbConnection);

      // WHEN the migration is reverted a second time
      const actualResult = await migration.down(dbConnection);

      // THEN expect no skill group to have been matched
      const expectedResult = { matched: 0, modified: 0 };
      expect(actualResult).toEqual(expectedResult);

      // AND expect its translatable fields to still be flat values
      expect(await getStoredTranslatableFields()).toEqual([givenFlatFields]);
    });
  });

  test("should restore the skill groups to the shape they had, when it is applied and then reverted", async () => {
    // GIVEN a skill group that predates the localized fields
    await skillGroupCollection.insertOne(getRawSkillGroupDoc(givenFlatFields));

    // WHEN the migration is applied and then reverted
    await migration.up(dbConnection);
    await migration.down(dbConnection);

    // THEN expect its translatable fields to be the flat values they were before the migration
    expect(await getStoredTranslatableFields()).toEqual([givenFlatFields]);
  });
});
