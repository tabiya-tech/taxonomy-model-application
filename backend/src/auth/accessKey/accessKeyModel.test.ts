// Suppress chatty console during the tests
import "_test_utilities/consoleMock";

import mongoose, { Connection } from "mongoose";

import AuthAPISpecs from "api-specifications/auth";

import { getNewConnection } from "server/connection/newConnection";
import { INDEX_FOR_KEY_TYPE_AND_ID, initializeSchemaAndModel } from "./accessKeyModel";
import { AccessKeyType, IAccessKeyDoc } from "./accessKey.types";

import { getTestString, WHITESPACE } from "_test_utilities/getMockRandomData";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { assertCaseForProperty, CaseType } from "_test_utilities/dataModel";

describe("Test the definition of the Access Key Model", () => {
  let dbConnection: Connection;
  let AccessKeyModel: mongoose.Model<IAccessKeyDoc>;
  beforeAll(async () => {
    // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("AccessKeyModelTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    // initialize the schema and model
    AccessKeyModel = initializeSchemaAndModel(dbConnection);
  });

  afterAll(async () => {
    if (dbConnection) {
      await dbConnection.dropDatabase();
      await dbConnection.close();
    }
  });

  test.each([
    [
      "mandatory fields API_KEY",
      {
        keyType: AccessKeyType.API_KEY,
        keyId: getTestString(10),
        role: AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER,
      } as IAccessKeyDoc,
    ],
    [
      "mandatory fields M2M_CLIENT_ID",
      {
        keyType: AccessKeyType.M2M_CLIENT_ID,
        keyId: getTestString(10),
        role: AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER,
      } as IAccessKeyDoc,
    ],
  ])("Successfully validate Access Key with %s", async (_, givenObject: IAccessKeyDoc) => {
    // GIVEN an access key document based on the given object
    const givenDocument = new AccessKeyModel(givenObject);

    // WHEN validating that given document
    const actualValidationErrors = givenDocument.validateSync();

    // THEN expect it to validate without any error
    expect(actualValidationErrors).toBeUndefined();

    // AND the document to be saved successfully
    await givenDocument.save();

    // AND the toObject() transformation to return the correct properties
    expect(givenDocument.toObject()).toEqual({
      ...givenObject,
      id: givenDocument._id.toString(),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });

  describe("Test validation of 'keyType'", () => {
    test.each([
      [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
      [CaseType.Failure, "null", null, "Path `{0}` is required."],
      [CaseType.Failure, "only whitespace characters", WHITESPACE, ` is not a valid enum value for path \`{0}\`.`],
      [CaseType.Failure, "random string", "foo", `\`foo\` is not a valid enum value for path \`{0}\`.`],
      [CaseType.Failure, "empty", "", "Path `{0}` is required."],
      [CaseType.Success, AccessKeyType.API_KEY, AccessKeyType.API_KEY, undefined],
      [CaseType.Success, AccessKeyType.M2M_CLIENT_ID, AccessKeyType.M2M_CLIENT_ID, undefined],
    ])(
      `(%s) Validate 'keyType' when it is '%s'`,
      (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<IAccessKeyDoc>({
          model: AccessKeyModel,
          propertyNames: "keyType",
          caseType,
          testValue: value,
          expectedFailureMessage,
        });
      }
    );
  });

  describe("Validate Access Key fields", () => {
    describe("Test validation of 'role'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "only whitespace characters", WHITESPACE, ` is not a valid enum value for path \`{0}\`.`],
        [CaseType.Failure, "random string", "foo", `\`foo\` is not a valid enum value for path \`{0}\`.`],
        [CaseType.Failure, "empty", "", "Path `{0}` is required."],
        [
          CaseType.Success,
          AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER,
          AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER,
          undefined,
        ],
        [
          CaseType.Success,
          AuthAPISpecs.Enums.TabiyaRoles.REGISTERED_USER,
          AuthAPISpecs.Enums.TabiyaRoles.REGISTERED_USER,
          undefined,
        ],
        [
          CaseType.Success,
          AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS,
          AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS,
          undefined,
        ],
      ])(
        `(%s) Validate 'role' when it is '%s'`,
        (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
          assertCaseForProperty<IAccessKeyDoc>({
            model: AccessKeyModel,
            propertyNames: "role",
            caseType,
            testValue: value,
            expectedFailureMessage,
          });
        }
      );
    });
  });

  describe("Test validation of 'keyId'", () => {
    test.each([
      [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
      [CaseType.Failure, "null", null, "Path `{0}` is required."],
      [
        CaseType.Failure,
        "Too long definition",
        getTestString(AuthAPISpecs.Constants.KEY_ID_MAX_LENGTH + 1),
        `Key Id must be at most ${AuthAPISpecs.Constants.KEY_ID_MAX_LENGTH} chars long`,
      ],
      [CaseType.Success, "empty", "", undefined],
      [CaseType.Success, "one character", "a", undefined],
      [CaseType.Success, "only whitespace characters", WHITESPACE, undefined],
      [CaseType.Success, "the longest", getTestString(AuthAPISpecs.Constants.KEY_ID_MAX_LENGTH), undefined],
    ])(`(%s) Validate 'keyId' when it is %s`, (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
      assertCaseForProperty<IAccessKeyDoc>({
        model: AccessKeyModel,
        propertyNames: "keyId",
        caseType,
        testValue: value,
        expectedFailureMessage,
      });
    });
  });

  test("should have correct indexes", async () => {
    // GIVEN that the indexes exist
    await AccessKeyModel.createIndexes();

    // WHEN getting the indexes
    const indexes = (await AccessKeyModel.listIndexes()).map((index) => {
      return { key: index.key, unique: index.unique };
    });

    // THEN expect the indexes to be correct
    expect(indexes).toIncludeSameMembers([
      { key: { _id: 1 }, unique: undefined },
      { key: INDEX_FOR_KEY_TYPE_AND_ID, unique: true },
    ]);
  });
});
