// Suppress chatty console during the tests
import "_test_utilities/consoleMock";

import mongoose, { Connection } from "mongoose";
import { randomUUID } from "crypto";
import { getNewConnection } from "server/connection/newConnection";
import { getMockObjectId } from "_test_utilities/mockMongoId";
import { getTestString } from "_test_utilities/specialCharacters";
import { DESCRIPTION_MAX_LENGTH, IMPORT_ID_MAX_LENGTH, LABEL_MAX_LENGTH } from "esco/common/modelSchema";
import { assertCaseForProperty, CaseType } from "_test_utilities/dataModel";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import {
  testAltLabelsField,
  testDescription,
  testImportId,
  testObjectIdField,
  testUUIDField,
  testUUIDHistoryField,
} from "esco/_test_utilities/modelSchemaTestFunctions";
import { OccupationType } from "esco/common/objectTypes";
import { ILocalizedOccupationDoc } from "./localizedOccupation.types";
import { initializeSchemaAndModel } from "./localizedOccupationModel";

describe("Test the definition of the Localized Occupation Model", () => {
  let dbConnection: Connection;
  let LocalizedOccupationModel: mongoose.Model<ILocalizedOccupationDoc>;
  beforeAll(async () => {
    // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("LocalizedOccupationModelTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    // initialize the schema and model
    LocalizedOccupationModel = initializeSchemaAndModel(dbConnection);
  });

  afterAll(async () => {
    if (dbConnection) {
      await dbConnection.dropDatabase();
      await dbConnection.close();
    }
  });

  beforeEach(async () => {
    await LocalizedOccupationModel.deleteMany({}).exec();
  });

  test.each([
    [
      "mandatory fields",
      {
        UUID: randomUUID(),
        UUIDHistory: [randomUUID()],
        modelId: getMockObjectId(2),
        altLabels: [getTestString(LABEL_MAX_LENGTH, "Label_1"), getTestString(LABEL_MAX_LENGTH, "Label_2")],
        description: getTestString(DESCRIPTION_MAX_LENGTH),
        importId: getTestString(IMPORT_ID_MAX_LENGTH),
        occupationType: OccupationType.LOCALIZED,
        localizesOccupationId: getMockObjectId(3),
      },
    ],
    [
      "optional fields",
      {
        UUID: randomUUID(),
        UUIDHistory: [randomUUID()],
        modelId: getMockObjectId(2),
        altLabels: [],
        description: "",
        importId: getTestString(IMPORT_ID_MAX_LENGTH),
        occupationType: OccupationType.LOCALIZED,
        localizesOccupationId: getMockObjectId(3),
      },
    ],
  ])(
    "Successfully validate Localized Occupation with %s",
    async (description, givenObject: ILocalizedOccupationDoc) => {
      // GIVEN a Localized Occupation document based on the given object
      const givenLocalizedOccupationDocument = new LocalizedOccupationModel(givenObject);

      // WHEN validating that given localized occupation document
      const actualValidationErrors = givenLocalizedOccupationDocument.validateSync();

      // THEN expect it to validate without any error
      expect(actualValidationErrors).toBeUndefined();

      // AND the document to be saved successfully
      await givenLocalizedOccupationDocument.save();

      // AND the toObject() transformation to return the correct properties
      const expectedLocalizedOccupationDocument = {
        ...givenObject,
        modelId: givenObject.modelId.toString(),
        id: givenLocalizedOccupationDocument._id.toString(),
        localizesOccupationId: givenObject.localizesOccupationId.toString(),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };
      expect(givenLocalizedOccupationDocument.toObject()).toEqual(expectedLocalizedOccupationDocument);
    }
  );

  describe("Validate Localized Occupation fields", () => {
    testObjectIdField<ILocalizedOccupationDoc>(() => LocalizedOccupationModel, "modelId");

    testObjectIdField<ILocalizedOccupationDoc>(() => LocalizedOccupationModel, "localizesOccupationId");

    testUUIDField<ILocalizedOccupationDoc>(() => LocalizedOccupationModel);

    testUUIDHistoryField<ILocalizedOccupationDoc>(() => LocalizedOccupationModel);

    testAltLabelsField<ILocalizedOccupationDoc>(() => LocalizedOccupationModel);

    testDescription<ILocalizedOccupationDoc>(() => LocalizedOccupationModel);

    testImportId<ILocalizedOccupationDoc>(() => LocalizedOccupationModel);

    describe("Test validation of 'occupationType", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Success, "ESCO", OccupationType.ESCO, undefined],
        [CaseType.Success, "LOCAL", OccupationType.LOCAL, undefined],
        [CaseType.Success, "LOCALIZED", OccupationType.LOCALIZED, undefined],
      ])(
        `(%s) Validate 'definition' when it is %s`,
        (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
          assertCaseForProperty<ILocalizedOccupationDoc>({
            model: LocalizedOccupationModel,
            propertyNames: "occupationType",
            caseType,
            testValue: value,
            expectedFailureMessage,
          });
        }
      );
    });
  });

  test("should have correct indexes", async () => {
    // GIVEN that the indexes exist
    await LocalizedOccupationModel.createIndexes();

    // WHEN getting the indexes
    const indexes = (await LocalizedOccupationModel.listIndexes()).map((index) => {
      return { key: index.key, unique: index.unique };
    });

    // THEN the indexes to be correct
    expect(indexes).toIncludeSameMembers([
      { key: { _id: 1 }, unique: undefined },
      { key: { UUID: 1 }, unique: true },
      {
        key: {
          modelId: 1,
          localizesOccupationId: 1,
        },
        unique: true,
      },
      { key: { UUIDHistory: 1 }, unique: undefined },
    ]);
  });
});
