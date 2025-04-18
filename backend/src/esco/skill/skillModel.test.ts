// Suppress chatty console during the tests
import "_test_utilities/consoleMock";

import mongoose, { Connection } from "mongoose";
import { randomUUID } from "crypto";
import { getNewConnection } from "server/connection/newConnection";
import { initializeSchemaAndModel } from "./skillModel";
import {
  DEFINITION_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  IMPORT_ID_MAX_LENGTH,
  LABEL_MAX_LENGTH,
  SCOPE_NOTE_MAX_LENGTH,
} from "esco/common/modelSchema";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getMockObjectId } from "_test_utilities/mockMongoId";
import {
  generateRandomUrl,
  getRandomString,
  getTestString,
  WHITESPACE,
} from "_test_utilities/getMockRandomData";
import { assertCaseForProperty, CaseType } from "_test_utilities/dataModel";
import { ISkillDoc, ReuseLevel, SkillType } from "./skills.types";
import {
  testAltLabelsField,
  testDescription,
  testImportId,
  testObjectIdField,
  testOriginUri,
  testPreferredLabel,
  testUUIDField,
  testUUIDHistoryField,
} from "esco/_test_utilities/modelSchemaTestFunctions";

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
  ])("Successfully validate skill with mandatory fields", async (description, givenObject: ISkillDoc) => {
    // GIVEN a skill document based on the given object
    const givenSkillDocument = new skillModel(givenObject);

    // WHEN validating that given skill document
    const actualValidationErrors = givenSkillDocument.validateSync();

    // THEN expect it to validate without any error
    expect(actualValidationErrors).toBeUndefined();

    // AND the document to be saved successfully
    await givenSkillDocument.save();

    // AND the toObject() transformation to return the correct properties
    expect(givenSkillDocument.toObject()).toEqual({
      ...givenObject,
      modelId: givenObject.modelId.toString(),
      id: givenSkillDocument._id.toString(),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });

  describe("Validate skillGroup fields", () => {
    testObjectIdField<ISkillDoc>(() => skillModel, "modelId");

    testUUIDField<ISkillDoc>(() => skillModel);

    testUUIDHistoryField<ISkillDoc>(() => skillModel);

    testOriginUri<ISkillDoc>(() => skillModel);

    testPreferredLabel<ISkillDoc>(() => skillModel);

    testAltLabelsField<ISkillDoc>(() => skillModel);

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
          assertCaseForProperty<ISkillDoc>({
            model: skillModel,
            propertyNames: "scopeNote",
            caseType,
            testValue: value,
            expectedFailureMessage,
          });
        }
      );
    });

    describe("Test validation of 'definition'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [
          CaseType.Failure,
          "Too long definition",
          getTestString(DEFINITION_MAX_LENGTH + 1),
          `Definition must be at most ${DEFINITION_MAX_LENGTH} chars long`,
        ],
        [CaseType.Success, "empty", "", undefined],
        [CaseType.Success, "one character", "a", undefined],
        [CaseType.Success, "only whitespace characters", WHITESPACE, undefined],
        [CaseType.Success, "the longest", getTestString(DEFINITION_MAX_LENGTH), undefined],
      ])(
        `(%s) Validate 'definition' when it is %s`,
        (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
          assertCaseForProperty<ISkillDoc>({
            model: skillModel,
            propertyNames: "definition",
            caseType,
            testValue: value,
            expectedFailureMessage,
          });
        }
      );
    });

    testDescription<ISkillDoc>(() => skillModel);

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
