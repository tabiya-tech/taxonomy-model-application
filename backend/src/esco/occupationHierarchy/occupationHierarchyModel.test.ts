// Suppress chatty console during the tests
import "_test_utilities/consoleMock";

import mongoose, { Connection } from "mongoose";
import { getNewConnection } from "server/connection/newConnection";
import { getMockObjectId } from "_test_utilities/mockMongoId";
import { INDEX_FOR_CHILDREN, INDEX_FOR_PARENT, initializeSchemaAndModel } from "./occupationHierarchyModel";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { ObjectTypes } from "esco/common/objectTypes";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { IOccupationHierarchyPairDoc } from "./occupationHierarchy.types";
import { testDocModel, testObjectIdField, testObjectType } from "esco/_test_utilities/modelSchemaTestFunctions";

describe("Test the definition of the OccupationHierarchy Model", () => {
  let dbConnection: Connection;
  let OccupationHierarchyModel: mongoose.Model<IOccupationHierarchyPairDoc>;
  beforeAll(async () => {
    // Using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("OccupationHierarchyModelTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    // Initialize the schema and model
    OccupationHierarchyModel = initializeSchemaAndModel(dbConnection);
  });

  afterAll(async () => {
    if (dbConnection) {
      await dbConnection.dropDatabase();
      await dbConnection.close();
    }
  });

  test("Successfully validate Occupation Hierarchy with mandatory fields", async () => {
    // GIVEN an Occupation Hierarchy document based on the given object
    const givenObject: IOccupationHierarchyPairDoc = {
      modelId: getMockObjectId(2),
      parentType: ObjectTypes.ISCOGroup,
      parentId: getMockObjectId(2),
      parentDocModel: MongooseModelName.ISCOGroup,
      childId: getMockObjectId(2),
      childType: ObjectTypes.Occupation,
      childDocModel: MongooseModelName.Occupation,
    };
    const givenOccupationDocument = new OccupationHierarchyModel(givenObject);

    // WHEN validating that given Occupation Hierarchy document
    const actualValidationErrors = givenOccupationDocument.validateSync();

    // AND the document to be saved successfully
    expect(actualValidationErrors).toBeUndefined();

    // AND expect the document to be saved successfully
    await givenOccupationDocument.save();

    // AND the toObject() transformation to return the correct properties
    expect(givenOccupationDocument.toObject()).toEqual({
      ...givenObject,
      modelId: givenObject.modelId.toString(),
      parentId: givenObject.parentId.toString(),
      childId: givenObject.childId.toString(),
      id: givenOccupationDocument._id.toString(),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });

  describe("Validate Occupation Hierarchy Model fields", () => {
    testObjectIdField<IOccupationHierarchyPairDoc>(() => OccupationHierarchyModel, "modelId");

    testObjectIdField<IOccupationHierarchyPairDoc>(() => OccupationHierarchyModel, "parentId");

    testObjectIdField<IOccupationHierarchyPairDoc>(() => OccupationHierarchyModel, "childId");

    testObjectType<IOccupationHierarchyPairDoc>(() => OccupationHierarchyModel, "parentType", [
      ObjectTypes.ISCOGroup,
      ObjectTypes.Occupation,
    ]);

    testObjectType<IOccupationHierarchyPairDoc>(() => OccupationHierarchyModel, "childType", [
      ObjectTypes.ISCOGroup,
      ObjectTypes.Occupation,
    ]);

    testDocModel<IOccupationHierarchyPairDoc>(() => OccupationHierarchyModel, "parentDocModel", [
      MongooseModelName.Occupation,
      MongooseModelName.ISCOGroup,
    ]);

    testDocModel<IOccupationHierarchyPairDoc>(() => OccupationHierarchyModel, "childDocModel", [
      MongooseModelName.Occupation,
      MongooseModelName.ISCOGroup,
    ]);
  });

  test("should have correct indexes", async () => {
    // GIVEN that the indexes exist
    await OccupationHierarchyModel.createIndexes();

    // WHEN getting the indexes
    const indexes = (await OccupationHierarchyModel.listIndexes()).map((index) => {
      return { key: index.key, unique: index.unique };
    });

    // THEN expect the indexes to be correct
    expect(indexes).toIncludeSameMembers([
      { key: { _id: 1 }, unique: undefined },
      { key: INDEX_FOR_PARENT, unique: true },
      { key: INDEX_FOR_CHILDREN, unique: true },
    ]);
  });
});
