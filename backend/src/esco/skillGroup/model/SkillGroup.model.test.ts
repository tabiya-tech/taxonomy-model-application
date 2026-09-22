// Suppress chatty console during the tests
import "_test_utilities/consoleMock";

import mongoose, { Connection } from "mongoose";
import { randomUUID } from "crypto";
import { getNewConnection } from "server/connection/newConnection";
import { initializeSchemaAndModel } from "./SkillGroup.model";
import { getMockObjectId } from "_test_utilities/mockMongoId";
import { generateRandomUrl, getRandomString, getTestString, WHITESPACE } from "_test_utilities/getMockRandomData";
import { assertCaseForProperty, CaseType } from "_test_utilities/dataModel";
import {
  DESCRIPTION_MAX_LENGTH,
  IMPORT_ID_MAX_LENGTH,
  LABEL_MAX_LENGTH,
  SCOPE_NOTE_MAX_LENGTH,
} from "esco/common/modelSchema";
import { getTestSkillGroupCode } from "_test_utilities/mockSkillGroupCode";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { ISkillGroupDoc } from "../_shared/skillGroup.types";
import {
  testTranslatedAltLabelsField,
  testEmbeddingStatusField,
  testOptionalImportId,
  testObjectIdField,
  testOriginUri,
  testTranslatedStringField,
  testUUIDField,
  testUUIDHistoryField,
} from "esco/_test_utilities/modelSchemaTestFunctions";
import { getFallbackLanguageConfig } from "common/language/fallbackLanguage";

