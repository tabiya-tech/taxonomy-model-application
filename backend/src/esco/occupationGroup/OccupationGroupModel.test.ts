// Suppress chatty console during the tests
import "_test_utilities/consoleMock";

import mongoose, { Connection } from "mongoose";
import { randomUUID } from "crypto";
import { getNewConnection } from "server/connection/newConnection";
import { initializeSchemaAndModel } from "./OccupationGroupModel";
import { getMockObjectId } from "_test_utilities/mockMongoId";
import { generateRandomUrl, getTestString, WHITESPACE } from "_test_utilities/getMockRandomData";
import { DESCRIPTION_MAX_LENGTH, IMPORT_ID_MAX_LENGTH, LABEL_MAX_LENGTH } from "esco/common/modelSchema";
import { assertCaseForProperty, CaseType } from "_test_utilities/dataModel";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getMockRandomISCOGroupCode, getMockRandomLocalGroupCode } from "_test_utilities/mockOccupationGroupCode";
import { IOccupationGroupDoc } from "./OccupationGroup.types";
import {
  testAltLabelsField,
  testDescription,
  testOptionalImportId,
  testObjectIdField,
  testOriginUri,
  testPreferredLabel,
  testUUIDField,
  testUUIDHistoryField,
  testEnumField,
} from "esco/_test_utilities/modelSchemaTestFunctions";
import { ObjectTypes } from "esco/common/objectTypes";

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

  test.each<[string, IOccupationGroupDoc]>([
    [
      "mandatory fields for ISCOGroup",
      {
        UUID: randomUUID(),
        UUIDHistory: [randomUUID()],
        code: getMockRandomISCOGroupCode(),
        preferredLabel: getTestString(LABEL_MAX_LENGTH),
        modelId: getMockObjectId(2),
        originUri: generateRandomUrl(),
        groupType: ObjectTypes.ISCOGroup,
        altLabels: [getTestString(LABEL_MAX_LENGTH, "Label_1"), getTestString(LABEL_MAX_LENGTH, "Label_2")],
        description: getTestString(DESCRIPTION_MAX_LENGTH),
        importId: getTestString(IMPORT_ID_MAX_LENGTH),
      },
    ],
    [
      "optional fields for ISCOGroup",
      {
        UUID: randomUUID(),
        UUIDHistory: [randomUUID()],
        code: getMockRandomISCOGroupCode(),
        preferredLabel: getTestString(LABEL_MAX_LENGTH),
        modelId: getMockObjectId(2),
        groupType: ObjectTypes.ISCOGroup,
        originUri: "",
        altLabels: [],
        description: "",
        importId: "",
      },
    ],
    [
      "mandatory fields for LocalGroup",
      {
        UUID: randomUUID(),
        UUIDHistory: [randomUUID()],
        code: getMockRandomLocalGroupCode(),
        preferredLabel: getTestString(LABEL_MAX_LENGTH),
        modelId: getMockObjectId(2),
        originUri: generateRandomUrl(),
        groupType: ObjectTypes.LocalGroup,
        altLabels: [getTestString(LABEL_MAX_LENGTH, "Label_1"), getTestString(LABEL_MAX_LENGTH, "Label_2")],
        description: getTestString(DESCRIPTION_MAX_LENGTH),
        importId: getTestString(IMPORT_ID_MAX_LENGTH),
      },
    ],
    [
      "optional fields for LocalGroup",
      {
        UUID: randomUUID(),
        UUIDHistory: [randomUUID()],
        code: getMockRandomLocalGroupCode(),
        preferredLabel: getTestString(LABEL_MAX_LENGTH),
        modelId: getMockObjectId(2),
        groupType: ObjectTypes.LocalGroup,
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
      describe("Test validation of 'code' for ISCO groups (^\\d{1,4}$)", () => {
        test.each([
          // Common failure cases
          [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
          [CaseType.Failure, "null", null, "Path `{0}` is required."],
          [CaseType.Failure, "empty", "", "Path `{0}` is required."],
          [
            CaseType.Failure,
            "only whitespace",
            WHITESPACE,
            `Validator failed for path \`{0}\` with value \`${WHITESPACE}\``,
          ],

          // ISCO specific failure cases
          [CaseType.Failure, "non-numeric characters", "abc1", "Validator failed for path `{0}` with value `abc1`"],
          [CaseType.Failure, "more than 4 digits", "12345", "Validator failed for path `{0}` with value `12345`"],
          [CaseType.Failure, "negative number", "-123", "Validator failed for path `{0}` with value `-123`"],
          [CaseType.Failure, "decimal number", "12.34", "Validator failed for path `{0}` with value `12.34`"],

          // Success cases
          [CaseType.Success, "single digit", "1", undefined],
          [CaseType.Success, "two digits", "12", undefined],
          [CaseType.Success, "three digits", "123", undefined],
          [CaseType.Success, "four digits", "1234", undefined],
          [CaseType.Success, "leading zeros", "0001", undefined],
        ])(
          `(%s) Validate 'code' when it is %s`,
          (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
            assertCaseForProperty<IOccupationGroupDoc>({
              model: OccupationGroupModel,
              propertyNames: "code",
              caseType,
              testValue: value,
              expectedFailureMessage,
              dependencies: { groupType: ObjectTypes.ISCOGroup },
            });
          }
        );
      });

      describe("Test validation of 'code' for Local groups (^\\d*[a-zA-Z\\d]+$)", () => {
        test.each([
          // Common failure cases
          [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
          [CaseType.Failure, "null", null, "Path `{0}` is required."],
          [CaseType.Failure, "empty", "", "Path `{0}` is required."],
          [
            CaseType.Failure,
            "only whitespace",
            WHITESPACE,
            `Validator failed for path \`{0}\` with value \`${WHITESPACE}\``,
          ],

          // Local group specific failure cases
          [CaseType.Failure, "special characters", "abc#123", "Validator failed for path `{0}` with value `abc#123`"],
          [CaseType.Failure, "spaces between", "abc 123", "Validator failed for path `{0}` with value `abc 123`"],
          [
            CaseType.Failure,
            "ending with special char",
            "abc123!",
            "Validator failed for path `{0}` with value `abc123!`",
          ],

          // Success cases for standalone Local Groups
          [CaseType.Success, "letters followed by digits", "abc123", undefined],
          [CaseType.Success, "mixed case letters with digits", "aBcDe123", undefined],
          [CaseType.Success, "single letter with digits", "A123", undefined],

          // Success cases for Local Groups with ISCO parent
          [CaseType.Success, "ISCO parent with letters", "1234abc", undefined],
          [CaseType.Success, "ISCO parent with mixed case", "123ABC", undefined],

          // Success cases for Local Groups with Local parent
          [CaseType.Success, "Local parent with letters and digits", "abc123def456", undefined],
          [CaseType.Success, "Mixed case parent with letters and digits", "ABC123def456", undefined],
        ])(
          `(%s) Validate 'code' when it is %s`,
          (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
            assertCaseForProperty<IOccupationGroupDoc>({
              model: OccupationGroupModel,
              propertyNames: "code",
              caseType,
              testValue: value,
              expectedFailureMessage,
              dependencies: { groupType: ObjectTypes.LocalGroup },
            });
          }
        );
      });
    });

    testDescription<IOccupationGroupDoc>(() => OccupationGroupModel);

    testOriginUri<IOccupationGroupDoc>(() => OccupationGroupModel);

    testPreferredLabel<IOccupationGroupDoc>(() => OccupationGroupModel);

    testAltLabelsField<IOccupationGroupDoc>(() => OccupationGroupModel);

    testOptionalImportId<IOccupationGroupDoc>(() => OccupationGroupModel);

    describe("Test validation of 'modelId'", () => {
      testObjectIdField<IOccupationGroupDoc>(() => OccupationGroupModel, "modelId");
    });

    testEnumField(() => OccupationGroupModel, "groupType", [ObjectTypes.ISCOGroup, ObjectTypes.LocalGroup]);
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
