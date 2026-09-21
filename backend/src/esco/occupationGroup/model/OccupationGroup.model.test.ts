// Suppress chatty console during the tests
import "_test_utilities/consoleMock";

import mongoose, { Connection } from "mongoose";
import { randomUUID } from "crypto";
import { getNewConnection } from "server/connection/newConnection";
import { initializeSchemaAndModel } from "./OccupationGroup.model";
import { getMockObjectId } from "_test_utilities/mockMongoId";
import { generateRandomUrl, getTestString, WHITESPACE } from "_test_utilities/getMockRandomData";
import { DESCRIPTION_MAX_LENGTH, IMPORT_ID_MAX_LENGTH, LABEL_MAX_LENGTH } from "esco/common/modelSchema";
import { assertCaseForProperty, CaseType } from "_test_utilities/dataModel";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getMockRandomISCOGroupCode, getMockRandomLocalGroupCode } from "_test_utilities/mockOccupationGroupCode";
import { IOccupationGroupDoc } from "../_shared/OccupationGroup.types";
import {
  testTranslatedAltLabelsField,
  testEmbeddingStatusField,
  testTranslatedStringField,
  testOptionalImportId,
  testObjectIdField,
  testOriginUri,
  testUUIDField,
  testUUIDHistoryField,
  testEnumField,
} from "esco/_test_utilities/modelSchemaTestFunctions";
import { ObjectTypes } from "esco/common/objectTypes";
import { getFallbackLanguageConfig } from "common/language/fallbackLanguage";

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

  const fallbackDbKeyName = getFallbackLanguageConfig().dbKeyName;
  // Wraps a flat string into a localized sub document keyed by the fallback language, e.g. "Managers" -> { en: "Managers" }.
  const wrapTranslated = (value: string) => ({ [fallbackDbKeyName]: value });

  test.each([
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ])("Successfully validate OccupationGroup with %s", async (description, givenFlatObject: any) => {
    // GIVEN an OccupationGroup document based on the given object, with its translatable fields wrapped as localized
    // sub documents keyed by the fallback language, the shape the schema now stores them as.
    const givenObject = {
      ...givenFlatObject,
      preferredLabel: wrapTranslated(givenFlatObject.preferredLabel),
      altLabels: givenFlatObject.altLabels.map(wrapTranslated),
      description: wrapTranslated(givenFlatObject.description),
    } as IOccupationGroupDoc;
    const givenOccupationGroupDocument = new OccupationGroupModel(givenObject);

    // WHEN validating that given OccupationGroup document
    const actualValidationErrors = givenOccupationGroupDocument.validateSync();

    // THEN expect it to validate without any error
    expect(actualValidationErrors).toBeUndefined();

    // AND the document to be saved successfully
    await givenOccupationGroupDocument.save();

    // AND the toObject() transformation to return the correct properties, with the translatable fields flattened
    // back to the fallback language string, since that is what the schema's transform does.
    expect(givenOccupationGroupDocument.toObject()).toEqual({
      ...givenFlatObject,
      modelId: givenObject.modelId.toString(),
      id: givenOccupationGroupDocument._id.toString(),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });

  test("should round trip a whitespace only value for a field that allows empty values, without turning it into an empty string", async () => {
    // GIVEN an OccupationGroup whose description is translated to whitespace only in the fallback language, which
    // the schema allows (description's TranslatedStringProperty defaults allowEmptyValues to true)
    const givenWhitespaceOnlyValue = "   ";
    const givenObject = {
      UUID: randomUUID(),
      UUIDHistory: [randomUUID()],
      code: getMockRandomISCOGroupCode(),
      preferredLabel: wrapTranslated(getTestString(LABEL_MAX_LENGTH)),
      modelId: getMockObjectId(2),
      originUri: "",
      groupType: ObjectTypes.ISCOGroup,
      altLabels: [],
      description: wrapTranslated(givenWhitespaceOnlyValue),
      importId: "",
    } as unknown as IOccupationGroupDoc;
    const givenOccupationGroupDocument = new OccupationGroupModel(givenObject);

    // WHEN saving and reading the document back
    await givenOccupationGroupDocument.save();
    const actualObject = givenOccupationGroupDocument.toObject();

    // THEN expect description to be returned exactly as stored, not treated as untranslated and defaulted to ""
    expect(actualObject.description).toEqual(givenWhitespaceOnlyValue);
  });

  test("should not drop an altLabels item that lacks the fallback language, e.g. from data written before validation existed", async () => {
    // GIVEN an OccupationGroup saved through the normal, validated path
    const givenObject = {
      UUID: randomUUID(),
      UUIDHistory: [randomUUID()],
      code: getMockRandomISCOGroupCode(),
      preferredLabel: wrapTranslated(getTestString(LABEL_MAX_LENGTH)),
      modelId: getMockObjectId(2),
      originUri: "",
      groupType: ObjectTypes.ISCOGroup,
      altLabels: [wrapTranslated("kept")],
      description: wrapTranslated(""),
      importId: "",
    } as unknown as IOccupationGroupDoc;
    const givenOccupationGroupDocument = new OccupationGroupModel(givenObject);
    await givenOccupationGroupDocument.save();
    // AND its altLabels are rewritten, bypassing mongoose validation, to include an item that lacks the fallback
    // language entirely, e.g. data that predates the validation this schema now enforces at write time
    await OccupationGroupModel.collection.updateOne(
      { _id: givenOccupationGroupDocument._id },
      { $set: { altLabels: [{ [fallbackDbKeyName]: "kept" }, { fr: "sans anglais" }] } }
    );

    // WHEN reading the document back
    const actualDoc = await OccupationGroupModel.findById(givenOccupationGroupDocument._id).exec();
    const actualObject = actualDoc!.toObject();

    // THEN expect both items to be present, the one lacking the fallback language read as an empty string rather
    // than being silently dropped from the array
    expect(actualObject.altLabels).toEqual(["kept", ""]);
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

    testTranslatedStringField<IOccupationGroupDoc>(() => OccupationGroupModel, "description", DESCRIPTION_MAX_LENGTH);

    testOriginUri<IOccupationGroupDoc>(() => OccupationGroupModel);

    testTranslatedStringField<IOccupationGroupDoc>(
      () => OccupationGroupModel,
      "preferredLabel",
      LABEL_MAX_LENGTH,
      false
    );

    testTranslatedAltLabelsField<IOccupationGroupDoc>(() => OccupationGroupModel);

    testEmbeddingStatusField<IOccupationGroupDoc>(() => OccupationGroupModel);

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
