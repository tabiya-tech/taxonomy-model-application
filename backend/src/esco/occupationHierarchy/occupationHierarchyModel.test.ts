// Suppress chatty console during the tests
import "_test_utilities/consoleMock";

import mongoose, { Connection } from "mongoose";
import { getNewConnection } from "server/connection/newConnection";
import { getMockId } from "_test_utilities/mockMongoId";
import { WHITESPACE } from "_test_utilities/specialCharacters";
import { initializeSchemaAndModel } from "./occupationHierarchyModel";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { ObjectTypes } from "esco/common/objectTypes";
import { assertCaseForProperty, CaseType } from "_test_utilities/dataModel";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { IOccupationHierarchyPairDoc } from "./occupationHierarchy.types";

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
    // GIVEN an Occupation Hierarchy object with mandatory fields filled & a document
    const givenObject: IOccupationHierarchyPairDoc = {
      modelId: getMockId(2),
      parentType: ObjectTypes.ISCOGroup,
      parentId: getMockId(2),
      parentDocModel: MongooseModelName.ISCOGroup,
      childId: getMockId(2),
      childType: ObjectTypes.Occupation,
      childDocModel: MongooseModelName.Occupation,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const givenOccupationDocument = new OccupationHierarchyModel(givenObject);

    // WHEN validating that given Occupation Hierarchy document
    const actualValidationErrors = givenOccupationDocument.validateSync();

    // THEN expect it to validate without any error
    expect(actualValidationErrors).toBeUndefined();
  });

  describe("Validate Occupation Hierarchy Model fields", () => {
    testObjectIdField<IOccupationHierarchyPairDoc>(() => OccupationHierarchyModel, "modelId");

    testObjectIdField<IOccupationHierarchyPairDoc>(() => OccupationHierarchyModel, "parentId");

    testObjectIdField<IOccupationHierarchyPairDoc>(() => OccupationHierarchyModel, "childId");

    testObjectType<IOccupationHierarchyPairDoc>(() => OccupationHierarchyModel, "parentType");

    testObjectType<IOccupationHierarchyPairDoc>(() => OccupationHierarchyModel, "childType");

    testDocModel<IOccupationHierarchyPairDoc>(() => OccupationHierarchyModel, "parentDocModel");

    testDocModel<IOccupationHierarchyPairDoc>(() => OccupationHierarchyModel, "childDocModel");
  });
});

function testObjectIdField<T>(getModel: () => mongoose.Model<T>, fieldName: string) {
  return describe(`Test validation of '${fieldName}'`, () => {
    test.each([
      [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
      [CaseType.Failure, "null", null, "Path `{0}` is required."],
      [CaseType.Failure, "empty", "", 'Cast to ObjectId failed for value .* at path "{0}" because of "BSONError"'],
      [
        CaseType.Failure,
        "only whitespace characters",
        WHITESPACE,
        'Cast to ObjectId failed for value .* at path "{0}" because of "BSONError"',
      ],
      [
        CaseType.Failure,
        "not a objectId (string)",
        "foo",
        'Cast to ObjectId failed for value .* at path "{0}" because of "BSONError"',
      ],
      [
        CaseType.Failure,
        "not a objectId (object)",
        { foo: "bar" },
        'Cast to ObjectId failed for value .* at path "{0}" because of "BSONError"',
      ],
      [CaseType.Success, "ObjectID", new mongoose.Types.ObjectId(), undefined],
      [CaseType.Success, "hex 24 chars", getMockId(2), undefined],
    ])(
      `(%s) Validate '${fieldName}' when it is %s`,
      (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<T>(getModel(), fieldName, caseType, value, expectedFailureMessage);
      }
    );
  });
}

function testObjectType<T>(getModel: () => mongoose.Model<T>, fieldName: string) {
  describe(`Test validation of '${fieldName}'`, () => {
    test.each([
      [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
      [CaseType.Failure, "null", null, "Path `{0}` is required."],
      [CaseType.Failure, "only whitespace characters", WHITESPACE, ` is not a valid enum value for path \`{0}\`.`],
      [CaseType.Failure, "random string", "foo", `\`foo\` is not a valid enum value for path \`{0}\`.`],
      [CaseType.Failure, "empty", "", "Path `{0}` is required."],
      [
        CaseType.Failure,
        ObjectTypes.Skill,
        ObjectTypes.Skill,
        `\`${ObjectTypes.Skill}\` is not a valid enum value for path \`{0}\`.`,
      ],
      [
        CaseType.Failure,
        ObjectTypes.SkillGroup,
        ObjectTypes.SkillGroup,
        `\`${ObjectTypes.SkillGroup}\` is not a valid enum value for path \`{0}\`.`,
      ],
      [CaseType.Success, ObjectTypes.ISCOGroup, ObjectTypes.ISCOGroup, undefined],
      [CaseType.Success, ObjectTypes.Occupation, ObjectTypes.Occupation, undefined],
    ])(
      `(%s) Validate ''${fieldName}' when it is %s`,
      (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<T>(getModel(), fieldName, caseType, value, expectedFailureMessage);
      }
    );
  });
}

function testDocModel<T>(getModel: () => mongoose.Model<T>, fieldName: string) {
  describe(`Test validation of '${fieldName}'`, () => {
    test.each([
      [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
      [CaseType.Failure, "null", null, "Path `{0}` is required."],
      [CaseType.Failure, "only whitespace characters", WHITESPACE, ` is not a valid enum value for path \`{0}\`.`],
      [CaseType.Failure, "random string", "foo", `\`foo\` is not a valid enum value for path \`{0}\`.`],
      [CaseType.Failure, "empty", "", "Path `{0}` is required."],
      [CaseType.Success, MongooseModelName.Occupation, MongooseModelName.Occupation, undefined],
      [CaseType.Success, MongooseModelName.ISCOGroup, MongooseModelName.ISCOGroup, undefined],
    ])(
      `(%s) Validate ''${fieldName}' when it is %s`,
      (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<T>(getModel(), fieldName, caseType, value, expectedFailureMessage);
      }
    );
  });
}
