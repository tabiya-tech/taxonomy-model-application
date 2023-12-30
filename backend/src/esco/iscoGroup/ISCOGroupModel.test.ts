// Suppress chatty console during the tests
import "_test_utilities/consoleMock";

import mongoose, { Connection } from "mongoose";
import { randomUUID } from "crypto";
import { getNewConnection } from "server/connection/newConnection";
import { initializeSchemaAndModel } from "./ISCOGroupModel";
import { getMockObjectId } from "_test_utilities/mockMongoId";
import { generateRandomUrl, getRandomString, getTestString, WHITESPACE } from "_test_utilities/specialCharacters";
import {
  ATL_LABELS_MAX_ITEMS,
  DESCRIPTION_MAX_LENGTH,
  ESCO_URI_MAX_LENGTH,
  IMPORT_ID_MAX_LENGTH,
  LABEL_MAX_LENGTH,
} from "esco/common/modelSchema";
import { assertCaseForProperty, CaseType } from "_test_utilities/dataModel";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getMockRandomISCOGroupCode } from "_test_utilities/mockISCOCode";
import { IISCOGroupDoc } from "./ISCOGroup.types";
import {
  testImportId,
  testObjectIdField,
  testUUIDField,
  testUUIDHistoryField,
} from "esco/_test_utilities/modelSchemaTestFunctions";

