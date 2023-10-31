// suppress chatty log output when testing
import "_test_utilities/consoleMock";

import mongoose, { Connection } from "mongoose";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getNewConnection } from "server/connection/newConnection";
import { initializeSchemaAndModel } from "./occupationToSkillRelationModel";
import { getMockObjectId } from "_test_utilities/mockMongoId";
import { testDocModel, testObjectIdField, testObjectType } from "esco/_test_utilities/modelSchemaTestFunctions";
import { assertCaseForProperty, CaseType } from "_test_utilities/dataModel";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { ObjectTypes, RelationType } from "esco/common/objectTypes";
import { IOccupationToSkillRelationPairDoc } from "./occupationToSkillRelation.types";

describe("Test the definition of the OccupationToSkillRelation Model", () => {
  let dbConnection: Connection;
  let OccupationToSkillRelationModel: mongoose.Model<IOccupationToSkillRelationPairDoc>;
  beforeAll(async () => {
    // Using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("OccupationToSkillRelationModelTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    // Initialize the schema and model
    OccupationToSkillRelationModel = initializeSchemaAndModel(dbConnection);
  });

  afterAll(async () => {
    if (dbConnection) {
      await dbConnection.dropDatabase();
      await dbConnection.close();
    }
  });

  test("Successfully validate the OccupationToSkillRelation with mandatory fields", async () => {
    // GIVEN a OccupationToSkillRelation document based on the given object
    const givenObject: IOccupationToSkillRelationPairDoc = {
      modelId: getMockObjectId(2),
      requiredSkillId: getMockObjectId(2),
      requiredSkillDocModel: MongooseModelName.Skill,
      requiringOccupationDocModel: MongooseModelName.Occupation,
      requiringOccupationId: getMockObjectId(2),
      relationType: RelationType.OPTIONAL,
      requiringOccupationType: ObjectTypes.Occupation,
    };
    const givenOccupationToSkillRelationDocument = new OccupationToSkillRelationModel(givenObject);

    // WHEN validating that given OccupationToSkillRelation document
    const actualValidationErrors = givenOccupationToSkillRelationDocument.validateSync();

    // THEN expect it to validate without any error
    expect(actualValidationErrors).toBeUndefined();

    // AND expect the document to be saved successfully
    await givenOccupationToSkillRelationDocument.save();

    // AND the toObject() transformation to return the correct properties
    expect(givenOccupationToSkillRelationDocument.toObject()).toEqual({
      ...givenObject,
      modelId: givenObject.modelId.toString(),
      requiredSkillId: givenObject.requiredSkillId.toString(),
      requiringOccupationId: givenObject.requiringOccupationId.toString(),
      id: givenOccupationToSkillRelationDocument._id.toString(),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });

  describe("Validate the OccupationToSkillRelation Model fields", () => {
    testObjectIdField<IOccupationToSkillRelationPairDoc>(() => OccupationToSkillRelationModel, "modelId");

    testObjectIdField<IOccupationToSkillRelationPairDoc>(() => OccupationToSkillRelationModel, "requiringOccupationId");

    testObjectIdField<IOccupationToSkillRelationPairDoc>(() => OccupationToSkillRelationModel, "requiredSkillId");

    testObjectType<IOccupationToSkillRelationPairDoc>(() => OccupationToSkillRelationModel, "requiringOccupationType", [
      ObjectTypes.Occupation,
    ]);

    testDocModel<IOccupationToSkillRelationPairDoc>(
      () => OccupationToSkillRelationModel,
      "requiringOccupationDocModel",
      [MongooseModelName.Occupation]
    );

    testDocModel<IOccupationToSkillRelationPairDoc>(() => OccupationToSkillRelationModel, "requiredSkillDocModel", [
      MongooseModelName.Skill,
    ]);

    test.each([
      [CaseType.Failure, undefined, "Path `relationType` is required."],
      [CaseType.Failure, null, "Path `relationType` is required."],
      [CaseType.Failure, "foo", "`foo` is not a valid enum value for path `relationType`."],
      [CaseType.Success, RelationType.ESSENTIAL, undefined],
      [CaseType.Success, RelationType.OPTIONAL, undefined],
    ])(`(%s) Validate 'relationType' when it is %s`, (caseType: CaseType, value, expectedFailureMessage) => {
      assertCaseForProperty<IOccupationToSkillRelationPairDoc>(
        OccupationToSkillRelationModel,
        "relationType",
        caseType,
        value,
        expectedFailureMessage
      );
    });

    // Test the requiringOccupationType field
    test.each([
      [CaseType.Failure, undefined, "Path `requiringOccupationType` is required."],
      [CaseType.Failure, null, "Path `requiringOccupationType` is required."],
      [CaseType.Failure, "foo", "`foo` is not a valid enum value for path `requiringOccupationType`."],
      [CaseType.Success, ObjectTypes.Occupation, undefined],
    ])(`(%s) Validate 'requiringOccupationType' when it is %s`, (caseType: CaseType, value, expectedFailureMessage) => {
      assertCaseForProperty<IOccupationToSkillRelationPairDoc>(
        OccupationToSkillRelationModel,
        "requiringOccupationType",
        caseType,
        value,
        expectedFailureMessage
      );
    });
  });
});
