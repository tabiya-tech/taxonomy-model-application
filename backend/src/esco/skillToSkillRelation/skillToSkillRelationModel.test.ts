// suppress chatty log output when testing
import "_test_utilities/consoleMock";

import mongoose, { Connection } from "mongoose";
import { ISkillToSkillRelationPairDoc, SkillToSkillRelationType } from "./skillToSkillRelation.types";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getNewConnection } from "server/connection/newConnection";
import {
  INDEX_FOR_REQUIRES_SKILLS,
  INDEX_FOR_REQUIRED_BY_SKILLS,
  initializeSchemaAndModel,
} from "./skillToSkillRelationModel";
import { getMockObjectId } from "_test_utilities/mockMongoId";
import { testDocModel, testObjectIdField } from "esco/_test_utilities/modelSchemaTestFunctions";
import { assertCaseForProperty, CaseType } from "_test_utilities/dataModel";
import { MongooseModelName } from "esco/common/mongooseModelNames";

describe("Test the definition of the SkillToSkillRelation Model", () => {
  let dbConnection: Connection;
  let SkillToSkillRelationModel: mongoose.Model<ISkillToSkillRelationPairDoc>;
  beforeAll(async () => {
    // Using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("SkillToSkillRelationModelTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    // Initialize the schema and model
    SkillToSkillRelationModel = initializeSchemaAndModel(dbConnection);
  });

  afterAll(async () => {
    if (dbConnection) {
      await dbConnection.dropDatabase();
      await dbConnection.close();
    }
  });

  test("Successfully validate the SkillToSkillRelation with mandatory fields", async () => {
    // GIVEN a SkillToSkillRelation document based on the given object
    const givenObject: ISkillToSkillRelationPairDoc = {
      modelId: getMockObjectId(2),
      requiringSkillId: getMockObjectId(2),
      requiredSkillDocModel: MongooseModelName.Skill,
      requiringSkillDocModel: MongooseModelName.Skill,
      requiredSkillId: getMockObjectId(2),
      relationType: SkillToSkillRelationType.OPTIONAL,
    };
    const givenSkillToSkillRelationDocument = new SkillToSkillRelationModel(givenObject);

    // WHEN validating that given SkillToSkillRelation document
    const actualValidationErrors = givenSkillToSkillRelationDocument.validateSync();

    // THEN expect it to validate without any error
    expect(actualValidationErrors).toBeUndefined();

    // AND expect the document to be saved successfully
    await givenSkillToSkillRelationDocument.save();

    // AND the toObject() transformation to return the correct properties
    expect(givenSkillToSkillRelationDocument.toObject()).toEqual({
      ...givenObject,
      modelId: givenObject.modelId.toString(),
      requiredSkillId: givenObject.requiredSkillId.toString(),
      requiringSkillId: givenObject.requiringSkillId.toString(),
      id: givenSkillToSkillRelationDocument._id.toString(),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });

  describe("Validate the SkillToSkillRelation Model fields", () => {
    // Test the modelId field
    testObjectIdField(() => SkillToSkillRelationModel, "modelId");
    // Test the requiringSkillId field
    testObjectIdField(() => SkillToSkillRelationModel, "requiringSkillId");
    // Test the requiredSkillId field
    testObjectIdField(() => SkillToSkillRelationModel, "requiredSkillId");

    // Test the requiringSkillDocModel field
    testDocModel(() => SkillToSkillRelationModel, "requiringSkillDocModel", [MongooseModelName.Skill]);
    // Test the requiredSkillDocModel field

    testDocModel(() => SkillToSkillRelationModel, "requiredSkillDocModel", [MongooseModelName.Skill]);

    // Test the relationType field
    test.each([
      [CaseType.Failure, undefined, "Path `relationType` is required."],
      [CaseType.Failure, null, "Path `relationType` is required."],
      [CaseType.Failure, "foo", "`foo` is not a valid enum value for path `relationType`."],
      [CaseType.Success, SkillToSkillRelationType.ESSENTIAL, undefined],
      [CaseType.Success, SkillToSkillRelationType.OPTIONAL, undefined],
    ])(`(%s) Validate 'relationType' when it is %s`, (caseType: CaseType, value, expectedFailureMessage) => {
      assertCaseForProperty<ISkillToSkillRelationPairDoc>({
        model: SkillToSkillRelationModel,
        propertyNames: "relationType",
        caseType,
        testValue: value,
        expectedFailureMessage,
      });
    });
  });

  test("should have correct indexes", async () => {
    // GIVEN that the indexes exist
    await SkillToSkillRelationModel.createIndexes();

    // WHEN getting the indexes
    const indexes = (await SkillToSkillRelationModel.listIndexes()).map((index) => {
      return { key: index.key, unique: index.unique };
    });

    // THEN expect the indexes to be correct
    expect(indexes).toIncludeSameMembers([
      { key: { _id: 1 }, unique: undefined },
      { key: INDEX_FOR_REQUIRES_SKILLS, unique: true },
      { key: INDEX_FOR_REQUIRED_BY_SKILLS, unique: undefined },
    ]);
  });
});
