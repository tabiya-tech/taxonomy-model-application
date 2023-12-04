// Suppress chatty console during the tests
import "_test_utilities/consoleMock";

import mongoose, { Connection } from "mongoose";
import { randomUUID } from "crypto";
import { getNewConnection } from "server/connection/newConnection";
import { initializeSchemaAndModel } from "./occupationModel";
import { getMockObjectId } from "_test_utilities/mockMongoId";
import { generateRandomUrl, getRandomString, getTestString, WHITESPACE } from "_test_utilities/specialCharacters";
import {
  ATL_LABELS_MAX_ITEMS,
  DEFINITION_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  ESCO_URI_MAX_LENGTH,
  IMPORT_ID_MAX_LENGTH,
  LABEL_MAX_LENGTH,
  REGULATED_PROFESSION_NOTE_MAX_LENGTH,
  SCOPE_NOTE_MAX_LENGTH,
} from "esco/common/modelSchema";
import { assertCaseForProperty, CaseType } from "_test_utilities/dataModel";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getMockRandomOccupationCode } from "_test_utilities/mockOccupationCode";
import { getMockRandomISCOGroupCode } from "_test_utilities/mockISCOCode";
import { IOccupationDoc } from "./occupation.types";
import { testImportId, testObjectIdField } from "esco/_test_utilities/modelSchemaTestFunctions";
import { OccupationType } from "esco/common/objectTypes";

