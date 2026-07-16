// suppress chatty log output when testing
import "_test_utilities/consoleMock";

import mongoose from "mongoose";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getNewConnection } from "server/connection/newConnection";
import { testObjectIdField } from "esco/_test_utilities/modelSchemaTestFunctions";
import { assertCaseForProperty, CaseType } from "_test_utilities/dataModel";
import { WHITESPACE } from "_test_utilities/getMockRandomData";
import { EmbeddableField } from "embeddings/service/types";
import { EntityEmbeddingIdPath, IEntityEmbeddingDoc } from "./entityEmbedding.types";
import {
  initializeSkillEmbeddingSchemaAndModel,
  initializeSkillGroupEmbeddingSchemaAndModel,
  initializeOccupationEmbeddingSchemaAndModel,
  initializeOccupationGroupEmbeddingSchemaAndModel,
  SkillEmbeddingCollectionName,
  SkillGroupEmbeddingCollectionName,
  OccupationEmbeddingCollectionName,
  OccupationGroupEmbeddingCollectionName,
} from "./entityEmbeddingModel";

/**
 * The shape of any of the entity embedding docs, so that all the models can be tested with the same flow,
 * regardless of the entity-specific path under which the id of the embedded entity is stored.
 */
type IAnyEntityEmbeddingDoc = IEntityEmbeddingDoc & Partial<Record<EntityEmbeddingIdPath, mongoose.Types.ObjectId>>;

/**
 * The initializers return the model of their own entity-specific doc, which mongoose types invariantly,
 * so they are widened to the any-entity shape to be tested with the same flow.
 */
type EntityEmbeddingModelInitializer = (dbConnection: mongoose.Connection) => mongoose.Model<IAnyEntityEmbeddingDoc>;