describe("Test the definition of the skillGroup Model", () => {
  let dbConnection: Connection;
  let skillGroupModel: mongoose.Model<ISkillGroupDoc>;
  beforeAll(async () => {
    // Using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("SkillGroupModelTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    // Initialize the schema and model
    skillGroupModel = initializeSchemaAndModel(dbConnection);
  });

  afterAll(async () => {
    if (dbConnection) {
      await dbConnection.dropDatabase();
      await dbConnection.close();
    }
  });

  const fallbackDbKeyName = getFallbackLanguageConfig().dbKeyName;
  // Wraps a flat string into a localized sub document keyed by the fallback language, e.g. "Management" -> { en: "Management" }.
  const wrapTranslated = (value: string) => ({ [fallbackDbKeyName]: value });

  test.each([
    [
      "mandatory fields",
      {
        UUID: randomUUID(),
        code: getTestSkillGroupCode(100),
        preferredLabel: getTestString(LABEL_MAX_LENGTH),
        modelId: getMockObjectId(2),
        UUIDHistory: [randomUUID()],
        originUri: generateRandomUrl(),
        altLabels: [getRandomString(LABEL_MAX_LENGTH), getRandomString(LABEL_MAX_LENGTH)],
        description: getTestString(DESCRIPTION_MAX_LENGTH),
        scopeNote: getTestString(SCOPE_NOTE_MAX_LENGTH),
        importId: getTestString(IMPORT_ID_MAX_LENGTH),
      },
    ],
    [
      "optional fields",
      {
        UUID: randomUUID(),
        code: getTestSkillGroupCode(100),
        preferredLabel: getTestString(LABEL_MAX_LENGTH),
        modelId: getMockObjectId(2),
        UUIDHistory: [randomUUID()],
        altLabels: [],
        originUri: "",
        description: "",
        scopeNote: "",
        importId: "",
      },
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ])("Successfully validate skillGroup with %s", async (description, givenFlatObject: any) => {
    // GIVEN a skillGroup document based on the given object, with its translatable fields wrapped as localized sub
    // documents keyed by the fallback language, the shape the schema now stores them as.
    const givenObject = {
      ...givenFlatObject,
      preferredLabel: wrapTranslated(givenFlatObject.preferredLabel),
      altLabels: givenFlatObject.altLabels.map(wrapTranslated),
      description: wrapTranslated(givenFlatObject.description),
      scopeNote: wrapTranslated(givenFlatObject.scopeNote),
    } as ISkillGroupDoc;
    const givenSkillGroupDocument = new skillGroupModel(givenObject);

    // WHEN validating that given skillGroup document
    const actualValidationErrors = givenSkillGroupDocument.validateSync();

    // THEN expect it to validate without any error
    expect(actualValidationErrors).toBeUndefined();

    // AND the document to be saved successfully
    await givenSkillGroupDocument.save();

    // AND the toObject() transformation to return the correct properties, with the translatable fields flattened
    // back to the fallback language string, since that is what the schema's transform does.
    expect(givenSkillGroupDocument.toObject()).toEqual({
      ...givenFlatObject,
      modelId: givenObject.modelId.toString(),
      id: givenSkillGroupDocument._id.toString(),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });

  test("should round trip a whitespace only value for a field that allows empty values, without turning it into an empty string", async () => {
    // GIVEN a skillGroup whose scopeNote is translated to whitespace only in the fallback language, which the schema
    // allows (scopeNote's TranslatedStringProperty defaults allowEmptyValues to true)
    const givenWhitespaceOnlyValue = "   ";
    const givenObject = {
      UUID: randomUUID(),
      code: getTestSkillGroupCode(100),
      preferredLabel: wrapTranslated(getTestString(LABEL_MAX_LENGTH)),
      modelId: getMockObjectId(2),
      UUIDHistory: [randomUUID()],
      originUri: "",
      altLabels: [],
      description: wrapTranslated(""),
      scopeNote: wrapTranslated(givenWhitespaceOnlyValue),
      importId: "",
    } as unknown as ISkillGroupDoc;
    const givenSkillGroupDocument = new skillGroupModel(givenObject);

    // WHEN saving and reading the document back
    await givenSkillGroupDocument.save();
    const actualObject = givenSkillGroupDocument.toObject();

    // THEN expect scopeNote to be returned exactly as stored, not treated as untranslated and defaulted to ""
    expect(actualObject.scopeNote).toEqual(givenWhitespaceOnlyValue);
  });

  test("should not drop an altLabels item that lacks the fallback language, e.g. from data written before validation existed", async () => {
    // GIVEN a skillGroup saved through the normal, validated path
    const givenObject = {
      UUID: randomUUID(),
      code: getTestSkillGroupCode(100),
      preferredLabel: wrapTranslated(getTestString(LABEL_MAX_LENGTH)),
      modelId: getMockObjectId(2),
      UUIDHistory: [randomUUID()],
      originUri: "",
      altLabels: [wrapTranslated("kept")],
      description: wrapTranslated(""),
      scopeNote: wrapTranslated(""),
      importId: "",
    } as unknown as ISkillGroupDoc;
    const givenSkillGroupDocument = new skillGroupModel(givenObject);
    await givenSkillGroupDocument.save();
    // AND its altLabels are rewritten, bypassing mongoose validation, to include an item that lacks the fallback
    // language entirely, e.g. data that predates the validation this schema now enforces at write time
    await skillGroupModel.collection.updateOne(
      { _id: givenSkillGroupDocument._id },
      { $set: { altLabels: [{ [fallbackDbKeyName]: "kept" }, { fr: "sans anglais" }] } }
    );

    // WHEN reading the document back
    const actualDoc = await skillGroupModel.findById(givenSkillGroupDocument._id).exec();
    const actualObject = actualDoc!.toObject();

    // THEN expect both items to be present, the one lacking the fallback language read as an empty string rather
    // than being silently dropped from the array
    expect(actualObject.altLabels).toEqual(["kept", ""]);
  });

  describe("Validate skillGroup fields", () => {
    testObjectIdField<ISkillGroupDoc>(() => skillGroupModel, "modelId");

    testUUIDField<ISkillGroupDoc>(() => skillGroupModel);

    testUUIDHistoryField<ISkillGroupDoc>(() => skillGroupModel);

    describe("Test validation of 'code'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "only whitespace characters", WHITESPACE, `${WHITESPACE} is not a valid code.`],
        [CaseType.Failure, "not a string od digits", "foo1", "foo1 is not a valid code."],
        [CaseType.Failure, "more than 4 digits", "55555", "55555 is not a valid code."],
        [CaseType.Failure, "with negative sign", "-9999", "-9999 is not a valid code."],
        [CaseType.Success, "empty", "", undefined],
        [CaseType.Success, "valid code 'S1.3.5'", "S1.3.5", undefined],
        [CaseType.Success, "one letter 'L'", "L", undefined],
        [CaseType.Success, "one letter with number 'T3'", "T3", undefined],
        [CaseType.Success, "any way in range", getTestSkillGroupCode(100), undefined],
      ])(`(%s) Validate 'code' when it is %s`, (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<ISkillGroupDoc>({
          model: skillGroupModel,
          propertyNames: "code",
          caseType,
          testValue: value,
          expectedFailureMessage,
        });
      });
    });

    testOriginUri<ISkillGroupDoc>(() => skillGroupModel);

    testTranslatedStringField<ISkillGroupDoc>(() => skillGroupModel, "preferredLabel", LABEL_MAX_LENGTH, false);

    testTranslatedAltLabelsField<ISkillGroupDoc>(() => skillGroupModel);

    testEmbeddingStatusField<ISkillGroupDoc>(() => skillGroupModel);

    testTranslatedStringField<ISkillGroupDoc>(() => skillGroupModel, "description", DESCRIPTION_MAX_LENGTH);

    testTranslatedStringField<ISkillGroupDoc>(() => skillGroupModel, "scopeNote", SCOPE_NOTE_MAX_LENGTH);

    testOptionalImportId<ISkillGroupDoc>(() => skillGroupModel);
  });

  test("should have correct indexes", async () => {
    // GIVEN that the indexes exist
    await skillGroupModel.createIndexes();

    // WHEN getting the indexes
    const indexes = (await skillGroupModel.listIndexes()).map((index) => {
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
