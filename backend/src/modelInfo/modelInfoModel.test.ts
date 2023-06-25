// Suppress chatty console during the tests
import "_test_utilities/consoleMock"

import mongoose, {Connection} from "mongoose";
import {
  DESCRIPTION_MAX_LENGTH,
  IModelInfo,
  NAME_MAX_LENGTH,
  RELEASE_NOTES_MAX_LENGTH, SHORTCODE_MAX_LENGTH,
  VERSION_MAX_LENGTH,
  ModelName, initializeSchemaAndModel
} from './modelInfoModel'
import {randomUUID} from "crypto";
import {getTestString, WHITESPACE} from "_test_utilities/specialCharacters";
import {getMockId} from "_test_utilities/mockMongoId";
import {getNewConnection} from "server/connection/newConnection";
import {assertCaseForProperty, CaseType} from "_test_utilities/dataModel";
import {getTestConfiguration} from "_test_utilities/getTestConfiguration";

describe('Test the definition of the ModelInfo Model', () => {
  let dbConnection: Connection;
  let ModelInfoModel: mongoose.Model<IModelInfo>;
  beforeAll(async () => {
    // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("ModelInfoModelTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    // initialize the schema and model
    initializeSchemaAndModel(dbConnection);
    ModelInfoModel = dbConnection.model(ModelName);
  });

  afterAll(async () => {
    if (dbConnection) {
      await dbConnection.dropDatabase();
      await dbConnection.close();
    }
  });

  test("Successfully validate modelInfo with mandatory fields", async () => {
    // GIVEN an object with all mandatory fields
    const givenObject: IModelInfo = {
      id: getMockId(2),
      UUID: randomUUID(),
      previousUUID: randomUUID(),
      originUUID: randomUUID(),
      name: getTestString(NAME_MAX_LENGTH),
      locale: {
        UUID: randomUUID(),
        name: getTestString(NAME_MAX_LENGTH),
        shortCode: getTestString(SHORTCODE_MAX_LENGTH)
      },
      description: getTestString(DESCRIPTION_MAX_LENGTH),
      released: false,
      releaseNotes: getTestString(RELEASE_NOTES_MAX_LENGTH),
      version: getTestString(VERSION_MAX_LENGTH),
      // @ts-ignore
      createdAt: new Date().toISOString(),
      // @ts-ignore
      updatedAt: new Date().toISOString()
    };

    // WHEN validating that object
    const modelInfoValid = new ModelInfoModel(givenObject);

    // THEN it should validate successfully
    const errors = await modelInfoValid.validateSync()
    // @ts-ignore
    expect(errors).toBeUndefined();
  });

  test("Successfully validate modelInfo with optional fields", async () => {
    // GIVEN an object with all mandatory fields
    //@ts-ignore
    const givenObject: IModelInfo = {
      UUID: randomUUID(),
      previousUUID: "",
      originUUID: "",
      name: getTestString(NAME_MAX_LENGTH),
      locale: {
        UUID: randomUUID(),
        name: getTestString(NAME_MAX_LENGTH),
        shortCode: getTestString(SHORTCODE_MAX_LENGTH)
      },
      description: "",
      released: false,
      releaseNotes: "",
      version: "",
    };

    // WHEN validating that object
    const modelInfoValid = new ModelInfoModel(givenObject);

    // THEN it should validate successfully
    const errors = await modelInfoValid.validateSync()
    // @ts-ignore
    expect(errors).toBeUndefined();
  });

  describe("Validate modelInfo fields", () => {

    describe("Test validation of 'description'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Success, "empty", "", undefined],
        [CaseType.Success, "only whitespace characters", WHITESPACE, undefined],
        [CaseType.Success, "one character", "a", undefined],
        [CaseType.Success, "the longest", getTestString(DESCRIPTION_MAX_LENGTH), undefined],
      ])("(%s) Validate 'description' when it is %s", (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<IModelInfo>(ModelInfoModel, "description", caseType, value, expectedFailureMessage);
      });
    });

    describe("Test validation of 'releaseNotes'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Success, "empty", "", undefined],
        [CaseType.Success, "only whitespace characters", WHITESPACE, undefined],
        [CaseType.Success, "one character", "a", undefined],
        [CaseType.Success, "the longest", getTestString(RELEASE_NOTES_MAX_LENGTH), undefined],
      ])("(%s) Validate 'releaseNotes' when it is %s", (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<IModelInfo>(ModelInfoModel, "releaseNotes", caseType, value, expectedFailureMessage);
      });
    });

    describe("Test validation of 'version'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Success, "empty", "", undefined],
        [CaseType.Success, "only whitespace characters", WHITESPACE, undefined],
        [CaseType.Success, "one character", "a", undefined],
        [CaseType.Success, "the longest", getTestString(VERSION_MAX_LENGTH), undefined],
      ])("(%s) Validate 'version' when it is %s", (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<IModelInfo>(ModelInfoModel, "version", caseType, value, expectedFailureMessage);
      });
    });

    describe("Test validation of 'name'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "empty", "", "Path `{0}` is required."],
        [CaseType.Failure, "Too long name", getTestString(NAME_MAX_LENGTH + 1), `Name must be at most ${NAME_MAX_LENGTH} chars long`],
        [CaseType.Failure, "only whitespace characters", WHITESPACE, `Validator failed for path \`{0}\` with value \`${WHITESPACE}\``],
        [CaseType.Success, "one character", "a", undefined],
        [CaseType.Success, "the longest", getTestString(NAME_MAX_LENGTH), undefined],
      ])("(%s) Validate 'name' when it is %s", (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<IModelInfo>(ModelInfoModel, "name", caseType, value, expectedFailureMessage);
      });
    });

    describe("Test validation of 'previousUUID'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "only whitespace characters", WHITESPACE, `Validator failed for path \`{0}\` with value \`${WHITESPACE}\``],
        [CaseType.Failure, "not a UUID v4", "foo", "Validator failed for path `{0}` with value `foo`"],
        [CaseType.Success, "Empty previousUUID", "", undefined],
        [CaseType.Success, "Valid previousUUID", randomUUID(), undefined]
      ])("(%s) Validate 'previousUUID' when it is %s", (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<IModelInfo>(ModelInfoModel, "previousUUID", caseType, value, expectedFailureMessage);
      });
    });

    describe("Test validation of 'originUUID", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "only whitespace characters", WHITESPACE, `Validator failed for path \`{0}\` with value \`${WHITESPACE}\``],
        [CaseType.Failure, "not a UUID v4", "foo", "Validator failed for path `{0}` with value `foo`"],
        [CaseType.Success, "Empty originUUID", "", undefined],
        [CaseType.Success, "Valid originUUID", randomUUID(), undefined]
      ])("(%s) Validate 'originUUID' when it is %s", (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<IModelInfo>(ModelInfoModel, "originUUID", caseType, value, expectedFailureMessage);
      });
    });

    describe("Test validation of 'UUID", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "empty", "", "Path `{0}` is required."],
        [CaseType.Failure, "only whitespace characters", WHITESPACE, `Validator failed for path \`{0}\` with value \`${WHITESPACE}\``],
        [CaseType.Failure, "not a UUID v4", "foo", "Validator failed for path `{0}` with value `foo`"],
        [CaseType.Success, "Valid UUID", randomUUID(), undefined]
      ])("(%s) Validate 'UUID' when it is %s", (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<IModelInfo>(ModelInfoModel, "UUID", caseType, value, expectedFailureMessage);
      });
    });


    describe("Test validation of 'released'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "not boolean", "foo", 'Cast to Boolean failed .* path "{0}"'],
        [CaseType.Success, "true", true, undefined],
        [CaseType.Success, "false", false, undefined]
      ])("(%s) Validate 'released' when it is %s", (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<IModelInfo>(ModelInfoModel, "released", caseType, value, expectedFailureMessage);
      });
    });

    describe("Test validation of 'locale.UUID'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "empty", "", "Path `{0}` is required."],
        [CaseType.Failure, "only whitespace characters", WHITESPACE, `Validator failed for path \`{0}\` with value \`${WHITESPACE}\``],
        [CaseType.Failure, "not a UUID v4", "foo", "Validator failed for path `{0}` with value `foo`"],
        [CaseType.Success, "Valid locale.UUID", randomUUID(), undefined]
      ])("(%s) Validate 'locale.name' when it is %s", (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<IModelInfo>(ModelInfoModel, ["locale", "UUID"], caseType, value, expectedFailureMessage);
      });
    });

    describe("Test validation of 'locale.name'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "Too long locale name", getTestString(NAME_MAX_LENGTH + 1), `Name must be at most ${NAME_MAX_LENGTH} chars long`],
        [CaseType.Success, "Empty locale.name", "", undefined],
        [CaseType.Success, "Valid locale.name", getTestString(NAME_MAX_LENGTH), undefined]
      ])("(%s) Validate 'locale.name' when it is %s", (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<IModelInfo>(ModelInfoModel, ["locale", "name"], caseType, value, expectedFailureMessage);
      });
    });

    describe("Test validation of 'locale.shortCode'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "Too long locale name", getTestString(SHORTCODE_MAX_LENGTH + 1), `Short code must be at most ${SHORTCODE_MAX_LENGTH} chars long`],
        [CaseType.Success, "Empty locale.shortCode", "", undefined],
        [CaseType.Success, "Valid locale.shortCode", getTestString(SHORTCODE_MAX_LENGTH), undefined]
      ])("(%s) Validate 'locale.shortcode' when it is %s", (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<IModelInfo>(ModelInfoModel, ["locale", "shortCode"], caseType, value, expectedFailureMessage);
      });
    });
  })
})
