// Suppress chatty console during the tests
import "_test_utilities/consoleMock";

import mongoose, { Connection } from "mongoose";
import { randomUUID } from "crypto";
import { getNewConnection } from "server/connection/newConnection";
import { initializeSchemaAndModel } from "./OccupationGroupModel";
import { getMockObjectId } from "_test_utilities/mockMongoId";
import { generateRandomUrl, getTestString, WHITESPACE } from "_test_utilities/specialCharacters";
import { DESCRIPTION_MAX_LENGTH, IMPORT_ID_MAX_LENGTH, LABEL_MAX_LENGTH } from "esco/common/modelSchema";
import { assertCaseForProperty, CaseType } from "_test_utilities/dataModel";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getMockRandomOccupationGroupCode } from "_test_utilities/mockOccupationGroupCode";
import { IOccupationGroupDoc, OccupationGroupType } from "./OccupationGroup.types";
import {
  testAltLabelsField,
  testDescription,
  testImportId,
  testObjectIdField,
  testOriginUri,
  testPreferredLabel,
  testUUIDField,
  testUUIDHistoryField,
  testEnumField,
} from "esco/_test_utilities/modelSchemaTestFunctions";

describe("Test the definition of the OccupationGroup Model", () => {
  let dbConnection: Connection;
  let OccupationGroupModel: mongoose.Model<IOccupationGroupDoc>;
  beforeAll(async () => {
    // Using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("OccupationGroupModelTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    // Initialize the schema and model
    OccupationGroupModel = initializeSchemaAndModel(dbConnection);
  });

  afterAll(async () => {
    if (dbConnection) {
      await dbConnection.dropDatabase();
      await dbConnection.close();
    }
  });

  test.each([
    [
      "mandatory fields",
      {
        UUID: randomUUID(),
        UUIDHistory: [randomUUID()],
        code: getMockRandomOccupationGroupCode(),
        preferredLabel: getTestString(LABEL_MAX_LENGTH),
        modelId: getMockObjectId(2),
        originUri: generateRandomUrl(),
        groupType: OccupationGroupType.ISCOGroup,
        altLabels: [getTestString(LABEL_MAX_LENGTH, "Label_1"), getTestString(LABEL_MAX_LENGTH, "Label_2")],
        description: getTestString(DESCRIPTION_MAX_LENGTH),
        importId: getTestString(IMPORT_ID_MAX_LENGTH),
      },
    ],
    [
      "optional fields",
      {
        UUID: randomUUID(),
        UUIDHistory: [randomUUID()],
        code: getMockRandomOccupationGroupCode(),
        preferredLabel: getTestString(LABEL_MAX_LENGTH),
        modelId: getMockObjectId(2),
        groupType: OccupationGroupType.ISCOGroup,
        originUri: "",
        altLabels: [],
        description: "",
        importId: "",
      },
    ],
  ])("Successfully validate OccupationGroup with %s", async (description, givenObject: IOccupationGroupDoc) => {
    // GIVEN an OccupationGroup document based on the given object
    const givenOccupationGroupDocument = new OccupationGroupModel(givenObject);

    // WHEN validating that given OccupationGroup document
    const actualValidationErrors = givenOccupationGroupDocument.validateSync();

    // THEN expect it to validate without any error
    expect(actualValidationErrors).toBeUndefined();

    // AND the document to be saved successfully
    await givenOccupationGroupDocument.save();

    // AND expect the toObject() transformation to have the correct properties
    expect(givenOccupationGroupDocument.toObject()).toEqual({
      ...givenObject,
      modelId: givenObject.modelId.toString(),
      id: givenOccupationGroupDocument._id.toString(),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });

  describe("Validate OccupationGroup fields", () => {
    testObjectIdField<IOccupationGroupDoc>(() => OccupationGroupModel, "modelId");

    testUUIDField<IOccupationGroupDoc>(() => OccupationGroupModel);

    testUUIDHistoryField<IOccupationGroupDoc>(() => OccupationGroupModel);

    describe("Test validation of 'code'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "empty", "", "Path `{0}` is required."],
        [
          CaseType.Failure,
          "only whitespace characters",
          WHITESPACE,
          `Validator failed for path \`{0}\` with value \`${WHITESPACE}\``,
        ],
        [CaseType.Failure, "not a string od digits", "foo1", "Validator failed for path `{0}` with value `foo1`"],
      ])(`(%s) Validate 'code' when it is %s`, (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<IOccupationGroupDoc>({
          model: OccupationGroupModel,
          propertyNames: "code",
          caseType,
          testValue: value,
          expectedFailureMessage,
        });
      });
      describe("Test validation of 'isco code'", () => {
        test.each([
          [CaseType.Failure, "more than 4 digits", "55555", "Validator failed for path `{0}` with value `55555`"],
          [CaseType.Failure, "with negative sign", "-9999", "Validator failed for path `{0}` with value `-9999`"],
          [CaseType.Success, "0", "0", undefined],
          [CaseType.Success, "max", "9999", undefined],
          [CaseType.Success, "leading zero", "0009", undefined],
          [CaseType.Success, "in range", "090", undefined],
        ])(
          `(%s) Validate 'code' when it is %s`,
          (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
            assertCaseForProperty<IOccupationGroupDoc>({
              model: OccupationGroupModel,
              propertyNames: "code",
              caseType,
              testValue: value,
              expectedFailureMessage,
            });
          }
        );
      });
      describe("Test validation of 'icatus code'", () => {
        test.each([
          [CaseType.Failure, "more than 4 digits", "I55555", "Validator failed for path `{0}` with value `I55555`"],
          [CaseType.Failure, "with negative sign", "-I9999", "Validator failed for path `{0}` with value `-I9999`"],
          [CaseType.Failure, "with negative digits", "I-9999", "Validator failed for path `{0}` with value `I-9999`"],
          [CaseType.Success, "I0", "0", undefined],
          [CaseType.Success, "max", "I9999", undefined],
          [CaseType.Success, "leading zero", "I0009", undefined],
          [CaseType.Success, "in range", "I090", undefined],
        ])(
          `(%s) Validate 'code' when it is %s`,
          (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
            assertCaseForProperty<IOccupationGroupDoc>({
              model: OccupationGroupModel,
              propertyNames: "code",
              caseType,
              testValue: value,
              expectedFailureMessage,
            });
          }
        );
      });
    });

    testDescription<IOccupationGroupDoc>(() => OccupationGroupModel);

    testOriginUri<IOccupationGroupDoc>(() => OccupationGroupModel);

    testPreferredLabel<IOccupationGroupDoc>(() => OccupationGroupModel);

    testAltLabelsField<IOccupationGroupDoc>(() => OccupationGroupModel);

    testImportId<IOccupationGroupDoc>(() => OccupationGroupModel);

    testEnumField(() => OccupationGroupModel, "groupType", [
      OccupationGroupType.ISCOGroup,
      OccupationGroupType.ICATUSGroup,
    ]);
  });

  describe("Test the indexes of the OccupationGroup Model", () => {
    test("should have correct indexes", async () => {
      // GIVEN that the indexes exist
      await OccupationGroupModel.createIndexes();

      // WHEN getting the indexes
      const indexes = (await OccupationGroupModel.listIndexes()).map((index) => {
        return { key: index.key, unique: index.unique };
      });

      // THEN expect the indexes to be correct
      expect(indexes).toIncludeSameMembers([
        { key: { _id: 1 }, unique: undefined },
        { key: { modelId: 1, code: 1 }, unique: true },
        { key: { UUID: 1 }, unique: true },
        { key: { UUIDHistory: 1 }, unique: undefined },
      ]);
    });
  });
});
