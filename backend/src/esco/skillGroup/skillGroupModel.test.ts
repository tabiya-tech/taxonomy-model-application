// Suppress chatty console during the tests
import "_test_utilities/consoleMock";

import mongoose, { Connection } from "mongoose";
import { randomUUID } from "crypto";
import { getNewConnection } from "server/connection/newConnection";
import { initializeSchemaAndModel } from "./skillGroupModel";
import { getMockObjectId } from "_test_utilities/mockMongoId";
import { generateRandomUrl, getRandomString, getTestString, WHITESPACE } from "_test_utilities/specialCharacters";
import { assertCaseForProperty, CaseType } from "_test_utilities/dataModel";
import {
  DESCRIPTION_MAX_LENGTH,
  IMPORT_ID_MAX_LENGTH,
  LABEL_MAX_LENGTH,
  SCOPE_NOTE_MAX_LENGTH,
} from "esco/common/modelSchema";
import { getMockRandomSkillCode } from "_test_utilities/mockSkillGroupCode";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { ISkillGroupDoc } from "./skillGroup.types";
import {
  testAltLabelsField,
  testImportId,
  testObjectIdField,
  testOriginUri,
  testPreferredLabel,
  testUUIDField,
  testUUIDHistoryField,
} from "esco/_test_utilities/modelSchemaTestFunctions";

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

  test.each([
    [
      "mandatory fields",
      {
        UUID: randomUUID(),
        code: getMockRandomSkillCode(),
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
        code: getMockRandomSkillCode(),
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
  ])("Successfully validate skillGroup with %s", async (description, givenObject: ISkillGroupDoc) => {
    // GIVEN a skillGroup document based on the given object
    const givenSkillGroupDocument = new skillGroupModel(givenObject);

    // WHEN validating that given skillGroup document
    const actualValidationErrors = givenSkillGroupDocument.validateSync();

    // THEN expect it to validate without any error
    expect(actualValidationErrors).toBeUndefined();

    // AND the document to be saved successfully
    await givenSkillGroupDocument.save();

    // AND the toObject() transformation to return the correct properties
    expect(givenSkillGroupDocument.toObject()).toEqual({
      ...givenObject,
      modelId: givenObject.modelId.toString(),
      id: givenSkillGroupDocument._id.toString(),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
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
        [CaseType.Success, "any way in range", getMockRandomSkillCode(), undefined],
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

    testPreferredLabel<ISkillGroupDoc>(() => skillGroupModel);

    testAltLabelsField<ISkillGroupDoc>(() => skillGroupModel);

    describe("Test validation of 'scopeNote'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [
          CaseType.Failure,
          "Too long scopeNote",
          getTestString(SCOPE_NOTE_MAX_LENGTH + 1),
          `ScopeNote must be at most ${SCOPE_NOTE_MAX_LENGTH} chars long`,
        ],
        [CaseType.Success, "empty", "", undefined],
        [CaseType.Success, "one character", "a", undefined],
        [CaseType.Success, "only whitespace characters", WHITESPACE, undefined],
        [CaseType.Success, "the longest", getTestString(SCOPE_NOTE_MAX_LENGTH), undefined],
      ])(
        `(%s) Validate 'scopeNote' when it is %s`,
        (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
          assertCaseForProperty<ISkillGroupDoc>({
            model: skillGroupModel,
            propertyNames: "scopeNote",
            caseType,
            testValue: value,
            expectedFailureMessage,
          });
        }
      );
    });

    testImportId<ISkillGroupDoc>(() => skillGroupModel);
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
