// Suppress chatty console during the tests
import "_test_utilities/consoleMock";

import mongoose, { Connection } from "mongoose";
import { randomUUID } from "crypto";
import { getNewConnection } from "server/connection/newConnection";
import {
  INDEX_FOR_FIND_MODEL_OCCUPATION_TYPE,
  INDEX_FOR_UNIQUE_CODE,
  INDEX_FOR_UUID,
  INDEX_FOR_UUID_HISTORY,
  initializeSchemaAndModel,
} from "./occupationModel";
import { getMockObjectId } from "_test_utilities/mockMongoId";
import { generateRandomUrl, getTestString, WHITESPACE } from "_test_utilities/getMockRandomData";
import {
  DEFINITION_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  IMPORT_ID_MAX_LENGTH,
  LABEL_MAX_LENGTH,
  REGULATED_PROFESSION_NOTE_MAX_LENGTH,
  SCOPE_NOTE_MAX_LENGTH,
} from "esco/common/modelSchema";
import { assertCaseForProperty, CaseType } from "_test_utilities/dataModel";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getMockRandomOccupationCode } from "_test_utilities/mockOccupationCode";
import { getMockRandomOccupationGroupCode } from "_test_utilities/mockOccupationGroupCode";
import { IOccupationDoc } from "./occupation.types";
import {
  testAltLabelsField,
  testDescription,
  testImportId,
  testObjectIdField,
  testObjectType,
  testOriginUri,
  testPreferredLabel,
  testUUIDField,
  testUUIDHistoryField,
} from "esco/_test_utilities/modelSchemaTestFunctions";
import { ObjectTypes } from "esco/common/objectTypes";

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
        UUIDHistory: [randomUUID()],
        originUri: generateRandomUrl(),
        altLabels: [getTestString(LABEL_MAX_LENGTH, "Label_1"), getTestString(LABEL_MAX_LENGTH, "Label_2")],
        description: getTestString(DESCRIPTION_MAX_LENGTH),
        occupationGroupCode: getMockRandomOccupationGroupCode(),
        definition: getTestString(DEFINITION_MAX_LENGTH),
        scopeNote: getTestString(SCOPE_NOTE_MAX_LENGTH),
        regulatedProfessionNote: getTestString(REGULATED_PROFESSION_NOTE_MAX_LENGTH),
        importId: getTestString(IMPORT_ID_MAX_LENGTH),
        occupationType: ObjectTypes.ESCOOccupation,
        isLocalized: false,
      } as IOccupationDoc,
    ],
    [
      "optional fields ESCO occupation",
      {
        UUID: randomUUID(),
        code: getMockRandomOccupationCode(false),
        preferredLabel: getTestString(LABEL_MAX_LENGTH),
        modelId: getMockObjectId(2),
        UUIDHistory: [randomUUID()],
        originUri: "",
        altLabels: [],
        description: "",
        occupationGroupCode: getMockRandomOccupationGroupCode(),
        definition: "",
        scopeNote: "",
        regulatedProfessionNote: "",
        importId: getTestString(IMPORT_ID_MAX_LENGTH),
        occupationType: ObjectTypes.ESCOOccupation,
        isLocalized: false,
      } as IOccupationDoc,
    ],
    [
      "mandatory fields ESCO Localised occupation",
      {
        UUID: randomUUID(),
        code: getMockRandomOccupationCode(false),
        preferredLabel: getTestString(LABEL_MAX_LENGTH),
        modelId: getMockObjectId(2),
        UUIDHistory: [randomUUID()],
        originUri: generateRandomUrl(),
        altLabels: [getTestString(LABEL_MAX_LENGTH, "Label_1"), getTestString(LABEL_MAX_LENGTH, "Label_2")],
        description: getTestString(DESCRIPTION_MAX_LENGTH),
        occupationGroupCode: getMockRandomOccupationGroupCode(),
        definition: getTestString(DEFINITION_MAX_LENGTH),
        scopeNote: getTestString(SCOPE_NOTE_MAX_LENGTH),
        regulatedProfessionNote: getTestString(REGULATED_PROFESSION_NOTE_MAX_LENGTH),
        importId: getTestString(IMPORT_ID_MAX_LENGTH),
        occupationType: ObjectTypes.ESCOOccupation,
        isLocalized: true,
      } as IOccupationDoc,
    ],
    [
      "optional fields ESCO Localised occupation",
      {
        UUID: randomUUID(),
        code: getMockRandomOccupationCode(false),
        preferredLabel: getTestString(LABEL_MAX_LENGTH),
        modelId: getMockObjectId(2),
        UUIDHistory: [randomUUID()],
        originUri: "",
        altLabels: [],
        description: "",
        occupationGroupCode: getMockRandomOccupationGroupCode(),
        definition: "",
        scopeNote: "",
        regulatedProfessionNote: "",
        importId: getTestString(IMPORT_ID_MAX_LENGTH),
        occupationType: ObjectTypes.ESCOOccupation,
        isLocalized: true,
      } as IOccupationDoc,
    ],
    [
      "mandatory fields local occupation",
      {
        UUID: randomUUID(),
        code: getMockRandomOccupationCode(true),
        preferredLabel: getTestString(LABEL_MAX_LENGTH),
        modelId: getMockObjectId(2),
        UUIDHistory: [randomUUID()],
        originUri: generateRandomUrl(),
        altLabels: [getTestString(LABEL_MAX_LENGTH, "Label_1"), getTestString(LABEL_MAX_LENGTH, "Label_2")],
        description: getTestString(DESCRIPTION_MAX_LENGTH),
        occupationGroupCode: getMockRandomOccupationGroupCode(),
        definition: getTestString(DEFINITION_MAX_LENGTH),
        scopeNote: getTestString(SCOPE_NOTE_MAX_LENGTH),
        regulatedProfessionNote: getTestString(REGULATED_PROFESSION_NOTE_MAX_LENGTH),
        importId: getTestString(IMPORT_ID_MAX_LENGTH),
        occupationType: ObjectTypes.LocalOccupation,
        isLocalized: false,
      } as IOccupationDoc,
    ],
    [
      "optional fields Local occupation",
      {
        UUID: randomUUID(),
        code: getMockRandomOccupationCode(true),
        preferredLabel: getTestString(LABEL_MAX_LENGTH),
        modelId: getMockObjectId(2),
        UUIDHistory: [randomUUID()],
        originUri: "",
        altLabels: [],
        description: "",
        occupationGroupCode: getMockRandomOccupationGroupCode(),
        definition: "",
        scopeNote: "",
        regulatedProfessionNote: "",
        importId: getTestString(IMPORT_ID_MAX_LENGTH),
        occupationType: ObjectTypes.LocalOccupation,
        isLocalized: false,
      } as IOccupationDoc,
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

    testUUIDField<IOccupationDoc>(() => OccupationModel);

    testUUIDHistoryField<IOccupationDoc>(() => OccupationModel);

    describe("Test validation of 'code'", () => {});

    describe("Test validation of 'OccupationGroupCode'", () => {
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
      ])(
        `(%s) Validate 'OccupationGroupCode' when it is %s`,
        (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
          assertCaseForProperty<IOccupationDoc>({
            model: OccupationModel,
            propertyNames: "occupationGroupCode",
            caseType,
            testValue: value,
            expectedFailureMessage,
          });
        }
      );
      describe("Test validation of 'isco OccupationGroupCode'", () => {
        test.each([
          [CaseType.Failure, "more than 4 digits", "55555", "Validator failed for path `{0}` with value `55555`"],
          [CaseType.Failure, "with negative sign", "-9999", "Validator failed for path `{0}` with value `-9999`"],
          [CaseType.Success, "0", "0", undefined],
          [CaseType.Success, "max", "9999", undefined],
          [CaseType.Success, "leading zero", "0009", undefined],
          [CaseType.Success, "in range", "090", undefined],
        ])(
          `(%s) Validate 'OccupationGroupCode' when it is %s`,
          (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
            assertCaseForProperty<IOccupationDoc>({
              model: OccupationModel,
              propertyNames: "occupationGroupCode",
              caseType,
              testValue: value,
              expectedFailureMessage,
            });
          }
        );
      });
      describe("Test validation of 'icatus OccupationGroupCode'", () => {
        test.each([
          [CaseType.Failure, "more than 4 digits", "I55555", "Validator failed for path `{0}` with value `I55555`"],
          [CaseType.Failure, "with negative sign", "-I9999", "Validator failed for path `{0}` with value `-I9999`"],
          [CaseType.Failure, "with negative digits", "I-9999", "Validator failed for path `{0}` with value `I-9999`"],
          [CaseType.Success, "I0", "0", undefined],
          [CaseType.Success, "max", "I9999", undefined],
          [CaseType.Success, "leading zero", "I0009", undefined],
          [CaseType.Success, "in range", "I090", undefined],
        ])(
          `(%s) Validate 'OccupationGroupCode' when it is %s`,
          (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
            assertCaseForProperty<IOccupationDoc>({
              model: OccupationModel,
              propertyNames: "occupationGroupCode",
              caseType,
              testValue: value,
              expectedFailureMessage,
            });
          }
        );
      });
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
            assertCaseForProperty<IOccupationDoc>({
              model: OccupationModel,
              propertyNames: "code",
              caseType,
              testValue: value,
              expectedFailureMessage,
              dependencies: {
                occupationType: ObjectTypes.ESCOOccupation,
              },
            });
          }
        );
      });

      describe("Test validation of 'code' for Local ISCO occupations", () => {
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
            assertCaseForProperty<IOccupationDoc>({
              model: OccupationModel,
              propertyNames: "code",
              caseType,
              testValue: value,
              expectedFailureMessage,
              dependencies: { occupationType: ObjectTypes.LocalOccupation },
            });
          }
        );
      });

      describe("Test validation of 'code' for Local ICATUS occupations", () => {
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
          [CaseType.Failure, "not matching pattern", "Ifoo1_2", "Validator failed for path `{0}` with value `Ifoo1_2`"],
          [
            CaseType.Failure,
            "extra characters",
            "I1234.1_1x",
            "Validator failed for path `{0}` with value `I1234.1_1x`",
          ],
          [
            CaseType.Failure,
            "inconsistent ESCO segment",
            "I1234._01_12",
            "Validator failed for path `{0}` with value `I1234._01_12`",
          ],
          [CaseType.Failure, "only underscores", "____", "Validator failed for path `{0}` with value `____`"],
          [
            CaseType.Failure,
            "ISCO Missing segment",
            "I.1234.1_01_12",
            "Validator failed for path `{0}` with value `I.1234.1_01_12`",
          ],
          [
            CaseType.Failure,
            "more than four ISCO digits",
            "I12345.1_1",
            "Validator failed for path `{0}` with value `I12345.1_1`",
          ],
          [
            CaseType.Failure,
            "less than four ISCO digits",
            "I123.1_1",
            "Validator failed for path `{0}` with value `I123.1_1`",
          ],
          [
            CaseType.Failure,
            "we have points/dots",
            "I1234.1.1",
            "Validator failed for path `{0}` with value `I1234.1.1`",
          ],
          [
            CaseType.Failure,
            "ESCO bellow local ",
            "I1234_1.1",
            "Validator failed for path `{0}` with value `I1234_1.1`",
          ],
          [
            CaseType.Failure,
            "small I ('i') is not allowed for code",
            "i1234_1",
            "Validator failed for path `{0}` with value `i1234_1`",
          ],
          [CaseType.Success, "simplest valid code direct bellow ISCO", "I1234_1", undefined],
          [CaseType.Success, "simplest valid code direct bellow ESCO", "I12_1", undefined],
          [CaseType.Success, "typical valid code bellow ISCO", "I1234_01", undefined],
          [CaseType.Success, "leading zeros", "I000_01", undefined],
        ])(
          `(%s) Validate 'code' when it is %s`,
          (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
            assertCaseForProperty<IOccupationDoc>({
              model: OccupationModel,
              propertyNames: "code",
              caseType,
              testValue: value,
              expectedFailureMessage,
              dependencies: { occupationType: ObjectTypes.LocalOccupation },
            });
          }
        );
      });

      test.each([
        ["undefined", undefined],
        ["null", null],
        ["unknown type", "foo"],
        [ObjectTypes.ISCOGroup, ObjectTypes.ISCOGroup],
        [ObjectTypes.LocalGroup, ObjectTypes.LocalGroup],
        [ObjectTypes.SkillGroup, ObjectTypes.SkillGroup],
        [ObjectTypes.Skill, ObjectTypes.Skill],
      ])(`should fail validation with reason when occupation type is %s `, (desc, givenOccupationType) => {
        const givenOccupation = {
          code: "1234.1", // valid code for ESCO
          occupationType: givenOccupationType, // invalid occupation type
        };
        assertCaseForProperty({
          model: OccupationModel,
          propertyNames: "code",
          caseType: CaseType.Failure,
          testValue: givenOccupation.code,
          expectedFailureMessage: "Validator failed for path `code` with value `1234.1`",
          expectedFailureReason: "Value of 'occupationType' path is not supported",
        });
      });
    });

    testPreferredLabel<IOccupationDoc>(() => OccupationModel);

    testAltLabelsField<IOccupationDoc>(() => OccupationModel);

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
          assertCaseForProperty<IOccupationDoc>({
            model: OccupationModel,
            propertyNames: "scopeNote",
            caseType,
            testValue: value,
            expectedFailureMessage,
          });
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
          assertCaseForProperty<IOccupationDoc>({
            model: OccupationModel,
            propertyNames: "definition",
            caseType,
            testValue: value,
            expectedFailureMessage,
          });
        }
      );
    });

    testOriginUri<IOccupationDoc>(() => OccupationModel);

    testDescription<IOccupationDoc>(() => OccupationModel);

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
          assertCaseForProperty<IOccupationDoc>({
            model: OccupationModel,
            propertyNames: "regulatedProfessionNote",
            caseType,
            testValue: value,
            expectedFailureMessage,
          });
        }
      );
    });

    testImportId<IOccupationDoc>(() => OccupationModel);

    testObjectType(() => OccupationModel, "occupationType", [ObjectTypes.ESCOOccupation, ObjectTypes.LocalOccupation], {
      isLocalized: false,
    });

    describe("Test validation of 'occupationType'", () => {
      test("(Failure) Validate 'occupationType' when it is LocalOccupation and isLocalized = true", () => {
        // GIVEN an LocalOccupation that is set to isLocalized = true
        const givenOccupation = {
          occupationType: ObjectTypes.LocalOccupation,
          isLocalized: true,
        };
        assertCaseForProperty({
          model: OccupationModel,
          propertyNames: "occupationType",
          caseType: CaseType.Failure,
          testValue: givenOccupation.occupationType,
          expectedFailureMessage: `Validator failed for path \`occupationType\` with value \`${ObjectTypes.LocalOccupation}\``,
          expectedFailureReason:
            "Value of `occupationType` is not compatible with value of `isLocalized`. Local occupations cannot be localised",
          dependencies: { occupationType: ObjectTypes.LocalOccupation, isLocalized: true },
        });
      });
    });

    describe("Test validation of 'isLocalized'", () => {
      describe("Test validation of 'isLocalized' for ESCO occupations", () => {
        test.each([
          [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
          [CaseType.Failure, "null", null, "Path `{0}` is required."],
          [CaseType.Failure, "not boolean", "foo", 'Cast to Boolean failed .* path "{0}"'],
          [CaseType.Success, "true", true, undefined],
          [CaseType.Success, "false", false, undefined],
        ])(
          "(%s) Validate 'isLocalized' when it is %s",
          (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
            assertCaseForProperty<IOccupationDoc>({
              model: OccupationModel,
              propertyNames: "isLocalized",
              caseType,
              testValue: value,
              expectedFailureMessage,
              dependencies: {
                occupationType: ObjectTypes.ESCOOccupation,
              },
            });
          }
        );
      });

      describe("Test validation of 'isLocalized' for Local occupations", () => {
        test.each([
          [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
          [CaseType.Failure, "null", null, "Path `{0}` is required."],
          [CaseType.Failure, "not boolean", "foo", 'Cast to Boolean failed .* path "{0}"'],
          [CaseType.Success, "false", false, undefined],
        ])(
          "(%s) Validate 'isLocalized' when it is %s",
          (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
            assertCaseForProperty<IOccupationDoc>({
              model: OccupationModel,
              propertyNames: "isLocalized",
              caseType,
              testValue: value,
              expectedFailureMessage,
              dependencies: {
                occupationType: ObjectTypes.LocalOccupation,
              },
            });
          }
        );
        test("(Failure) Validate 'isLocalized' when it is true", () => {
          // GIVEN an LocalOccupation that is set to isLocalized = true
          assertCaseForProperty({
            model: OccupationModel,
            propertyNames: "isLocalized",
            caseType: CaseType.Failure,
            testValue: true,
            expectedFailureMessage: "Validator failed for path `isLocalized` with value `true`",
            expectedFailureReason: "Local occupations cannot be localised",
            dependencies: { occupationType: ObjectTypes.LocalOccupation },
          });
        });
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
      expect(indexes).toIncludeSameMembers([
        { key: { _id: 1 }, unique: undefined },
        { key: INDEX_FOR_UUID, unique: true },
        { key: INDEX_FOR_UUID_HISTORY, unique: undefined },
        { key: INDEX_FOR_UNIQUE_CODE, unique: true },
        { key: INDEX_FOR_FIND_MODEL_OCCUPATION_TYPE, unique: undefined },
      ]);
    });
  });
});
