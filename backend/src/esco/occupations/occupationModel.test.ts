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
import { getMockRandomISCOGroupCode } from "_test_utilities/mockOccupationGroupCode";
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
        occupationGroupCode: getMockRandomISCOGroupCode(),
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
        occupationGroupCode: getMockRandomISCOGroupCode(),
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
        occupationGroupCode: getMockRandomISCOGroupCode(),
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
        occupationGroupCode: getMockRandomISCOGroupCode(),
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
        occupationGroupCode: getMockRandomISCOGroupCode(),
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
        occupationGroupCode: getMockRandomISCOGroupCode(),
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

      describe("Test validation of 'ISCO OccupationGroupCode' (^\\d{1,4}$)", () => {
        test.each([
          //TODO: in the occupationModel tests, we don't have the 'occupationType' field, so there are some rules that we can not enforce
          // Like for example, the number of digits for ISCO groups SHOULD be limited to 4, but since Local Groups are allowed to have more than 4 digits,
          //  and since we cant tell whether this is an ISCO or Local group, we can't enforce this rule
          // same with rules like
          // [CaseType.Failure, "mixed with letters", "1a23", "Validator failed for path `{0}` with value `1a23`"],
          // [CaseType.Failure, "more than 4 digits", "12345", "Validator failed for path `{0}` with value `12345`"],
          [CaseType.Failure, "negative number", "-123", "Validator failed for path `{0}` with value `-123`"],
          [CaseType.Failure, "decimal number", "12.3", "Validator failed for path `{0}` with value `12.3`"],
          [CaseType.Success, "single digit", "1", undefined],
          [CaseType.Success, "two digits", "12", undefined],
          [CaseType.Success, "three digits", "123", undefined],
          [CaseType.Success, "four digits", "1234", undefined],
          [CaseType.Success, "leading zeros", "0001", undefined],
        ])(
          `(%s) Validate 'ISCO OccupationGroupCode' when it is %s`,
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

      describe("Test validation of 'Local OccupationGroupCode' (^[a-zA-Z]+\\d*$)", () => {
        test.each([
          //TODO: in the occupationModel tests, we don't have the 'occupationType' field, so there are some rules that we can not enforce
          // Like for example, Local groups SHOULD not start with numbers, but since ISCO Groups are allowed to start with a number,
          //  and since we cant tell whether this is an ISCO or Local group, we can't enforce this rule
          // [CaseType.Failure, "starts with number", "123abc", "Validator failed for path `{0}` with value `123abc`"],
          [CaseType.Failure, "special characters", "abc#123", "Validator failed for path `{0}` with value `abc#123`"],
          [CaseType.Failure, "spaces between", "abc 123", "Validator failed for path `{0}` with value `abc 123`"],
          [CaseType.Failure, "underscore", "abc_123", "Validator failed for path `{0}` with value `abc_123`"],
          [CaseType.Success, "letters only", "abc", undefined],
          [CaseType.Success, "mixed case letters only", "aBcDe", undefined],
          [CaseType.Success, "letters followed by digits", "abc123", undefined],
          [CaseType.Success, "single letter", "A", undefined],
          [CaseType.Success, "uppercase with numbers", "ABC123", undefined],
          [CaseType.Success, "single letter with numbers", "X42", undefined],
        ])(
          `(%s) Validate 'Local OccupationGroupCode' when it is %s`,
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

    describe("Test validation of 'code'", () => {
      describe("Test validation of 'code' for ESCO occupations (^\\d{4}(?:.\\d+)+$)", () => {
        test.each([
          // Failure cases
          [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
          [CaseType.Failure, "null", null, "Path `{0}` is required."],
          [CaseType.Failure, "empty", "", "Path `{0}` is required."],
          [
            CaseType.Failure,
            "only whitespace",
            WHITESPACE,
            `Validator failed for path \`{0}\` with value \`${WHITESPACE}\``,
          ],
          [CaseType.Failure, "non-numeric characters", "abc1.2", "Validator failed for path `{0}` with value `abc1.2`"],
          [
            CaseType.Failure,
            "less than 4 initial digits",
            "123.1",
            "Validator failed for path `{0}` with value `123.1`",
          ],
          [
            CaseType.Failure,
            "more than 4 initial digits",
            "12345.1",
            "Validator failed for path `{0}` with value `12345.1`",
          ],
          [CaseType.Failure, "missing dot segment", "1234", "Validator failed for path `{0}` with value `1234`"],
          [CaseType.Failure, "ending with dot", "1234.", "Validator failed for path `{0}` with value `1234.`"],
          [CaseType.Failure, "consecutive dots", "1234..1", "Validator failed for path `{0}` with value `1234..1`"],

          // Success cases
          [CaseType.Success, "minimal valid code", "1234.1", undefined],
          [CaseType.Success, "multiple segments", "1234.1.2.3", undefined],
          [CaseType.Success, "leading zeros", "0001.01.001", undefined],
          [CaseType.Success, "long chain", "1234.1.2.3.4.5.6.7.8.9", undefined],
          [CaseType.Success, "multi-digit segments", "1234.123.456", undefined],
        ])(
          `(%s) Validate 'code' when it is %s`,
          (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
            assertCaseForProperty<IOccupationDoc>({
              model: OccupationModel,
              propertyNames: "code",
              caseType,
              testValue: value,
              expectedFailureMessage,
              dependencies: { occupationType: ObjectTypes.ESCOOccupation },
            });
          }
        );
      });

      describe("Test validation of 'code' for Local occupations", () => {
        describe("ESCO Local format (^\\d{4}(?:\\.\\d+)*(?:_\\d+)+$)", () => {
          test.each([
            // Failure cases
            [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
            [CaseType.Failure, "null", null, "Path `{0}` is required."],
            [CaseType.Failure, "empty", "", "Path `{0}` is required."],
            [
              CaseType.Failure,
              "only whitespace",
              WHITESPACE,
              `Validator failed for path \`{0}\` with value \`${WHITESPACE}\``,
            ],
            [
              CaseType.Failure,
              "missing underscore part",
              "1234.1",
              "Validator failed for path `{0}` with value `1234.1`",
            ],
            [
              CaseType.Failure,
              "invalid initial digits",
              "123.1_1",
              "Validator failed for path `{0}` with value `123.1_1`",
            ],
            [
              CaseType.Failure,
              "ending with underscore",
              "1234.1_",
              "Validator failed for path `{0}` with value `1234.1_`",
            ],
            [
              CaseType.Failure,
              "consecutive underscores",
              "1234.1__1",
              "Validator failed for path `{0}` with value `1234.1__1`",
            ],

            // Success cases
            [CaseType.Success, "minimal valid code", "1234_1", undefined],
            [CaseType.Success, "with ESCO segments", "1234.1.2_1", undefined],
            [CaseType.Success, "multiple underscore segments", "1234.1_1_2_3", undefined],
            [CaseType.Success, "complex valid code", "1234.1.2.3_01_02_03", undefined],
            [CaseType.Success, "leading zeros", "0001.01_001_002", undefined],
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

        describe("Local format ((^[a-zA-Z]+\\d*)(?:_\\d+)+$)", () => {
          test.each([
            // Failure cases
            [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
            [CaseType.Failure, "null", null, "Path `{0}` is required."],
            [CaseType.Failure, "empty", "", "Path `{0}` is required."],
            [
              CaseType.Failure,
              "only whitespace",
              WHITESPACE,
              `Validator failed for path \`{0}\` with value \`${WHITESPACE}\``,
            ],
            [
              CaseType.Failure,
              "missing underscore part",
              "abc123",
              "Validator failed for path `{0}` with value `abc123`",
            ],
            [
              CaseType.Failure,
              "special characters",
              "abc#123_1",
              "Validator failed for path `{0}` with value `abc#123_1`",
            ],
            [CaseType.Failure, "ending with underscore", "abc_", "Validator failed for path `{0}` with value `abc_`"],

            // Success cases
            [CaseType.Success, "letters only with underscore", "abc_1", undefined],
            [CaseType.Success, "letters and numbers with underscore", "abc123_1", undefined],
            [CaseType.Success, "multiple underscore segments", "abc_1_2_3", undefined],
            [CaseType.Success, "mixed case letters", "aBcDe_1", undefined],
            [CaseType.Success, "single letter code", "A_1", undefined],
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
