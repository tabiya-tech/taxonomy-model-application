// Suppress chatty console during the tests
import "_test_utilities/consoleMock";

import mongoose, { Connection } from "mongoose";
import { getNewConnection } from "server/connection/newConnection";
import { getMockObjectId } from "_test_utilities/mockMongoId";
import { initializeSchemaAndModel } from "./skillHierarchyModel";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { ObjectTypes } from "esco/common/objectTypes";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { ISkillHierarchyPairDoc } from "./skillHierarchy.types";
import { testDocModel, testObjectIdField, testObjectType } from "esco/_test_utilities/modelSchemaTestFunctions";

describe("Test the definition of the SkillHierarchy Model", () => {
  let dbConnection: Connection;
  let SkillHierarchyModel: mongoose.Model<ISkillHierarchyPairDoc>;
  beforeAll(async () => {
    // Using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("SkillHierarchyModelTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    // Initialize the schema and model
    SkillHierarchyModel = initializeSchemaAndModel(dbConnection);
  });

  afterAll(async () => {
    if (dbConnection) {
      await dbConnection.dropDatabase();
      await dbConnection.close();
    }
  });

  test("Successfully validate Skill Hierarchy with mandatory fields", async () => {
    // GIVEN a Skill Hierarchy document based on the given object
    const givenObject: ISkillHierarchyPairDoc = {
      modelId: getMockObjectId(2),
      parentType: ObjectTypes.SkillGroup,
      parentId: getMockObjectId(2),
      parentDocModel: MongooseModelName.SkillGroup,
      childId: getMockObjectId(2),
      childType: ObjectTypes.Skill,
      childDocModel: MongooseModelName.Skill,
    };
    const givenSkillDocument = new SkillHierarchyModel(givenObject);

    // WHEN validating that given Skill Hierarchy document
    const actualValidationErrors = givenSkillDocument.validateSync();

    // THEN expect it to validate without any error
    expect(actualValidationErrors).toBeUndefined();

    // AND expect the document to be saved successfully
    await givenSkillDocument.save();

    // AND the toObject() transformation to return the correct properties
    expect(givenSkillDocument.toObject()).toEqual({
      ...givenObject,
      modelId: givenObject.modelId.toString(),
      parentId: givenObject.parentId.toString(),
      childId: givenObject.childId.toString(),
      id: givenSkillDocument._id.toString(),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });

  describe("Validate Skill Hierarchy Model fields", () => {
    testObjectIdField<ISkillHierarchyPairDoc>(() => SkillHierarchyModel, "modelId");

    testObjectIdField<ISkillHierarchyPairDoc>(() => SkillHierarchyModel, "parentId");

    testObjectIdField<ISkillHierarchyPairDoc>(() => SkillHierarchyModel, "childId");

    testObjectType<ISkillHierarchyPairDoc>(() => SkillHierarchyModel, "parentType", [
      ObjectTypes.Skill,
      ObjectTypes.SkillGroup,
    ]);

    testObjectType<ISkillHierarchyPairDoc>(() => SkillHierarchyModel, "childType", [
      ObjectTypes.Skill,
      ObjectTypes.SkillGroup,
    ]);

    testDocModel<ISkillHierarchyPairDoc>(() => SkillHierarchyModel, "parentDocModel", [
      MongooseModelName.Skill,
      MongooseModelName.SkillGroup,
    ]);

    testDocModel<ISkillHierarchyPairDoc>(() => SkillHierarchyModel, "childDocModel", [
      MongooseModelName.Skill,
      MongooseModelName.SkillGroup,
    ]);
  });

  test("should have correct indexes", async () => {
    // GIVEN that the indexes exist
    await SkillHierarchyModel.createIndexes();

    // WHEN getting the indexes
    const indexes = (await SkillHierarchyModel.listIndexes()).map((index) => {
      return { key: index.key, unique: index.unique };
    });

    // THEN expect the indexes to be correct
    expect(indexes).toEqual([
      { key: { _id: 1 }, unique: undefined },
      { key: { modelId: 1, parentType: 1, parentId: 1, childId: 1, childType: 1 }, unique: true },
      { key: { modelId: 1, parentId: 1 }, unique: undefined },
      { key: { modelId: 1, childId: 1 }, unique: undefined },
    ]);
  });
});