describe("Test the definition of the Occupation Model", () => {
  let dbConnection: Connection;
  let OccupationModel: mongoose.Model<IOccupationDoc>;
  beforeAll(async () => {
    // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("OccupationModelTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    // initialize the schema and model
    OccupationModel = initializeSchemaAndModel(dbConnection);
  });

  afterAll(async () => {
    if (dbConnection) {
      await dbConnection.dropDatabase();
      await dbConnection.close();
    }
  });

  test.each([
    [
      "mandatory fields ESCO occupation",
      {
        UUID: randomUUID(),
        code: getMockRandomOccupationCode(false),
        preferredLabel: getTestString(LABEL_MAX_LENGTH),
        modelId: getMockObjectId(2),
        originUUID: randomUUID(),
        ESCOUri: generateRandomUrl(),
        altLabels: [getTestString(LABEL_MAX_LENGTH, "Label_1"), getTestString(LABEL_MAX_LENGTH, "Label_2")],
        description: getTestString(DESCRIPTION_MAX_LENGTH),
        ISCOGroupCode: getMockRandomISCOGroupCode(),
        definition: getTestString(DEFINITION_MAX_LENGTH),
        scopeNote: getTestString(SCOPE_NOTE_MAX_LENGTH),
        regulatedProfessionNote: getTestString(REGULATED_PROFESSION_NOTE_MAX_LENGTH),
        importId: getTestString(IMPORT_ID_MAX_LENGTH),
        occupationType: OccupationType.ESCO,
      },
    ],
    [
      "optional fields ESCO occupation",
      {
        UUID: randomUUID(),
        code: getMockRandomOccupationCode(false),
        preferredLabel: getTestString(LABEL_MAX_LENGTH),
        modelId: getMockObjectId(2),
        originUUID: "",
        ESCOUri: "",
        altLabels: [],
        description: "",
        ISCOGroupCode: getMockRandomISCOGroupCode(),
        definition: "",
        scopeNote: "",
        regulatedProfessionNote: "",
        importId: getTestString(IMPORT_ID_MAX_LENGTH),
        occupationType: OccupationType.ESCO,
      },
    ],
    [
      "mandatory fields local occupation",
      {
        UUID: randomUUID(),
        code: getMockRandomOccupationCode(true),
        preferredLabel: getTestString(LABEL_MAX_LENGTH),
        modelId: getMockObjectId(2),
        originUUID: randomUUID(),
        ESCOUri: generateRandomUrl(),
        altLabels: [getTestString(LABEL_MAX_LENGTH, "Label_1"), getTestString(LABEL_MAX_LENGTH, "Label_2")],
        description: getTestString(DESCRIPTION_MAX_LENGTH),
        ISCOGroupCode: getMockRandomISCOGroupCode(),
        definition: getTestString(DEFINITION_MAX_LENGTH),
        scopeNote: getTestString(SCOPE_NOTE_MAX_LENGTH),
        regulatedProfessionNote: getTestString(REGULATED_PROFESSION_NOTE_MAX_LENGTH),
        importId: getTestString(IMPORT_ID_MAX_LENGTH),
        occupationType: OccupationType.LOCAL,
      },
    ],
    [
      "optional fields Local occupation",
      {
        UUID: randomUUID(),
        code: getMockRandomOccupationCode(true),
        preferredLabel: getTestString(LABEL_MAX_LENGTH),
        modelId: getMockObjectId(2),
        originUUID: "",
        ESCOUri: "",
        altLabels: [],
        description: "",
        ISCOGroupCode: getMockRandomISCOGroupCode(),
        definition: "",
        scopeNote: "",
        regulatedProfessionNote: "",
        importId: getTestString(IMPORT_ID_MAX_LENGTH),
        occupationType: OccupationType.LOCAL,
      },
    ],
  ])("Successfully validate Occupation with %s", async (description, givenObject: IOccupationDoc) => {
    // GIVEN an Occupation document based on the given object
    const givenOccupationDocument = new OccupationModel(givenObject);

    // WHEN validating that given occupation document
    const actualValidationErrors = givenOccupationDocument.validateSync();

    // THEN expect it to validate without any error
    expect(actualValidationErrors).toBeUndefined();

    // AND the document to be saved successfully
    await givenOccupationDocument.save();

    // AND the toObject() transformation to return the correct properties
    expect(givenOccupationDocument.toObject()).toEqual({
      ...givenObject,
      modelId: givenObject.modelId.toString(),
      id: givenOccupationDocument._id.toString(),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });

  describe("Validate Occupation fields", () => {
    testObjectIdField<IOccupationDoc>(() => OccupationModel, "modelId");

    describe("Test validation of 'UUID'", () => {
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
        [CaseType.Failure, "not a UUID v4", "foo", "Validator failed for path `{0}` with value `foo`"],
        [CaseType.Success, "Valid UUID", randomUUID(), undefined],
      ])(`(%s) Validate 'UUID' when it is %s`, (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<IOccupationDoc>(OccupationModel, "UUID", caseType, value, expectedFailureMessage);
      });
    });

    describe("Test validation of 'originUUID'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [
          CaseType.Failure,
          "only whitespace characters",
          WHITESPACE,
          `Validator failed for path \`{0}\` with value \`${WHITESPACE}\``,
        ],
        [CaseType.Failure, "not a UUID v4", "foo", "Validator failed for path `{0}` with value `foo`"],
        [CaseType.Success, "Empty originUUID", "", undefined],
        [CaseType.Success, "Valid UUID", randomUUID(), undefined],
      ])(
        `(%s) Validate 'originUUID' when it is %s`,
        (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
          assertCaseForProperty<IOccupationDoc>(OccupationModel, "originUUID", caseType, value, expectedFailureMessage);
        }
      );
    });

    describe("Test validation of 'ISCOGroupCode'", () => {
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
      ])(
        `(%s) Validate 'ISCOGroupCode' when it is %s`,
        (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
          assertCaseForProperty<IOccupationDoc>(
            OccupationModel,
            "ISCOGroupCode",
            caseType,
            value,
            expectedFailureMessage
          );
        }
      );
    });

    describe("Test validation of 'code", () => {
      describe("Test validation of 'code' for ESCO occupations", () => {
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
          [CaseType.Failure, "not a string of digits", "foo1", "Validator failed for path `{0}` with value `foo1`"],
          [CaseType.Failure, "less than 4 digits", "555.1", "Validator failed for path `{0}` with value `555.1`"],
          [CaseType.Failure, "more than 4 digits", "55555.1", "Validator failed for path `{0}` with value `55555.1`"],
          [CaseType.Failure, "with negative sign", "-9999.1", "Validator failed for path `{0}` with value `-9999.1`"],
          [CaseType.Success, "extremely deep 1234.1.2.3.4.5.6.7.8.9", "1234.1.2.3.4.5.6.7.8.9", undefined],
          [CaseType.Success, "leading zeros 0001.01.01", "0001.01.01", undefined],
          [CaseType.Success, " typical value 1234.1", "1234.1", undefined],
        ])(
          `(%s) Validate 'code' when it is %s`,
          (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
            assertCaseForProperty<IOccupationDoc>(OccupationModel, "code", caseType, value, expectedFailureMessage, {
              occupationType: OccupationType.ESCO,
            });
          }
        );
      });

      describe("Test validation of 'code' for Local occupations", () => {
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
          [CaseType.Failure, "not matching pattern", "foo1_2", "Validator failed for path `{0}` with value `foo1_2`"],
          [CaseType.Failure, "extra characters", "1234.1_1x", "Validator failed for path `{0}` with value `1234.1_1x`"],
          [
            CaseType.Failure,
            "inconsistent ESCO segment",
            "1234._01_12",
            "Validator failed for path `{0}` with value `1234._01_12`",
          ],
          [CaseType.Failure, "only underscores", "____", "Validator failed for path `{0}` with value `____`"],
          [
            CaseType.Failure,
            "ISCO Missing segment",
            ".1234.1_01_12",
            "Validator failed for path `{0}` with value `.1234.1_01_12`",
          ],
          [
            CaseType.Failure,
            "more than four ISCO digits",
            "12345.1_1",
            "Validator failed for path `{0}` with value `12345.1_1`",
          ],
          [
            CaseType.Failure,
            "less than four ISCO digits",
            "123.1_1",
            "Validator failed for path `{0}` with value `123.1_1`",
          ],
          [CaseType.Failure, "ESCO bellow local ", "1234_1.1", "Validator failed for path `{0}` with value `1234_1.1`"],
          [CaseType.Success, "simplest valid code direct bellow ISCO", "1234_1", undefined],
          [CaseType.Success, "simplest valid code direct bellow ESCO", "1234.1_1", undefined],
          [CaseType.Success, "typical valid code bellow ISCO", "1234_01_12", undefined],
          [CaseType.Success, "typical valid code bellow ESCO", "1234.1.2_01_12", undefined],
          [CaseType.Success, "leading zeros", "0001.01.01_01_01", undefined],
          [CaseType.Success, "multiple underscores", "1234.1.2.3.4.5_01_12_02_34_934_23_3_42_12", undefined],
          [CaseType.Success, "long digits after underscores", "1234.1.2_01234_12345", undefined],
        ])(
          `(%s) Validate 'code' when it is %s`,
          (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
            assertCaseForProperty<IOccupationDoc>(OccupationModel, "code", caseType, value, expectedFailureMessage, {
              occupationType: OccupationType.LOCAL,
            });
          }
        );
      });

      test.each([
        ["undefined", undefined],
        ["null", null],
        ["unknown type", "foo"],
      ])(`should fail validation with reason when occupation type is %s `, (desc, givenOccupationType) => {
        const givenOccupation = {
          code: "1234.1", // valid code for ESCO
          occupationType: givenOccupationType, // invalid occupation type
        };
        const actual = new OccupationModel(givenOccupation).validateSync();
        expect(actual?.errors["code"]?.reason).toEqual(new Error("Value of 'occupationType' path is not supported"));
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
          assertCaseForProperty<IOccupationDoc>(OccupationModel, "ESCOUri", caseType, value, expectedFailureMessage);
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
          assertCaseForProperty<IOccupationDoc>(
            OccupationModel,
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
          assertCaseForProperty<IOccupationDoc>(OccupationModel, "altLabels", caseType, value, expectedFailureMessage);
        }
      );
    });

    describe("Test validation of 'scopeNote'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [
          CaseType.Failure,
          "Too long scopeNote",
          getTestString(SCOPE_NOTE_MAX_LENGTH + 1),
          `ScopeNote must be at most ${SCOPE_NOTE_MAX_LENGTH} chars long`,
        ],
        [CaseType.Success, "empty", "", undefined],
        [CaseType.Success, "one character", "a", undefined],
        [CaseType.Success, "only whitespace characters", WHITESPACE, undefined],
        [CaseType.Success, "the longest", getTestString(SCOPE_NOTE_MAX_LENGTH), undefined],
      ])(
        `(%s) Validate 'scopeNote' when it is %s`,
        (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
          assertCaseForProperty<IOccupationDoc>(OccupationModel, "scopeNote", caseType, value, expectedFailureMessage);
        }
      );
    });

    describe("Test validation of 'definition'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [
          CaseType.Failure,
          "Too long definition",
          getTestString(DEFINITION_MAX_LENGTH + 1),
          `Definition must be at most ${DEFINITION_MAX_LENGTH} chars long`,
        ],
        [CaseType.Success, "empty", "", undefined],
        [CaseType.Success, "one character", "a", undefined],
        [CaseType.Success, "only whitespace characters", WHITESPACE, undefined],
        [CaseType.Success, "the longest", getTestString(DEFINITION_MAX_LENGTH), undefined],
      ])(
        `(%s) Validate 'definition' when it is %s`,
        (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
          assertCaseForProperty<IOccupationDoc>(OccupationModel, "definition", caseType, value, expectedFailureMessage);
        }
      );
    });

    describe("Test validation of 'description'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [
          CaseType.Failure,
          "Too long description",
          getTestString(DESCRIPTION_MAX_LENGTH + 1),
          `Description must be at most ${DESCRIPTION_MAX_LENGTH} chars long`,
        ],
        [CaseType.Success, "empty", "", undefined],
        [CaseType.Success, "one character", "a", undefined],
        [CaseType.Success, "only whitespace characters", WHITESPACE, undefined],
        [CaseType.Success, "the longest", getTestString(DESCRIPTION_MAX_LENGTH), undefined],
      ])(
        `(%s) Validate 'description' when it is %s`,
        (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
          assertCaseForProperty<IOccupationDoc>(
            OccupationModel,
            "description",
            caseType,
            value,
            expectedFailureMessage
          );
        }
      );
    });

    describe("Test validation of 'regulatedProfessionNote'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [
          CaseType.Failure,
          "Too long description",
          getTestString(REGULATED_PROFESSION_NOTE_MAX_LENGTH + 1),
          `RegulatedProfessionNote must be at most ${REGULATED_PROFESSION_NOTE_MAX_LENGTH} chars long`,
        ],
        [CaseType.Success, "empty", "", undefined],
        [CaseType.Success, "one character", "a", undefined],
        [CaseType.Success, "only whitespace characters", WHITESPACE, undefined],
        [CaseType.Success, "the longest", getTestString(REGULATED_PROFESSION_NOTE_MAX_LENGTH), undefined],
      ])(
        `(%s) Validate 'regulatedProfessionNote' when it is %s`,
        (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
          assertCaseForProperty<IOccupationDoc>(
            OccupationModel,
            "regulatedProfessionNote",
            caseType,
            value,
            expectedFailureMessage
          );
        }
      );
    });

    describe("Test validation of 'importId'", () => {
      testImportId<IOccupationDoc>(() => OccupationModel);
    });

    describe("Test validation of 'occupationType", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "empty", "", "Path `{0}` is required."],
        [CaseType.Success, "ESCO", OccupationType.ESCO, undefined],
        [CaseType.Success, "LOCAL", OccupationType.LOCAL, undefined],
        [CaseType.Success, "LOCALIZED", OccupationType.LOCALIZED, undefined],
      ])(
        `(%s) Validate 'definition' when it is %s`,
        (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
          assertCaseForProperty<IOccupationDoc>(
            OccupationModel,
            "occupationType",
            caseType,
            value,
            expectedFailureMessage
          );
        }
      );
    });
  });

  test("should have correct indexes", async () => {
    // GIVEN that the indexes exist
    await OccupationModel.createIndexes();

    // WHEN getting the indexes
    const indexes = (await OccupationModel.listIndexes()).map((index) => {
      return { key: index.key, unique: index.unique };
    });

    // THEN expect the indexes to be correct
    expect(indexes).toEqual([
      { key: { _id: 1 }, unique: undefined },
      { key: { UUID: 1 }, unique: true },
      { key: { code: 1, modelId: 1 }, unique: true },
      { key: { modelId: 1 }, unique: undefined },
    ]);
  });
});
