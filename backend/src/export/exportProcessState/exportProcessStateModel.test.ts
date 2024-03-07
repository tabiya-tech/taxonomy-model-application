// suppress chatty log output when testing
import "_test_utilities/consoleMock";

import mongoose from "mongoose";
import ExportProcessStateApiSpecs from "api-specifications/exportProcessState";
import { IExportProcessStateDoc } from "./exportProcessState.types";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getNewConnection } from "server/connection/newConnection";
import { initializeSchemaAndModel } from "./exportProcessStateModel";
import { testObjectIdField } from "esco/_test_utilities/modelSchemaTestFunctions";
import { assertCaseForProperty, CaseType } from "_test_utilities/dataModel";
import { WHITESPACE } from "_test_utilities/specialCharacters";

describe("Test the definition of ExportProcessState Model", () => {
  let dbConnection: mongoose.Connection;
  let model: mongoose.Model<IExportProcessStateDoc>;

  beforeAll(async () => {
    const config = getTestConfiguration("ExportProcessStateModelTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    model = initializeSchemaAndModel(dbConnection);
  });

  afterAll(async () => {
    if (dbConnection) {
      await dbConnection.dropDatabase();
      await dbConnection.close();
    }
  });

  test("should successfully validate with mandatory fields", async () => {
    // GIVEN an object with the mandatory fields
    const givenObject: IExportProcessStateDoc = {
      modelId: new mongoose.Types.ObjectId(),
      status: ExportProcessStateApiSpecs.Enums.Status.PENDING,
      result: {
        errored: false,
        exportErrors: false,
        exportWarnings: false,
      },
      downloadUrl: "https://example.com",
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    // AND an ExportProcessState document based on the given object
    const givenExportStateDocument = new model(givenObject);

    // WHEN validating that given document
    const actualValidationErrors = givenExportStateDocument.validateSync();

    // THEN expect it to validate without any error
    expect(actualValidationErrors).toBeUndefined();
    // AND the document to be saved successfully
    await givenExportStateDocument.save();
    // AND the toObject() transformation to return the correct properties
    expect(givenExportStateDocument.toObject()).toEqual({
      ...givenObject,
      modelId: givenObject.modelId.toString(),
      id: givenExportStateDocument._id.toString(),
      timestamp: expect.any(Date),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });

  describe("Validate ExportProcessState fields", () => {
    testObjectIdField(() => model, "modelId");

    describe("Test validation of 'status'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "only whitespace characters", WHITESPACE, ` is not a valid enum value for path \`{0}\`.`],
        [CaseType.Failure, "string", "foo", `\`foo\` is not a valid enum value for path \`{0}\`.`],
        [
          CaseType.Success,
          ExportProcessStateApiSpecs.Enums.Status.PENDING,
          ExportProcessStateApiSpecs.Enums.Status.PENDING,
          undefined,
        ],
        [
          CaseType.Success,
          ExportProcessStateApiSpecs.Enums.Status.RUNNING,
          ExportProcessStateApiSpecs.Enums.Status.RUNNING,
          undefined,
        ],
        [
          CaseType.Success,
          ExportProcessStateApiSpecs.Enums.Status.COMPLETED,
          ExportProcessStateApiSpecs.Enums.Status.COMPLETED,
          undefined,
        ],
      ])(
        `(%s) Validate 'status' when it is %s`,
        (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
          assertCaseForProperty<IExportProcessStateDoc>({
            model,
            propertyNames: "status",
            caseType,
            testValue: value,
            expectedFailureMessage,
          });
        }
      );
    });

    // Test validation of 'result'
    describe.each([["errored"], ["exportErrors"], ["exportWarnings"]])(
      `Test validation of 'result.%s'`,
      (fieldName) => {
        test.each([
          [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
          [CaseType.Failure, "null", null, "Path `{0}` is required."],
          [CaseType.Failure, "not boolean", "foo", 'Cast to Boolean failed .* path "{0}"'],
          [CaseType.Success, "true", true, undefined],
          [CaseType.Success, "false", false, undefined],
        ])(
          `(%s) Validate 'result.${fieldName}' when it is %s`,
          (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
            assertCaseForProperty<IExportProcessStateDoc>({
              model,
              propertyNames: ["result", fieldName],
              caseType,
              testValue: value,
              expectedFailureMessage,
            });
          }
        );
      }
    );

    describe("Test validation of 'downloadUrl'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "random string", "foo", "foo is not a valid URL"],
        [CaseType.Success, "empty", "", undefined],
        [CaseType.Success, "valid URL", "https://example.com", undefined],
        [CaseType.Success, "valid URL", "http://example.com", undefined],
      ])(
        `(%s) Validate 'downloadUrl' when it is %s`,
        (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
          assertCaseForProperty<IExportProcessStateDoc>({
            model,
            propertyNames: "downloadUrl",
            caseType,
            testValue: value,
            expectedFailureMessage,
          });
        }
      );
    });

    describe("Test validation of 'timestamp'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "random string", "foo", 'Cast to date failed for value .* at path "{0}"'],
        [CaseType.Success, "valid date", new Date().toString(), undefined],
      ])(
        `(%s) Validate 'timestamp' when it is %s`,
        (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
          assertCaseForProperty<IExportProcessStateDoc>({
            model,
            propertyNames: "timestamp",
            caseType,
            testValue: value,
            expectedFailureMessage,
          });
        }
      );
    });
  });
});
