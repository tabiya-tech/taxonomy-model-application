// Suppress chatty console during the tests
import "_test_utilities/consoleMock";

import mongoose, { Connection } from "mongoose";
import { getNewConnection } from "server/connection/newConnection";
import { getMockId } from "_test_utilities/mockMongoId";
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
    // GIVEN a Skill Hierarchy object with mandatory fields filled & a document
    const givenObject: ISkillHierarchyPairDoc = {
      modelId: getMockId(2),
      parentType: ObjectTypes.SkillGroup,
      parentId: getMockId(2),
      parentDocModel: MongooseModelName.SkillGroup,
      childId: getMockId(2),
      childType: ObjectTypes.Skill,
      childDocModel: MongooseModelName.Skill,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const givenSkillDocument = new SkillHierarchyModel(givenObject);

    // WHEN validating that given Skill Hierarchy document
    const actualValidationErrors = givenSkillDocument.validateSync();

    // THEN expect it to validate without any error
    expect(actualValidationErrors).toBeUndefined();
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
});