describe.each([
  [
    "SkillEmbedding",
    EntityEmbeddingIdPath.skillId,
    initializeSkillEmbeddingSchemaAndModel as unknown as EntityEmbeddingModelInitializer,
    SkillEmbeddingCollectionName,
  ],
  [
    "SkillGroupEmbedding",
    EntityEmbeddingIdPath.skillGroupId,
    initializeSkillGroupEmbeddingSchemaAndModel as unknown as EntityEmbeddingModelInitializer,
    SkillGroupEmbeddingCollectionName,
  ],
  [
    "OccupationEmbedding",
    EntityEmbeddingIdPath.occupationId,
    initializeOccupationEmbeddingSchemaAndModel as unknown as EntityEmbeddingModelInitializer,
    OccupationEmbeddingCollectionName,
  ],
  [
    "OccupationGroupEmbedding",
    EntityEmbeddingIdPath.occupationGroupId,
    initializeOccupationGroupEmbeddingSchemaAndModel as unknown as EntityEmbeddingModelInitializer,
    OccupationGroupEmbeddingCollectionName,
  ],
])(
  "Test the definition of the %s Model",
  (
    modelDescription: string,
    givenEntityIdPath: EntityEmbeddingIdPath,
    initializeSchemaAndModel: EntityEmbeddingModelInitializer,
    expectedCollectionName: string
  ) => {
    let dbConnection: mongoose.Connection;
    let model: mongoose.Model<IAnyEntityEmbeddingDoc>;

    beforeAll(async () => {
      const config = getTestConfiguration(`${modelDescription}ModelTestDB`);
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
      const givenObject: IAnyEntityEmbeddingDoc = {
        modelId: new mongoose.Types.ObjectId(),
        [givenEntityIdPath]: new mongoose.Types.ObjectId(),
        embeddingServiceId: "77bb8ff3-a6b0-460b-bcaa-00631a907852",
        sourceHash: "md5:5eb63bbbe01eeed093cb22bb8f5acdc3",
        sourceField: EmbeddableField.preferredLabel,
        sourceText: "some source text",
        vector: [0.1, 0.2, 0.3],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      // AND a document based on the given object
      const givenDocument = new model(givenObject);

      // WHEN validating that given document
      const actualValidationErrors = givenDocument.validateSync();

      // THEN expect it to validate without any error
      expect(actualValidationErrors).toBeUndefined();
      // AND the document to be saved successfully
      await givenDocument.save();
      // AND the toObject() transformation to return the correct properties
      expect(givenDocument.toObject()).toEqual({
        ...givenObject,
        modelId: givenObject.modelId.toString(),
        id: givenDocument._id.toString(),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    test(`should store the documents in the '${expectedCollectionName}' collection`, () => {
      // GIVEN the initialized model
      // WHEN getting the collection name of the model
      const actualCollectionName = model.collection.collectionName;

      // THEN expect it to be the expected collection name
      expect(actualCollectionName).toEqual(expectedCollectionName);
    });

    describe("Validate the entity embedding fields", () => {
      testObjectIdField(() => model, "modelId");

      testObjectIdField(() => model, givenEntityIdPath);

      describe.each([["embeddingServiceId"], ["sourceHash"]])("Test validation of '%s'", (fieldName) => {
        test.each([
          [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
          [CaseType.Failure, "null", null, "Path `{0}` is required."],
          [CaseType.Success, "a valid string", "some value", undefined],
        ])(
          `(%s) Validate '${fieldName}' when it is %s`,
          (caseType: CaseType, _caseDescription, value, expectedFailureMessage) => {
            assertCaseForProperty<IAnyEntityEmbeddingDoc>({
              model,
              propertyNames: fieldName,
              caseType,
              testValue: value,
              expectedFailureMessage,
            });
          }
        );
      });

      describe("Test validation of 'sourceField'", () => {
        test.each([
          [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
          [CaseType.Failure, "null", null, "Path `{0}` is required."],
          [CaseType.Failure, "only whitespace characters", WHITESPACE, ` is not a valid enum value for path \`{0}\`.`],
          [CaseType.Failure, "not an embeddable field", "foo", `\`foo\` is not a valid enum value for path \`{0}\`.`],
          ...Object.values(EmbeddableField).map((field): [CaseType, string, string, undefined] => [
            CaseType.Success,
            field,
            field,
            undefined,
          ]),
        ])(
          `(%s) Validate 'sourceField' when it is %s`,
          (caseType: CaseType, _caseDescription, value, expectedFailureMessage) => {
            assertCaseForProperty<IAnyEntityEmbeddingDoc>({
              model,
              propertyNames: "sourceField",
              caseType,
              testValue: value,
              expectedFailureMessage,
            });
          }
        );
      });

      describe("Test validation of 'sourceText'", () => {
        test.each([
          [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
          [CaseType.Failure, "null", null, "Path `{0}` is required."],
          [CaseType.Success, "a valid string", "some source text", undefined],
        ])(
          `(%s) Validate 'sourceText' when it is %s`,
          (caseType: CaseType, _caseDescription, value, expectedFailureMessage) => {
            assertCaseForProperty<IAnyEntityEmbeddingDoc>({
              model,
              propertyNames: "sourceText",
              caseType,
              testValue: value,
              expectedFailureMessage,
            });
          }
        );
      });

      describe("Test validation of 'vector'", () => {
        test.each([
          [CaseType.Failure, "an empty array", [], "Path `vector` must not be empty."],
          // an array that cannot be cast to numbers is discarded by mongoose, so the emptiness validator rejects it
          [CaseType.Failure, "not an array of numbers", ["foo"], "Path `vector` must not be empty."],
          [CaseType.Success, "an array with one number", [0.5], undefined],
          [CaseType.Success, "an array with many numbers", [0.1, -0.2, 0.3], undefined],
        ])(
          `(%s) Validate 'vector' when it is %s`,
          (caseType: CaseType, _caseDescription, value, expectedFailureMessage) => {
            assertCaseForProperty<IAnyEntityEmbeddingDoc>({
              model,
              propertyNames: "vector",
              caseType,
              testValue: value,
              expectedFailureMessage,
            });
          }
        );
      });
    });
  }
);
