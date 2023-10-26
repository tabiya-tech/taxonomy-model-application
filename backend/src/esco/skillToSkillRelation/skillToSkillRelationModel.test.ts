// suppress chatty log output when testing
import "_test_utilities/consoleMock";

import mongoose, { Connection } from "mongoose";
import { ISkillToSkillRelationPairDoc } from "./skillToSkillRelation.types";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getNewConnection } from "server/connection/newConnection";
import { initializeSchemaAndModel } from "./skillToSkillRelationModel";
import { getMockObjectId } from "_test_utilities/mockMongoId";
import { testObjectIdField } from "esco/_test_utilities/modelSchemaTestFunctions";
import { assertCaseForProperty, CaseType } from "_test_utilities/dataModel";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { RelationType } from "esco/common/objectTypes";

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
    // GIVEN a SkillToSkillRelation object with mandatory fields filled & a document
    const givenObject: ISkillToSkillRelationPairDoc = {
      modelId: getMockObjectId(2),
      requiringSkillId: getMockObjectId(2),
      requiredSkillDocModel: MongooseModelName.Skill,
      requiringSkillDocModel: MongooseModelName.Skill,
      requiredSkillId: getMockObjectId(2),
      relationType: RelationType.OPTIONAL,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const givenSkillToSkillRelationDocument = new SkillToSkillRelationModel(givenObject);

    // WHEN validating that given SkillToSkillRelation document
    const actualValidationErrors = givenSkillToSkillRelationDocument.validateSync();

    // THEN expect it to validate without any error
    expect(actualValidationErrors).toBeUndefined();
  });

  describe("Validate the SkillToSkillRelation Model fields", () => {
    // Test the modelId field
    testObjectIdField(() => SkillToSkillRelationModel, "modelId");
    // Test the requiringSkillId field
    testObjectIdField(() => SkillToSkillRelationModel, "requiringSkillId");
    // Test the requiredSkillId field
    testObjectIdField(() => SkillToSkillRelationModel, "requiredSkillId");

    // Test the relationType field
    test.each([
      [CaseType.Failure, undefined, "Path `relationType` is required."],
      [CaseType.Failure, null, "Path `relationType` is required."],
      [CaseType.Failure, "foo", "`foo` is not a valid enum value for path `relationType`."],
      [CaseType.Success, RelationType.ESSENTIAL, undefined],
      [CaseType.Success, RelationType.OPTIONAL, undefined],
    ])(`(%s) Validate 'relationType' when it is %s`, (caseType: CaseType, value, expectedFailureMessage) => {
      assertCaseForProperty<ISkillToSkillRelationPairDoc>(
        SkillToSkillRelationModel,
        "relationType",
        caseType,
        value,
        expectedFailureMessage
      );
    });
  });
});
