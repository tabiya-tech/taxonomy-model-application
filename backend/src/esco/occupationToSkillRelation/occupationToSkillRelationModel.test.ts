// suppress chatty log output when testing
import "_test_utilities/consoleMock";

import mongoose, { Connection } from "mongoose";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getNewConnection } from "server/connection/newConnection";
import {
  INDEX_FOR_REQUIRED_BY_OCCUPATIONS,
  INDEX_FOR_REQUIRES_SKILLS,
  initializeSchemaAndModel,
} from "./occupationToSkillRelationModel";
import { getMockObjectId } from "_test_utilities/mockMongoId";
import { testDocModel, testObjectIdField, testObjectType } from "esco/_test_utilities/modelSchemaTestFunctions";
import { assertCaseForProperty, CaseType } from "_test_utilities/dataModel";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { ObjectTypes, SignallingValueLabel } from "esco/common/objectTypes";
import { IOccupationToSkillRelationPairDoc, OccupationToSkillRelationType } from "./occupationToSkillRelation.types";

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
      relationType: OccupationToSkillRelationType.OPTIONAL,
      signallingValueLabel: SignallingValueLabel.NONE,
      signallingValue: 1,
      requiringOccupationType: ObjectTypes.ESCOOccupation,
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

    testDocModel<IOccupationToSkillRelationPairDoc>(
      () => OccupationToSkillRelationModel,
      "requiringOccupationDocModel",
      [MongooseModelName.Occupation]
    );

    testDocModel<IOccupationToSkillRelationPairDoc>(() => OccupationToSkillRelationModel, "requiredSkillDocModel", [
      MongooseModelName.Skill,
    ]);

    describe("Test validation of 'relationType'", function () {
      test.each([
        [CaseType.Failure, undefined, "Path `relationType` is required."],
        [CaseType.Failure, null, "Path `relationType` is required."],
        [CaseType.Failure, "foo", "`foo` is not a valid enum value for path `relationType`."],
        [CaseType.Failure, OccupationToSkillRelationType.NONE, "Validator failed for path `{0}` with value ``"],
        [CaseType.Success, OccupationToSkillRelationType.ESSENTIAL, undefined],
        [CaseType.Success, OccupationToSkillRelationType.OPTIONAL, undefined],
      ])(
        `(%s) Validate 'relationType' for esco occupations when it is %s`,
        function (caseType: CaseType, value, expectedFailureMessage) {
          // check that the relationType is not NONE when the requiring occupation is an ESCO occupation
          assertCaseForProperty<IOccupationToSkillRelationPairDoc>({
            model: OccupationToSkillRelationModel,
            propertyNames: "relationType",
            caseType,
            testValue: value,
            expectedFailureMessage,
            dependencies: {
              requiringOccupationType: ObjectTypes.ESCOOccupation,
            },
          });
        }
      );

      test.each([
        [CaseType.Failure, undefined, "Path `relationType` is required."],
        [CaseType.Failure, null, "Path `relationType` is required."],
        [CaseType.Failure, "foo", "`foo` is not a valid enum value for path `relationType`."],
        [CaseType.Failure, OccupationToSkillRelationType.NONE, "Validator failed for path `{0}` with value ``"],
        [CaseType.Success, OccupationToSkillRelationType.ESSENTIAL, undefined],
        [CaseType.Success, OccupationToSkillRelationType.OPTIONAL, undefined],
      ])(
        `(%s) Validate 'relationType' for local occupations with no signalling value when it is %s`,
        function (caseType: CaseType, value, expectedFailureMessage) {
          // check that the relationType is not NONE when the signalling value is NONE
          assertCaseForProperty<IOccupationToSkillRelationPairDoc>({
            model: OccupationToSkillRelationModel,
            propertyNames: "relationType",
            caseType,
            testValue: value,
            expectedFailureMessage,
            dependencies: {
              requiringOccupationType: ObjectTypes.LocalOccupation,
              signallingValueLabel: SignallingValueLabel.NONE,
            },
          });
        }
      );

      test.each([
        [CaseType.Failure, undefined, "Path `relationType` is required."],
        [CaseType.Failure, null, "Path `relationType` is required."],
        [CaseType.Failure, "foo", "`foo` is not a valid enum value for path `relationType`."],
        [
          CaseType.Failure,
          OccupationToSkillRelationType.ESSENTIAL,
          "Validator failed for path `{0}` with value `essential`",
        ],
        [
          CaseType.Failure,
          OccupationToSkillRelationType.OPTIONAL,
          "Validator failed for path `{0}` with value `optional`",
        ],
        [CaseType.Success, OccupationToSkillRelationType.NONE, undefined],
      ])(
        `(%s) Validate 'relationType' for local occupations with a signalling value when it is %s`,
        function (caseType: CaseType, value, expectedFailureMessage) {
          // check that the relationType is NONE when the signalling value is not NONE
          Object.values(SignallingValueLabel)
            .filter((value) => value !== SignallingValueLabel.NONE)
            .forEach((givenSignallingValue) => {
              assertCaseForProperty<IOccupationToSkillRelationPairDoc>({
                model: OccupationToSkillRelationModel,
                propertyNames: "relationType",
                caseType,
                testValue: value,
                expectedFailureMessage,
                dependencies: {
                  requiringOccupationType: ObjectTypes.LocalOccupation,
                  signallingValueLabel: givenSignallingValue,
                },
              });
            });
        }
      );
      test.each([
        ["undefined", undefined],
        ["null", null],
        ["unknown type", "foo"],
        [ObjectTypes.OccupationGroup, ObjectTypes.OccupationGroup],
        [ObjectTypes.SkillGroup, ObjectTypes.SkillGroup],
        [ObjectTypes.Skill, ObjectTypes.Skill],
      ])(`should fail validation with reason when occupation type is %s `, (desc, givenOccupationType) => {
        const givenOccupationToSkillRelation = {
          relationType: OccupationToSkillRelationType.ESSENTIAL, // valid value
          requiringOccupationType: givenOccupationType,
        };
        assertCaseForProperty({
          model: OccupationToSkillRelationModel,
          propertyNames: "relationType",
          caseType: CaseType.Failure,
          testValue: givenOccupationToSkillRelation.relationType,
          expectedFailureMessage: "Validator failed for path `relationType` with value `essential`",
          expectedFailureReason: "Value of 'occupationType' path is not supported",
        });
      });
    });

    describe("Test validation of 'signallingValueLabel'", function () {
      test.each([
        [CaseType.Failure, undefined, "Path `signallingValueLabel` is required."],
        [CaseType.Failure, null, "Path `signallingValueLabel` is required."],
        [CaseType.Failure, "foo", "`foo` is not a valid enum value for path `signallingValueLabel`."],
        [CaseType.Failure, SignallingValueLabel.LOW, "Validator failed for path `{0}` with value `low`"],
        [CaseType.Failure, SignallingValueLabel.MEDIUM, "Validator failed for path `{0}` with value `medium`"],
        [CaseType.Failure, SignallingValueLabel.HIGH, "Validator failed for path `{0}` with value `high`"],
        [CaseType.Success, SignallingValueLabel.NONE, undefined],
      ])(
        `(%s) Validate 'signallingValueLabel' for esco occupations when it is %s`,
        function (caseType: CaseType, value, expectedFailureMessage) {
          // check that the signallingValueLabel is NONE when the requiring occupation is an ESCO occupation
          assertCaseForProperty<IOccupationToSkillRelationPairDoc>({
            model: OccupationToSkillRelationModel,
            propertyNames: "signallingValueLabel",
            caseType,
            testValue: value,
            expectedFailureMessage,
            dependencies: {
              requiringOccupationType: ObjectTypes.ESCOOccupation,
            },
          });
        }
      );

      test.each([
        [CaseType.Failure, undefined, "Path `signallingValueLabel` is required."],
        [CaseType.Failure, null, "Path `signallingValueLabel` is required."],
        [CaseType.Failure, "foo", "`foo` is not a valid enum value for path `signallingValueLabel`."],
        [CaseType.Failure, SignallingValueLabel.LOW, "Validator failed for path `{0}` with value `low`"],
        [CaseType.Failure, SignallingValueLabel.MEDIUM, "Validator failed for path `{0}` with value `medium`"],
        [CaseType.Failure, SignallingValueLabel.HIGH, "Validator failed for path `{0}` with value `high`"],
        [CaseType.Success, SignallingValueLabel.NONE, undefined],
      ])(
        `(%s) Validate 'signallingValueLabel' for local occupations with a relationType when it is %s`,
        function (caseType: CaseType, value, expectedFailureMessage) {
          // check that the signallingValueLabel is NONE when the relationType is not NONE
          Object.values(OccupationToSkillRelationType)
            .filter((value) => value !== OccupationToSkillRelationType.NONE)
            .forEach((givenRelationType) =>
              assertCaseForProperty<IOccupationToSkillRelationPairDoc>({
                model: OccupationToSkillRelationModel,
                propertyNames: "signallingValueLabel",
                caseType,
                testValue: value,
                expectedFailureMessage,
                dependencies: {
                  requiringOccupationType: ObjectTypes.ESCOOccupation,
                  relationType: givenRelationType,
                },
              })
            );
        }
      );

      test.each([
        [CaseType.Failure, undefined, "Path `signallingValueLabel` is required."],
        [CaseType.Failure, null, "Path `signallingValueLabel` is required."],
        [CaseType.Failure, "foo", "`foo` is not a valid enum value for path `signallingValueLabel`."],
        [CaseType.Failure, SignallingValueLabel.NONE, "Validator failed for path `{0}` with value ``"],
        [CaseType.Success, SignallingValueLabel.LOW, undefined],
        [CaseType.Success, SignallingValueLabel.MEDIUM, undefined],
        [CaseType.Success, SignallingValueLabel.HIGH, undefined],
      ])(
        `(%s) Validate 'signallingValueLabel' for local occupations when it is %s`,
        (caseType: CaseType, value, expectedFailureMessage) => {
          // check that the signallingValueLabel is not NONE when the relationType is NONE
          assertCaseForProperty<IOccupationToSkillRelationPairDoc>({
            model: OccupationToSkillRelationModel,
            propertyNames: "signallingValueLabel",
            caseType,
            testValue: value,
            expectedFailureMessage,
            dependencies: {
              requiringOccupationType: ObjectTypes.LocalOccupation,
              relationType: OccupationToSkillRelationType.NONE,
            },
          });
        }
      );
      test.each([
        ["undefined", undefined],
        ["null", null],
        ["unknown type", "foo"],
        [ObjectTypes.OccupationGroup, ObjectTypes.OccupationGroup],
        [ObjectTypes.SkillGroup, ObjectTypes.SkillGroup],
        [ObjectTypes.Skill, ObjectTypes.Skill],
      ])(`should fail validation with reason when occupation type is %s `, (desc, givenOccupationType) => {
        const givenOccupationToSkillRelation = {
          signallingValueLabel: SignallingValueLabel.LOW, // valid value
          requiringOccupationType: givenOccupationType,
        };
        assertCaseForProperty({
          model: OccupationToSkillRelationModel,
          propertyNames: "signallingValueLabel",
          caseType: CaseType.Failure,
          testValue: givenOccupationToSkillRelation.signallingValueLabel,
          expectedFailureMessage: "Validator failed for path `signallingValueLabel` with value `low`",
          expectedFailureReason: "Value of 'occupationType' path is not supported",
        });
      });
    });

    test.each([
      [CaseType.Failure, -1, "Path `signallingValue` \\(-1\\) is less than minimum allowed value \\(0\\)"],
      [CaseType.Success, 2, undefined],
      [CaseType.Success, 102, undefined],
      [CaseType.Success, 10002, undefined],
      [CaseType.Success, 3432, undefined],
      [CaseType.Success, 1, undefined],
      [CaseType.Success, 0.5, undefined],
      [CaseType.Success, 0.12345, undefined],
    ])(`(%s) Validate 'signallingValue' when it is %s`, (caseType: CaseType, value, expectedFailureMessage) => {
      assertCaseForProperty<IOccupationToSkillRelationPairDoc>({
        model: OccupationToSkillRelationModel,
        propertyNames: "signallingValue",
        caseType,
        testValue: value,
        expectedFailureMessage,
        dependencies: {
          signallingValueLabel: SignallingValueLabel.LOW,
        },
      });
    });

    describe("Test validation of 'requiringOccupationType'", () => {
      testObjectType(() => OccupationToSkillRelationModel, "requiringOccupationType", [
        ObjectTypes.ESCOOccupation,
        ObjectTypes.LocalOccupation,
      ]);
    });
  });

  test("should have correct indexes", async () => {
    // GIVEN that the indexes exist
    await OccupationToSkillRelationModel.createIndexes();

    // WHEN getting the indexes
    const indexes = (await OccupationToSkillRelationModel.listIndexes()).map((index) => {
      return { key: index.key, unique: index.unique };
    });

    // THEN expect the indexes to be correct
    expect(indexes).toIncludeSameMembers([
      { key: { _id: 1 }, unique: undefined },
      { key: INDEX_FOR_REQUIRES_SKILLS, unique: true },
      { key: INDEX_FOR_REQUIRED_BY_OCCUPATIONS, unique: undefined },
    ]);
  });
});