describe("Test the definition of the ISCOGroup Model", () => {
  let dbConnection: Connection;
  let ISCOGroupModel: mongoose.Model<IISCOGroupDoc>;
  beforeAll(async () => {
    // Using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("ISCOGroupModelTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    // Initialize the schema and model
    ISCOGroupModel = initializeSchemaAndModel(dbConnection);
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
        code: getMockRandomISCOGroupCode(),
        preferredLabel: getTestString(LABEL_MAX_LENGTH),
        modelId: getMockObjectId(2),
        ESCOUri: generateRandomUrl(),
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
        code: getMockRandomISCOGroupCode(),
        preferredLabel: getTestString(LABEL_MAX_LENGTH),
        modelId: getMockObjectId(2),
        ESCOUri: "",
        altLabels: [],
        description: "",
        importId: "",
      },
    ],
  ])("Successfully validate ISCOGroup with %s", async (description, givenObject: IISCOGroupDoc) => {
    // GIVEN an ISCOGroup document based on the given object
    const givenISCOGroupDocument = new ISCOGroupModel(givenObject);

    // WHEN validating that given ISCOGroup document
    const actualValidationErrors = givenISCOGroupDocument.validateSync();

    // THEN expect it to validate without any error
    expect(actualValidationErrors).toBeUndefined();

    // AND the document to be saved successfully
    await givenISCOGroupDocument.save();

    // AND expect the toObject() transformation to have the correct properties
    expect(givenISCOGroupDocument.toObject()).toEqual({
      ...givenObject,
      modelId: givenObject.modelId.toString(),
      id: givenISCOGroupDocument._id.toString(),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });

  describe("Validate ISCOGroup fields", () => {
    testObjectIdField<IISCOGroupDoc>(() => ISCOGroupModel, "modelId");

    testUUIDField<IISCOGroupDoc>(() => ISCOGroupModel);

    testUUIDHistoryField<IISCOGroupDoc>(() => ISCOGroupModel);

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
        [CaseType.Failure, "more than 4 digits", "55555", "Validator failed for path `{0}` with value `55555`"],
        [CaseType.Failure, "with negative sign", "-9999", "Validator failed for path `{0}` with value `-9999`"],
        [CaseType.Success, "0", "0", undefined],
        [CaseType.Success, "max", "9999", undefined],
        [CaseType.Success, "leading zero", "0009", undefined],
        [CaseType.Success, "any way in range", "090", undefined],
      ])(`(%s) Validate 'code' when it is %s`, (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<IISCOGroupDoc>(ISCOGroupModel, "code", caseType, value, expectedFailureMessage);
      });
    });

    describe("Test validation of 'ESCOUri'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [
          CaseType.Failure,
          "only whitespace characters",
          WHITESPACE,
          `Validator failed for path \`{0}\` with value \`${WHITESPACE}\``,
        ],
        [
          CaseType.Failure,
          "Too long Esco uri",
          getTestString(ESCO_URI_MAX_LENGTH + 1),
          `{0} must be at most ${ESCO_URI_MAX_LENGTH} chars long`,
        ],
        [CaseType.Success, "empty", "", undefined],
        [CaseType.Success, "one letter", "a", undefined],
        [CaseType.Success, "The longest ESCOUri", getTestString(ESCO_URI_MAX_LENGTH), undefined],
      ])(
        `(%s) Validate 'ESCOUri' when it is %s`,
        (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
          assertCaseForProperty<IISCOGroupDoc>(ISCOGroupModel, "ESCOUri", caseType, value, expectedFailureMessage);
        }
      );
    });

    describe("Test validation of 'preferredLabel'", () => {
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
        [
          CaseType.Failure,
          "Too long preferredLabel",
          getTestString(LABEL_MAX_LENGTH + 1),
          `PreferredLabel must be at most ${LABEL_MAX_LENGTH} chars long`,
        ],
        [CaseType.Success, "one character", "a", undefined],
        [CaseType.Success, "the longest", getTestString(LABEL_MAX_LENGTH), undefined],
      ])(
        `(%s) Validate 'preferredLabel' when it is %s`,
        (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
          assertCaseForProperty<IISCOGroupDoc>(
            ISCOGroupModel,
            "preferredLabel",
            caseType,
            value,
            expectedFailureMessage
          );
        }
      );
    });

    describe("Test validation of 'altLabels'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "not and array of strings (objects)", [{ foo: "bar" }], "Path `{0}` is required."],
        [CaseType.Failure, "array with null", [null, null], "Validator failed for path `altLabels` with value `,`"],
        [
          CaseType.Failure,
          "array with undefined",
          [undefined, undefined],
          "Validator failed for path `altLabels` with value `,`",
        ],
        [
          CaseType.Failure,
          "array with double entries",
          ["foo", "foo"],
          "Validator failed for path `{0}` with value `foo,foo`",
        ],
        [
          CaseType.Failure,
          "array with too long label",
          [getTestString(LABEL_MAX_LENGTH + 1)],
          `Validator failed for path \`{0}\` with value \`.{${LABEL_MAX_LENGTH + 1}}\``,
        ],
        [
          CaseType.Failure,
          "too long array",
          new Array(ATL_LABELS_MAX_ITEMS + 1).fill(undefined).map((v, i) => "foo" + i),
          `Validator failed for path \`{0}\` with value \`foo0,foo1,.*,foo${ATL_LABELS_MAX_ITEMS}\``,
        ],
        [CaseType.Success, "empty array", [], undefined],
        [CaseType.Success, "a string (automatically converted to array)", "foo", undefined],
        [CaseType.Success, "valid array", ["foo", "bar"], undefined],
        [CaseType.Success, "valid array with longest label", [getTestString(LABEL_MAX_LENGTH)], undefined],
        [
          CaseType.Success,
          "valid longest array with longest label",
          new Array(ATL_LABELS_MAX_ITEMS).fill(undefined).map(() => getRandomString(LABEL_MAX_LENGTH)),
          undefined,
        ],
      ])(
        `(%s) Validate 'altLabels' when it is %s`,
        (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
          assertCaseForProperty<IISCOGroupDoc>(ISCOGroupModel, "altLabels", caseType, value, expectedFailureMessage);
        }
      );
    });

    describe("Test validation of 'importId'", () => {
      testImportId<IISCOGroupDoc>(() => ISCOGroupModel);
    });
  });

  describe("Test the indexes of the ISCOGroup Model", () => {
    test("should have correct indexes", async () => {
      // GIVEN that the indexes exist
      await ISCOGroupModel.createIndexes();

      // WHEN getting the indexes
      const indexes = (await ISCOGroupModel.listIndexes()).map((index) => {
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
