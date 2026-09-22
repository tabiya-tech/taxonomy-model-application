// Suppress chatty console during the tests
import "_test_utilities/consoleMock";

import mongoose, { Connection } from "mongoose";
import { randomUUID } from "crypto";
import { getNewConnection } from "server/connection/newConnection";
import { initializeSchemaAndModel } from "../model/skill.model";
import {
  DEFINITION_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  IMPORT_ID_MAX_LENGTH,
  LABEL_MAX_LENGTH,
  SCOPE_NOTE_MAX_LENGTH,
} from "esco/common/modelSchema";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getMockObjectId } from "_test_utilities/mockMongoId";
import { generateRandomUrl, getRandomString, getTestString, WHITESPACE } from "_test_utilities/getMockRandomData";
import { assertCaseForProperty, CaseType } from "_test_utilities/dataModel";
import { ISkillDoc, ReuseLevel, SkillType } from "../_shared/skill.types";
import {
  testTranslatedAltLabelsField,
  testEmbeddingStatusField,
  testTranslatedStringField,
  testImportId,
  testObjectIdField,
  testOriginUri,
  testUUIDField,
  testUUIDHistoryField,
} from "esco/_test_utilities/modelSchemaTestFunctions";
import { getFallbackLanguageConfig } from "common/language/fallbackLanguage";

