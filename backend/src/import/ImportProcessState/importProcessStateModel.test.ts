// Suppress chatty console during the tests
import "_test_utilities/consoleMock";

import ImportProcessStateApiSpecs from "api-specifications/importProcessState/";
import mongoose, { Connection } from "mongoose";
import { getNewConnection } from "server/connection/newConnection";
import { initializeSchemaAndModel } from "./importProcessStateModel";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getMockObjectId } from "_test_utilities/mockMongoId";
import { WHITESPACE } from "_test_utilities/getMockRandomData";
import { assertCaseForProperty, CaseType } from "_test_utilities/dataModel";
import { IImportProcessStateDoc } from "./importProcessState.types";
import { testObjectIdField } from "esco/_test_utilities/modelSchemaTestFunctions";

describe("Test the definition of the ImportProcessState Model", () => {
  let dbConnection: Connection;
  let model: mongoose.Model<IImportProcessStateDoc>;
  beforeAll(async () => {
    // Using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("ImportProcessStateModelTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    // Initialize the schema and model
    model = initializeSchemaAndModel(dbConnection);
  });

  afterAll(async () => {
    if (dbConnection) {
      await dbConnection.dropDatabase();
      await dbConnection.close();
    }
  });

  test("Successfully validate ImportModelState with mandatory fields", async () => {
    // GIVEN an ImportModelState document based on the given object
    const givenObject: IImportProcessStateDoc = {
      id: getMockObjectId(1),
      modelId: getMockObjectId(2),
      status: ImportProcessStateApiSpecs.Enums.Status.PENDING,
      result: {
        errored: false,
        parsingErrors: false,
        parsingWarnings: false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const givenImportStateDocument = new model(givenObject);

    // WHEN validating that the given ImportProcessState document
    const actualValidationErrors = givenImportStateDocument.validateSync();

    // THEN expect it to validate without any error
    expect(actualValidationErrors).toBeUndefined();

    // AND the document to be saved successfully
    await givenImportStateDocument.save();

    // AND the toObject() transformation to return the correct properties
    expect(givenImportStateDocument.toObject()).toEqual({
      ...givenObject,
      modelId: givenObject.modelId.toString(),
      id: givenImportStateDocument._id.toString(),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });

  describe("Validate ImportModelState fields", () => {
    testObjectIdField<IImportProcessStateDoc>(() => model, "modelId");

    describe("Test validation of 'status'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "only whitespace characters", WHITESPACE, ` is not a valid enum value for path \`{0}\`.`],
        [CaseType.Failure, "string", "foo", `\`foo\` is not a valid enum value for path \`{0}\`.`],
        [
          CaseType.Success,
          ImportProcessStateApiSpecs.Enums.Status.PENDING,
          ImportProcessStateApiSpecs.Enums.Status.PENDING,
          undefined,
        ],
        [
          CaseType.Success,
          ImportProcessStateApiSpecs.Enums.Status.RUNNING,
          ImportProcessStateApiSpecs.Enums.Status.RUNNING,
          undefined,
        ],
        [
          CaseType.Success,
          ImportProcessStateApiSpecs.Enums.Status.COMPLETED,
          ImportProcessStateApiSpecs.Enums.Status.COMPLETED,
          undefined,
        ],
      ])(
        `(%s) Validate 'status' when it is %s`,
        (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
          assertCaseForProperty<IImportProcessStateDoc>({
            model,
            propertyNames: "status",
            caseType,
            testValue: value,
            expectedFailureMessage,
          });
        }
      );
    });

    describe("Test validation of 'result.errored'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "not boolean", "foo", 'Cast to Boolean failed .* path "{0}"'],
        [CaseType.Success, "true", true, undefined],
        [CaseType.Success, "false", false, undefined],
      ])(
        "(%s) Validate 'result.errored' when it is %s",
        (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
          assertCaseForProperty<IImportProcessStateDoc>({
            model,
            propertyNames: ["result", "errored"],
            caseType,
            testValue: value,
            expectedFailureMessage,
          });
        }
      );
    });

    describe("Test validation of 'result.parsingErrors'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "not boolean", "foo", 'Cast to Boolean failed .* path "{0}"'],
        [CaseType.Success, "true", true, undefined],
        [CaseType.Success, "false", false, undefined],
      ])(
        "(%s) Validate 'result.parsingErrors' when it is %s",
        (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
          assertCaseForProperty<IImportProcessStateDoc>({
            model,
            propertyNames: ["result", "parsingErrors"],
            caseType,
            testValue: value,
            expectedFailureMessage,
          });
        }
      );
    });

    describe("Test validation of 'result.parsingWarnings'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "not boolean", "foo", 'Cast to Boolean failed .* path "{0}"'],
        [CaseType.Success, "true", true, undefined],
        [CaseType.Success, "false", false, undefined],
      ])(
        "(%s) Validate 'result.parsingWarnings' when it is %s",
        (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
          assertCaseForProperty<IImportProcessStateDoc>({
            model,
            propertyNames: ["result", "parsingWarnings"],
            caseType,
            testValue: value,
            expectedFailureMessage,
          });
        }
      );
    });
  });
});
