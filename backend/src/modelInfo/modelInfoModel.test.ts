// Suppress chatty console during the tests
import "_test_utilities/consoleMock";

import mongoose, { Connection } from "mongoose";
import { initializeSchemaAndModel } from "./modelInfoModel";
import ModelInfoAPISpecs from "api-specifications/modelInfo";
import LocaleAPISpecs from "api-specifications/locale";
import { randomUUID } from "crypto";
import { getTestString, WHITESPACE } from "_test_utilities/specialCharacters";
import { getMockObjectId } from "_test_utilities/mockMongoId";
import { getNewConnection } from "server/connection/newConnection";
import { assertCaseForProperty, CaseType } from "_test_utilities/dataModel";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { IModelInfoDoc } from "./modelInfo.types";
import { testObjectIdField } from "esco/_test_utilities/modelSchemaTestFunctions";

describe("Test the definition of the ModelInfo Model", () => {
  let dbConnection: Connection;
  let ModelInfoModel: mongoose.Model<IModelInfoDoc>;
  beforeAll(async () => {
    // Using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("ModelInfoModelTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    // Initializing the schema and model
    ModelInfoModel = initializeSchemaAndModel(dbConnection);
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
        previousUUID: randomUUID(),
        originUUID: randomUUID(),
        name: getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
        locale: {
          UUID: randomUUID(),
          name: getTestString(LocaleAPISpecs.Constants.NAME_MAX_LENGTH),
          shortCode: getTestString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
        },
        description: getTestString(ModelInfoAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
        released: false,
        releaseNotes: getTestString(ModelInfoAPISpecs.Constants.RELEASE_NOTES_MAX_LENGTH),
        version: getTestString(ModelInfoAPISpecs.Constants.VERSION_MAX_LENGTH),
        importProcessState: getMockObjectId(2),
      },
    ],
    [
      "optional fields",
      {
        UUID: randomUUID(),
        previousUUID: "",
        originUUID: "",
        name: getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
        locale: {
          UUID: randomUUID(),
          name: getTestString(LocaleAPISpecs.Constants.NAME_MAX_LENGTH),
          shortCode: getTestString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
        },
        description: "",
        released: false,
        releaseNotes: "",
        importProcessState: getMockObjectId(2),
        version: "",
      },
    ],
  ])("Successfully validate the modelInfo with %s", async (description, givenObject: IModelInfoDoc) => {
    // GIVEN an ModelInfoModel model
    const givenModelInfoModel = new ModelInfoModel(givenObject);

    // WHEN validating the given model
    const actualValidationErrors = givenModelInfoModel.validateSync();

    // THEN expect it to validate without any error
    expect(actualValidationErrors).toBeUndefined();

    // AND the document to be saved successfully
    await givenModelInfoModel.save();

    // AND the toObject() transformation to return the correct properties
    expect(givenModelInfoModel.toObject()).toEqual({
      ...givenObject,
      id: givenModelInfoModel._id.toString(),
      importProcessState: givenObject.importProcessState.toString(),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });

  describe("Validate the modelInfo fields", () => {
    describe("Test validation of 'description'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [
          CaseType.Failure,
          "Too long description",
          getTestString(ModelInfoAPISpecs.Constants.DESCRIPTION_MAX_LENGTH + 1),
          `Description must be at most ${ModelInfoAPISpecs.Constants.DESCRIPTION_MAX_LENGTH} chars long`,
        ],
        [CaseType.Success, "empty", "", undefined],
        [CaseType.Success, "only whitespace characters", WHITESPACE, undefined],
        [CaseType.Success, "one character", "a", undefined],
        [CaseType.Success, "the longest", getTestString(ModelInfoAPISpecs.Constants.DESCRIPTION_MAX_LENGTH), undefined],
      ])(
        "(%s) Validate 'description' when it is %s",
        (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
          assertCaseForProperty<IModelInfoDoc>(ModelInfoModel, "description", caseType, value, expectedFailureMessage);
        }
      );
    });

    describe("Test validation of 'releaseNotes'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [
          CaseType.Failure,
          "Too long releaseNotes",
          getTestString(ModelInfoAPISpecs.Constants.RELEASE_NOTES_MAX_LENGTH + 1),
          `Release notes must be at most ${ModelInfoAPISpecs.Constants.RELEASE_NOTES_MAX_LENGTH} chars long`,
        ],
        [CaseType.Success, "empty", "", undefined],
        [CaseType.Success, "only whitespace characters", WHITESPACE, undefined],
        [CaseType.Success, "one character", "a", undefined],
        [
          CaseType.Success,
          "the longest",
          getTestString(ModelInfoAPISpecs.Constants.RELEASE_NOTES_MAX_LENGTH),
          undefined,
        ],
      ])(
        "(%s) Validate 'releaseNotes' when it is %s",
        (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
          assertCaseForProperty<IModelInfoDoc>(ModelInfoModel, "releaseNotes", caseType, value, expectedFailureMessage);
        }
      );
    });

    describe("Test validation of 'version'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [
          CaseType.Failure,
          "Too long version",
          getTestString(ModelInfoAPISpecs.Constants.VERSION_MAX_LENGTH + 1),
          `Version must be at most ${ModelInfoAPISpecs.Constants.VERSION_MAX_LENGTH} chars long`,
        ],
        [CaseType.Success, "empty", "", undefined],
        [CaseType.Success, "only whitespace characters", WHITESPACE, undefined],
        [CaseType.Success, "one character", "a", undefined],
        [CaseType.Success, "the longest", getTestString(ModelInfoAPISpecs.Constants.VERSION_MAX_LENGTH), undefined],
      ])(
        "(%s) Validate 'version' when it is %s",
        (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
          assertCaseForProperty<IModelInfoDoc>(ModelInfoModel, "version", caseType, value, expectedFailureMessage);
        }
      );
    });

    describe("Test validation of 'name'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "empty", "", "Path `{0}` is required."],
        [
          CaseType.Failure,
          "Too long name",
          getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH + 1),
          `Name must be at most ${ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH} chars long`,
        ],
        [
          CaseType.Failure,
          "only whitespace characters",
          WHITESPACE,
          `Validator failed for path \`{0}\` with value \`${WHITESPACE}\``,
        ],
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
        [
          CaseType.Failure,
          "only whitespace characters",
          WHITESPACE,
          `Validator failed for path \`{0}\` with value \`${WHITESPACE}\``,
        ],
        [CaseType.Failure, "not a UUID v4", "foo", "Validator failed for path `{0}` with value `foo`"],
        [CaseType.Success, "Empty previousUUID", "", undefined],
        [CaseType.Success, "Valid previousUUID", randomUUID(), undefined],
      ])(
        "(%s) Validate 'previousUUID' when it is %s",
        (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
          assertCaseForProperty<IModelInfoDoc>(ModelInfoModel, "previousUUID", caseType, value, expectedFailureMessage);
        }
      );
    });

    describe("Test validation of 'originUUID", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [
          CaseType.Failure,
          "only whitespace characters",
          WHITESPACE,
          `Validator failed for path \`{0}\` with value \`${WHITESPACE}\``,
        ],
        [CaseType.Failure, "not a UUID v4", "foo", "Validator failed for path `{0}` with value `foo`"],
        [CaseType.Success, "Empty originUUID", "", undefined],
        [CaseType.Success, "Valid originUUID", randomUUID(), undefined],
      ])(
        "(%s) Validate 'originUUID' when it is %s",
        (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
          assertCaseForProperty<IModelInfoDoc>(ModelInfoModel, "originUUID", caseType, value, expectedFailureMessage);
        }
      );
    });

    describe("Test validation of 'UUID", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "empty", "", "Path `{0}` is required."],
        [
          CaseType.Failure,
          "only whitespace characters",
          WHITESPACE,
          `Validator failed for path \`{0}\` with value \`${WHITESPACE}\``,
        ],
        [CaseType.Failure, "not a UUID v4", "foo", "Validator failed for path `{0}` with value `foo`"],
        [CaseType.Success, "Valid UUID", randomUUID(), undefined],
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
        [CaseType.Success, "false", false, undefined],
      ])(
        "(%s) Validate 'released' when it is %s",
        (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
          assertCaseForProperty<IModelInfoDoc>(ModelInfoModel, "released", caseType, value, expectedFailureMessage);
        }
      );
    });

    describe("Test validation of 'locale.UUID'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "empty", "", "Path `{0}` is required."],
        [
          CaseType.Failure,
          "only whitespace characters",
          WHITESPACE,
          `Validator failed for path \`{0}\` with value \`${WHITESPACE}\``,
        ],
        [CaseType.Failure, "not a UUID v4", "foo", "Validator failed for path `{0}` with value `foo`"],
        [CaseType.Success, "Valid locale.UUID", randomUUID(), undefined],
      ])(
        "(%s) Validate 'locale.name' when it is %s",
        (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
          assertCaseForProperty<IModelInfoDoc>(
            ModelInfoModel,
            ["locale", "UUID"],
            caseType,
            value,
            expectedFailureMessage
          );
        }
      );
    });

    describe("Test validation of 'locale.name'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [
          CaseType.Failure,
          "Too long locale name",
          getTestString(LocaleAPISpecs.Constants.NAME_MAX_LENGTH + 1),
          `Name must be at most ${ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH} chars long`,
        ],
        [CaseType.Success, "Empty locale.name", "", undefined],
        [CaseType.Success, "Valid locale.name", getTestString(LocaleAPISpecs.Constants.NAME_MAX_LENGTH), undefined],
      ])(
        "(%s) Validate 'locale.name' when it is %s",
        (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
          assertCaseForProperty<IModelInfoDoc>(
            ModelInfoModel,
            ["locale", "name"],
            caseType,
            value,
            expectedFailureMessage
          );
        }
      );
    });

    describe("Test validation of 'locale.shortCode'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [
          CaseType.Failure,
          "Too long locale name",
          getTestString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH + 1),
          `Short code must be at most ${LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH} chars long`,
        ],
        [CaseType.Success, "Empty locale.shortCode", "", undefined],
        [
          CaseType.Success,
          "Valid locale.shortCode",
          getTestString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
          undefined,
        ],
      ])(
        "(%s) Validate 'locale.shortcode' when it is %s",
        (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
          assertCaseForProperty<IModelInfoDoc>(
            ModelInfoModel,
            ["locale", "shortCode"],
            caseType,
            value,
            expectedFailureMessage
          );
        }
      );
    });

    testObjectIdField(() => ModelInfoModel, "importProcessState");
  });

  test("should have correct indexes", async () => {
    // GIVEN that the indexes exist
    await ModelInfoModel.createIndexes();

    // WHEN getting the indexes
    const indexes = (await ModelInfoModel.listIndexes()).map((index) => {
      return { key: index.key, unique: index.unique };
    });

    // THEN expect the indexes to be correct
    expect(indexes).toEqual([
      { key: { _id: 1 }, unique: undefined },
      { key: { UUID: 1 }, unique: true },
    ]);
  });
});
