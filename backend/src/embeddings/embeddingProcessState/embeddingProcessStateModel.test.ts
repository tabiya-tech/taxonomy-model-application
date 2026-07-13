// suppress chatty log output when testing
import "_test_utilities/consoleMock";

import mongoose from "mongoose";
import ModelInfoApiSpecs from "api-specifications/modelInfo";
import { IEmbeddingProcessStateDoc } from "./embeddingProcessState.types";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getNewConnection } from "server/connection/newConnection";
import { initializeSchemaAndModel } from "./embeddingProcessStateModel";
import { testObjectIdField } from "esco/_test_utilities/modelSchemaTestFunctions";
import { assertCaseForProperty, CaseType } from "_test_utilities/dataModel";
import { WHITESPACE } from "_test_utilities/getMockRandomData";

describe("Test the definition of EmbeddingProcessState Model", () => {
  let dbConnection: mongoose.Connection;
  let model: mongoose.Model<IEmbeddingProcessStateDoc>;

  beforeAll(async () => {
    const config = getTestConfiguration("EmbeddingProcessStateModelTestDB");
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
    const givenObject: IEmbeddingProcessStateDoc = {
      modelId: new mongoose.Types.ObjectId(),
      status: ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.PENDING,
      embeddingServiceId: "gemini$$models/gemini-embedding-2",
      totalDocuments: 10,
      errorCounts: 0,
      warningCounts: 0,
      completedDocuments: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    // AND an EmbeddingProcessState document based on the given object
    const givenEmbeddingStateDocument = new model(givenObject);

    // WHEN validating that given document
    const actualValidationErrors = givenEmbeddingStateDocument.validateSync();

    // THEN expect it to validate without any error
    expect(actualValidationErrors).toBeUndefined();
    // AND the document to be saved successfully
    await givenEmbeddingStateDocument.save();
    // AND the toObject() transformation to return the correct properties
    expect(givenEmbeddingStateDocument.toObject()).toEqual({
      ...givenObject,
      modelId: givenObject.modelId.toString(),
      id: givenEmbeddingStateDocument._id.toString(),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });

  describe("Validate EmbeddingProcessState fields", () => {
    testObjectIdField(() => model, "modelId");

    describe("Test validation of 'status'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "only whitespace characters", WHITESPACE, ` is not a valid enum value for path \`{0}\`.`],
        [CaseType.Failure, "string", "foo", `\`foo\` is not a valid enum value for path \`{0}\`.`],
        [
          CaseType.Success,
          ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.PENDING,
          ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.PENDING,
          undefined,
        ],
        [
          CaseType.Success,
          ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.IN_PROGRESS,
          ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.IN_PROGRESS,
          undefined,
        ],
        [
          CaseType.Success,
          ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.COMPLETED,
          ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.COMPLETED,
          undefined,
        ],
      ])(
        `(%s) Validate 'status' when it is %s`,
        (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
          assertCaseForProperty<IEmbeddingProcessStateDoc>({
            model,
            propertyNames: "status",
            caseType,
            testValue: value,
            expectedFailureMessage,
          });
        }
      );
    });

    describe("Test validation of 'embeddingServiceId'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Success, "a valid string", "gemini$$models/gemini-embedding-2", undefined],
      ])(
        `(%s) Validate 'embeddingServiceId' when it is %s`,
        (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
          assertCaseForProperty<IEmbeddingProcessStateDoc>({
            model,
            propertyNames: "embeddingServiceId",
            caseType,
            testValue: value,
            expectedFailureMessage,
          });
        }
      );
    });

    describe.each([["totalDocuments"], ["errorCounts"], ["warningCounts"], ["completedDocuments"]])(
      "Test validation of '%s'",
      (fieldName) => {
        test.each([
          [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
          [CaseType.Failure, "null", null, "Path `{0}` is required."],
          [CaseType.Failure, "not a number", "foo", "Cast to Number failed"],
          [CaseType.Failure, "a negative number", -1, "is less than minimum allowed value"],
          [CaseType.Success, "zero", 0, undefined],
          [CaseType.Success, "a positive integer", 42, undefined],
        ])(
          `(%s) Validate '${fieldName}' when it is %s`,
          (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
            assertCaseForProperty<IEmbeddingProcessStateDoc>({
              model,
              propertyNames: fieldName,
              caseType,
              testValue: value,
              expectedFailureMessage,
            });
          }
        );
      }
    );
  });
});