describe("Test the definition of the skill Model", () => {
  let dbConnection: Connection;
  let skillModel: mongoose.Model<ISkillDoc>;
  beforeAll(async () => {
    // Using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("SkillModelTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    // Initialize the schema and model
    skillModel = initializeSchemaAndModel(dbConnection);
  });

  afterAll(async () => {
    if (dbConnection) {
      await dbConnection.dropDatabase();
      await dbConnection.close();
    }
  });

  const fallbackDbKeyName = getFallbackLanguageConfig().dbKeyName;
  // Wraps a flat string into a translated sub document keyed by the fallback language, e.g. "Cook" -> { en: "Cook" }.
  // It is built as a Map, the shape a translated path is stored in and hydrated as.
  const wrapTranslated = (value: string) => new Map([[fallbackDbKeyName, value]]);

  test.each([
    [
      "mandatory fields",
      {
        UUID: randomUUID(),
        preferredLabel: getTestString(LABEL_MAX_LENGTH),
        modelId: getMockObjectId(2),
        UUIDHistory: [randomUUID()],
        originUri: generateRandomUrl(),
        altLabels: [getRandomString(LABEL_MAX_LENGTH), getRandomString(LABEL_MAX_LENGTH)],
        definition: getTestString(DEFINITION_MAX_LENGTH),
        description: getTestString(DESCRIPTION_MAX_LENGTH),
        scopeNote: getTestString(SCOPE_NOTE_MAX_LENGTH),
        skillType: SkillType.SkillCompetence,
        reuseLevel: ReuseLevel.SectorSpecific,
        importId: getTestString(IMPORT_ID_MAX_LENGTH),
        isLocalized: false,
      },
    ],
    [
      "optional fields",
      {
        UUID: randomUUID(),
        preferredLabel: getTestString(LABEL_MAX_LENGTH),
        modelId: getMockObjectId(2),
        UUIDHistory: [randomUUID()],
        altLabels: [],
        skillType: SkillType.None,
        reuseLevel: ReuseLevel.None,
        originUri: "",
        definition: "",
        description: "",
        scopeNote: "",
        importId: "",
        isLocalized: false,
      },
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ])("Successfully validate skill with %s", async (description, givenFlatObject: any) => {
    // GIVEN a skill document based on the given object, with its translatable fields wrapped as translated sub
    // documents keyed by the fallback language, the shape the schema now stores them as.
    const givenObject = {
      ...givenFlatObject,
      preferredLabel: wrapTranslated(givenFlatObject.preferredLabel),
      altLabels: givenFlatObject.altLabels.map(wrapTranslated),
      description: wrapTranslated(givenFlatObject.description),
      definition: wrapTranslated(givenFlatObject.definition),
      scopeNote: wrapTranslated(givenFlatObject.scopeNote),
    } as ISkillDoc;
    const givenSkillDocument = new skillModel(givenObject);

    // WHEN validating that given skill document
    const actualValidationErrors = givenSkillDocument.validateSync();

    // THEN expect it to validate without any error
    expect(actualValidationErrors).toBeUndefined();

    // AND the document to be saved successfully
    await givenSkillDocument.save();

    // AND the toObject() transformation to return the correct properties, since the schema stores the translatable
    // fields as translated sub documents, toObject() also returns them that way (the repository is the layer
    // responsible for flattening them back to the fallback language string).
    expect(givenSkillDocument.toObject()).toEqual({
      ...givenObject,
      modelId: givenObject.modelId.toString(),
      id: givenSkillDocument._id.toString(),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });

  test("should not drop an altLabels item that lacks the fallback language, e.g. from data written before validation existed", async () => {
    // GIVEN a skill saved through the normal, validated path
    const givenObject = {
      UUID: randomUUID(),
      preferredLabel: wrapTranslated(getTestString(LABEL_MAX_LENGTH)),
      modelId: getMockObjectId(2),
      UUIDHistory: [randomUUID()],
      originUri: "",
      altLabels: [wrapTranslated("kept")],
      definition: wrapTranslated(""),
      description: wrapTranslated(""),
      scopeNote: wrapTranslated(""),
      skillType: SkillType.None,
      reuseLevel: ReuseLevel.None,
      importId: "",
      isLocalized: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any as ISkillDoc;
    const givenSkillDocument = new skillModel(givenObject);
    await givenSkillDocument.save();
    // AND its altLabels are rewritten, bypassing mongoose validation, to include an item that lacks the fallback
    // language entirely, e.g. data that predates the validation this schema now enforces at write time
    await skillModel.collection.updateOne(
      { _id: givenSkillDocument._id },
      { $set: { altLabels: [{ en: "kept" }, { fr: "sans anglais" }] } }
    );

    // WHEN reading the document back
    const actualDoc = await skillModel.findById(givenSkillDocument._id).exec();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const actualObject = actualDoc!.toObject() as any;

    // THEN expect both items to be present, the one lacking the fallback language hydrated as it is stored rather
    // than being silently dropped from the array
    expect(actualObject.altLabels).toEqual([new Map([["en", "kept"]]), new Map([["fr", "sans anglais"]])]);
  });

  describe("Validate skill fields", () => {
    testObjectIdField<ISkillDoc>(() => skillModel, "modelId");

    testUUIDField<ISkillDoc>(() => skillModel);

    testUUIDHistoryField<ISkillDoc>(() => skillModel);

    testOriginUri<ISkillDoc>(() => skillModel);

    testTranslatedStringField<ISkillDoc>(() => skillModel, "preferredLabel", LABEL_MAX_LENGTH, false);

    testTranslatedAltLabelsField<ISkillDoc>(() => skillModel);

    testEmbeddingStatusField<ISkillDoc>(() => skillModel);

    testTranslatedStringField<ISkillDoc>(() => skillModel, "scopeNote", SCOPE_NOTE_MAX_LENGTH);

    testTranslatedStringField<ISkillDoc>(() => skillModel, "definition", DEFINITION_MAX_LENGTH);

    testTranslatedStringField<ISkillDoc>(() => skillModel, "description", DESCRIPTION_MAX_LENGTH);

    describe("Test validation of 'skillType'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "only whitespace characters", WHITESPACE, ` is not a valid enum value for path \`{0}\`.`],
        [CaseType.Failure, "random string", "foo", `\`foo\` is not a valid enum value for path \`{0}\`.`],
        [CaseType.Success, "empty", "", undefined],
        [CaseType.Success, SkillType.Knowledge, SkillType.Knowledge, undefined],
        [CaseType.Success, SkillType.Language, SkillType.Language, undefined],
        [CaseType.Success, SkillType.Attitude, SkillType.Attitude, undefined],
        [CaseType.Success, SkillType.SkillCompetence, SkillType.SkillCompetence, undefined],
        [CaseType.Success, SkillType.None, SkillType.None, undefined],
      ])(
        `(%s) Validate 'skillType' when it is '%s'`,
        (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
          assertCaseForProperty<ISkillDoc>({
            model: skillModel,
            propertyNames: "skillType",
            caseType,
            testValue: value,
            expectedFailureMessage,
          });
        }
      );
    });

    describe("Test validation of 'isLocalized'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "not boolean", "foo", 'Cast to Boolean failed .* path "{0}"'],
        [CaseType.Success, "true", true, undefined],
        [CaseType.Success, "false", false, undefined],
      ])(
        "(%s) Validate 'isLocalized' when it is %s",
        (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
          assertCaseForProperty<ISkillDoc>({
            model: skillModel,
            propertyNames: "isLocalized",
            caseType,
            testValue: value,
            expectedFailureMessage,
          });
        }
      );
    });

    describe("Test validation of 'reuseLevel'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "only whitespace characters", WHITESPACE, ` is not a valid enum value for path \`{0}\`.`],
        [CaseType.Failure, "random string", "foo", `\`foo\` is not a valid enum value for path \`{0}\`.`],
        [CaseType.Success, ReuseLevel.SectorSpecific, ReuseLevel.SectorSpecific, undefined],
        [CaseType.Success, ReuseLevel.OccupationSpecific, ReuseLevel.OccupationSpecific, undefined],
        [CaseType.Success, ReuseLevel.CrossSector, ReuseLevel.CrossSector, undefined],
        [CaseType.Success, ReuseLevel.Transversal, ReuseLevel.Transversal, undefined],
        [CaseType.Success, ReuseLevel.None, ReuseLevel.None, undefined],
      ])(
        `(%s) Validate 'reuseLevel' when it is %s`,
        (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
          assertCaseForProperty<ISkillDoc>({
            model: skillModel,
            propertyNames: "reuseLevel",
            caseType,
            testValue: value,
            expectedFailureMessage,
          });
        }
      );
    });

    testImportId<ISkillDoc>(() => skillModel);
  });

  test("should have correct indexes", async () => {
    // GIVEN that the indexes exist
    await skillModel.createIndexes();

    // WHEN getting the indexes
    const indexes = (await skillModel.listIndexes()).map((index) => {
      return { key: index.key, unique: index.unique };
    });

    // THEN expect the indexes to be correct
    expect(indexes).toIncludeSameMembers([
      { key: { _id: 1 }, unique: undefined },
      { key: { UUID: 1 }, unique: true },
      { key: { modelId: 1 }, unique: undefined },
      { key: { UUIDHistory: 1 }, unique: undefined },
    ]);
  });
});
