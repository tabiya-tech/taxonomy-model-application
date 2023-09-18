// Suppress chatty console during the tests
import "_test_utilities/consoleMock"

import mongoose, {Connection} from "mongoose";
import {
  ModelName, initializeSchemaAndModel
} from './modelInfoModel'
import ModelInfoAPISpecs from "api-specifications/modelInfo";
import LocaleAPISpecs from "api-specifications/locale";
import {randomUUID} from "crypto";
import {getTestString, WHITESPACE} from "_test_utilities/specialCharacters";
import {getMockId} from "_test_utilities/mockMongoId";
import {getNewConnection} from "server/connection/newConnection";
import {assertCaseForProperty, assertValueStored, CaseType} from "_test_utilities/dataModel";
import {getTestConfiguration} from "_test_utilities/getTestConfiguration";
import {IModelInfoDoc} from "./modelInfo.types";

describe('Test the definition of the ModelInfo Model', () => {
  let dbConnection: Connection;
  let ModelInfoModel: mongoose.Model<IModelInfoDoc>;
  beforeAll(async () => {
    // Using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("ModelInfoModelTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    // Initializing the schema and model
    initializeSchemaAndModel(dbConnection);
    ModelInfoModel = dbConnection.model(ModelName);
  });

  afterAll(async () => {
    if (dbConnection) {
      await dbConnection.dropDatabase();
      await dbConnection.close();
    }
  });

  test("Successfully validate the modelInfo with the mandatory fields", async () => {
    // GIVEN an object with all mandatory fields
    const givenObject: IModelInfoDoc = {
      id: getMockId(2),
      UUID: randomUUID(),
      previousUUID: randomUUID(),
      originUUID: randomUUID(),
      name: getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
      locale: {
        UUID: randomUUID(),
        name: getTestString(LocaleAPISpecs.Constants.NAME_MAX_LENGTH),
        shortCode: getTestString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH)
      },
      description: getTestString(ModelInfoAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
      released: false,
      releaseNotes: getTestString(ModelInfoAPISpecs.Constants.RELEASE_NOTES_MAX_LENGTH),
      version: getTestString(ModelInfoAPISpecs.Constants.VERSION_MAX_LENGTH),
      importProcessState: getMockId(2),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // WHEN validating that object using the ModelInfoModel
    const actualModelInfoValid = new ModelInfoModel(givenObject);

    // THEN expect it to validate successfully
    const errors = actualModelInfoValid.validateSync()
    // @ts-ignore
    expect(errors).toBeUndefined();
  });

  test("Successfully validate the modelInfo with optional fields", async () => {
    // GIVEN an object with optional fields
    // @ts-ignore
    const givenObject: IModelInfoDoc = {
      UUID: randomUUID(),
      previousUUID: "",
      originUUID: "",
      name: getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
      locale: {
        UUID: randomUUID(),
        name: getTestString(LocaleAPISpecs.Constants.NAME_MAX_LENGTH),
        shortCode: getTestString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH)
      },
      description: "",
      released: false,
      releaseNotes: "",
      importProcessState: getMockId(2),
      version: "",
    };

    // WHEN validating that object using the ModelInfoModel
    const actualModelInfoValid = new ModelInfoModel(givenObject);

    // THEN expect it to validate successfully
    const errors = actualModelInfoValid.validateSync()
    // @ts-ignore
    expect(errors).toBeUndefined();
  });

  describe("Validate the modelInfo fields", () => {

    describe("Test validation of 'description'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "Too long description", getTestString(ModelInfoAPISpecs.Constants.DESCRIPTION_MAX_LENGTH + 1), `Description must be at most ${ModelInfoAPISpecs.Constants.DESCRIPTION_MAX_LENGTH} chars long`],
        [CaseType.Success, "empty", "", undefined],
        [CaseType.Success, "only whitespace characters", WHITESPACE, undefined],
        [CaseType.Success, "one character", "a", undefined],
        [CaseType.Success, "the longest", getTestString(ModelInfoAPISpecs.Constants.DESCRIPTION_MAX_LENGTH), undefined],
      ])("(%s) Validate 'description' when it is %s", (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<IModelInfoDoc>(ModelInfoModel, "description", caseType, value, expectedFailureMessage);
      });
    });

    describe("Test validation of 'releaseNotes'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "Too long releaseNotes", getTestString(ModelInfoAPISpecs.Constants.RELEASE_NOTES_MAX_LENGTH + 1), `Release notes must be at most ${ModelInfoAPISpecs.Constants.RELEASE_NOTES_MAX_LENGTH} chars long`],
        [CaseType.Success, "empty", "", undefined],
        [CaseType.Success, "only whitespace characters", WHITESPACE, undefined],
        [CaseType.Success, "one character", "a", undefined],
        [CaseType.Success, "the longest", getTestString(ModelInfoAPISpecs.Constants.RELEASE_NOTES_MAX_LENGTH), undefined],
      ])("(%s) Validate 'releaseNotes' when it is %s", (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<IModelInfoDoc>(ModelInfoModel, "releaseNotes", caseType, value, expectedFailureMessage);
      });
    });

    describe("Test validation of 'version'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "Too long version", getTestString(ModelInfoAPISpecs.Constants.VERSION_MAX_LENGTH + 1), `Version must be at most ${ModelInfoAPISpecs.Constants.VERSION_MAX_LENGTH} chars long`],
        [CaseType.Success, "empty", "", undefined],
        [CaseType.Success, "only whitespace characters", WHITESPACE, undefined],
        [CaseType.Success, "one character", "a", undefined],
        [CaseType.Success, "the longest", getTestString(ModelInfoAPISpecs.Constants.VERSION_MAX_LENGTH), undefined],
      ])("(%s) Validate 'version' when it is %s", (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<IModelInfoDoc>(ModelInfoModel, "version", caseType, value, expectedFailureMessage);
      });
    });

    describe("Test validation of 'name'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "empty", "", "Path `{0}` is required."],
        [CaseType.Failure, "Too long name", getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH + 1), `Name must be at most ${ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH} chars long`],
        [CaseType.Failure, "only whitespace characters", WHITESPACE, `Validator failed for path \`{0}\` with value \`${WHITESPACE}\``],
        [CaseType.Success, "one character", "a", undefined],
        [CaseType.Success, "the longest", getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH), undefined],
      ])("(%s) Validate 'name' when it is %s", (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<IModelInfoDoc>(ModelInfoModel, "name", caseType, value, expectedFailureMessage);
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
        assertCaseForProperty<IModelInfoDoc>(ModelInfoModel, "previousUUID", caseType, value, expectedFailureMessage);
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
        assertCaseForProperty<IModelInfoDoc>(ModelInfoModel, "originUUID", caseType, value, expectedFailureMessage);
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
        assertCaseForProperty<IModelInfoDoc>(ModelInfoModel, "UUID", caseType, value, expectedFailureMessage);
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
        assertCaseForProperty<IModelInfoDoc>(ModelInfoModel, "released", caseType, value, expectedFailureMessage);
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
        assertCaseForProperty<IModelInfoDoc>(ModelInfoModel, ["locale", "UUID"], caseType, value, expectedFailureMessage);
      });
    });

    describe("Test validation of 'locale.name'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "Too long locale name", getTestString(LocaleAPISpecs.Constants.NAME_MAX_LENGTH + 1), `Name must be at most ${ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH} chars long`],
        [CaseType.Success, "Empty locale.name", "", undefined],
        [CaseType.Success, "Valid locale.name", getTestString(LocaleAPISpecs.Constants.NAME_MAX_LENGTH), undefined]
      ])("(%s) Validate 'locale.name' when it is %s", (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<IModelInfoDoc>(ModelInfoModel, ["locale", "name"], caseType, value, expectedFailureMessage);
      });
    });

    describe("Test validation of 'locale.shortCode'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "Too long locale name", getTestString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH + 1), `Short code must be at most ${LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH} chars long`],
        [CaseType.Success, "Empty locale.shortCode", "", undefined],
        [CaseType.Success, "Valid locale.shortCode", getTestString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH), undefined]
      ])("(%s) Validate 'locale.shortcode' when it is %s", (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<IModelInfoDoc>(ModelInfoModel, ["locale", "shortCode"], caseType, value, expectedFailureMessage);
      });
    });

    describe("Test validation of 'importProcessState'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "empty", "", 'Cast to ObjectId failed for value .* at path "{0}" because of "BSONError"'],
        [CaseType.Failure, "only whitespace characters", WHITESPACE, 'Cast to ObjectId failed for value .* at path "{0}" because of "BSONError"'],
        [CaseType.Failure, "not a objectId (string)", "foo", 'Cast to ObjectId failed for value .* at path "{0}" because of "BSONError"'],
        [CaseType.Failure, "not a objectId (object)", {foo: "bar"}, 'Cast to ObjectId failed for value .* at path "{0}" because of "BSONError"'],
        [CaseType.Success, "ObjectID", new mongoose.Types.ObjectId(), undefined],
        [CaseType.Success, "hex 24 chars", getMockId(2), undefined],
      ])(`(%s) Validate 'importProcessState' when it is %s`, (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<IModelInfoDoc>(ModelInfoModel, ["importProcessState"], caseType, value, expectedFailureMessage);
      });
    });
  })
})
