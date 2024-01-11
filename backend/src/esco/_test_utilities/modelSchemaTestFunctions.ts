import mongoose from "mongoose";
import { assertCaseForProperty, CaseType } from "_test_utilities/dataModel";
import { getTestString, WHITESPACE } from "_test_utilities/specialCharacters";
import { IMPORT_ID_MAX_LENGTH } from "esco/common/modelSchema";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { ObjectTypes } from "esco/common/objectTypes";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { randomUUID } from "crypto";

export function testImportId<T>(getModel: () => mongoose.Model<T>) {
  test.each([
    [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
    [CaseType.Failure, "null", null, "Path `{0}` is required."],
    [
      CaseType.Failure,
      "Too long importId",
      getTestString(IMPORT_ID_MAX_LENGTH + 1),
      `{0} must be at most ${IMPORT_ID_MAX_LENGTH} chars long`,
    ],
    [CaseType.Success, "only whitespace characters", WHITESPACE, undefined],
    [CaseType.Success, "empty", "", undefined],
    [CaseType.Success, "one letter", "a", undefined],
    [CaseType.Success, "The longest importId", getTestString(IMPORT_ID_MAX_LENGTH), undefined],
  ])(`(%s) Validate 'importId' when it is %s`, (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
    assertCaseForProperty<T>(getModel(), "importId", caseType, value, expectedFailureMessage);
  });
}

export function testDocModel<T>(
  getModel: () => mongoose.Model<T>,
  fieldName: string,
  acceptedModels: MongooseModelName[]
) {
  const expectedFailingModelsCases = Object.values(MongooseModelName)
    .filter((value) => !acceptedModels.includes(value))
    .map((value) => [
      CaseType.Failure as CaseType,
      value,
      value,
      `\`${value}\` is not a valid enum value for path \`{0}\`.`,
    ]) as [CaseType, string, string, string][];

  const expectedSuccessModelsCases = acceptedModels.map((value) => [
    CaseType.Success as CaseType,
    value,
    value,
    undefined,
  ]) as [CaseType, string, string, undefined][];

  describe(`Test validation of '${fieldName}'`, () => {
    test.each([
      [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
      [CaseType.Failure, "null", null, "Path `{0}` is required."],
      [CaseType.Failure, "only whitespace characters", WHITESPACE, ` is not a valid enum value for path \`{0}\`.`],
      [CaseType.Failure, "random string", "foo", `\`foo\` is not a valid enum value for path \`{0}\`.`],
      [CaseType.Failure, "empty", "", "Path `{0}` is required."],
      ...expectedFailingModelsCases,
      ...expectedSuccessModelsCases,
    ])(
      `(%s) Validate ''${fieldName}' when it is %s`,
      (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<T>(getModel(), fieldName, caseType, value, expectedFailureMessage);
      }
    );
  });
}

export function testObjectType<T>(
  getModel: () => mongoose.Model<T>,
  fieldName: string,
  acceptedObjectTypes: ObjectTypes[]
) {
  const expectedFailingObjectTypeCases = Object.values(ObjectTypes)
    .filter((value) => !acceptedObjectTypes.includes(value))
    .map((value) => [
      CaseType.Failure as CaseType,
      value,
      value,
      `\`${value}\` is not a valid enum value for path \`{0}\`.`,
    ]) as [CaseType, string, string, string][];

  const expectedSuccessObjectTypeCases = acceptedObjectTypes.map((value) => [
    CaseType.Success as CaseType,
    value,
    value,
    undefined,
  ]) as [CaseType, string, string, undefined][];

  describe(`Test validation of '${fieldName}'`, () => {
    test.each([
      [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
      [CaseType.Failure, "null", null, "Path `{0}` is required."],
      [CaseType.Failure, "only whitespace characters", WHITESPACE, ` is not a valid enum value for path \`{0}\`.`],
      [CaseType.Failure, "random string", "foo", `\`foo\` is not a valid enum value for path \`{0}\`.`],
      [CaseType.Failure, "empty", "", "Path `{0}` is required."],
      ...expectedFailingObjectTypeCases,
      ...expectedSuccessObjectTypeCases,
    ])(
      `(%s) Validate ''${fieldName}' when it is %s`,
      (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<T>(getModel(), fieldName, caseType, value, expectedFailureMessage);
      }
    );
  });
}

export function testObjectIdField<T>(getModel: () => mongoose.Model<T>, fieldName: string) {
  return describe(`Test validation of '${fieldName}'`, () => {
    test.each([
      [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
      [CaseType.Failure, "null", null, "Path `{0}` is required."],
      [CaseType.Failure, "empty", "", 'Cast to ObjectId failed for value .* at path "{0}" because of "BSONError"'],
      [
        CaseType.Failure,
        "only whitespace characters",
        WHITESPACE,
        'Cast to ObjectId failed for value .* at path "{0}" because of "BSONError"',
      ],
      [
        CaseType.Failure,
        "not a objectId (string)",
        "foo",
        'Cast to ObjectId failed for value .* at path "{0}" because of "BSONError"',
      ],
      [
        CaseType.Failure,
        "not a objectId (object)",
        { foo: "bar" },
        'Cast to ObjectId failed for value .* at path "{0}" because of "BSONError"',
      ],
      [CaseType.Success, "ObjectID", new mongoose.Types.ObjectId(), undefined],
      [CaseType.Success, "hex 24 chars", getMockStringId(2), undefined],
    ])(
      `(%s) Validate '${fieldName}' when it is %s`,
      (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<T>(getModel(), fieldName, caseType, value, expectedFailureMessage);
      }
    );
  });
}

export function testUUIDField<T>(getModel: () => mongoose.Model<T>) {
  return describe("Test validation of 'UUID'", () => {
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
      assertCaseForProperty<T>(getModel(), "UUID", caseType, value, expectedFailureMessage);
    });
  });
}

export function testUUIDHistoryField<T>(getModel: () => mongoose.Model<T>) {
  return describe("Test validation of 'UUIDHistory'", () => {
    const randomValidUUID = randomUUID();
    test.each([
      [CaseType.Failure, "undefined", undefined, "Path `UUIDHistory` is required."],
      [CaseType.Failure, "null", null, "Path `{0}` is required."],
      [CaseType.Failure, "empty string", "", "Validator failed for path `UUIDHistory` with value ``"],
      [
        CaseType.Failure,
        "only whitespace characters",
        WHITESPACE,
        `Validator failed for path \`{0}\` with value \`${WHITESPACE}\``,
      ],
      [CaseType.Failure, "not a UUID v4", "foo", "Validator failed for path `UUIDHistory` with value `foo`"],
      [
        CaseType.Failure,
        "an array of non UUID strings",
        ["foo", "bar"],
        "Validator failed for path `UUIDHistory` with value `foo,bar`",
      ],
      [
        CaseType.Failure,
        "mixed array of strings and UUIDs",
        [randomValidUUID, "foo"],
        "Validator failed for path `UUIDHistory` with value `" + randomValidUUID + ",foo`",
      ],
      [CaseType.Failure, "empty array", [], "Validator failed for path `UUIDHistory` with value ``"],
      [
        CaseType.Failure,
        "not unique UUIDs",
        [randomValidUUID, randomValidUUID],
        `Validator failed for path \`UUIDHistory\` with value \`${randomValidUUID},${randomValidUUID}\``,
      ],
      [CaseType.Success, "Valid UUID", randomValidUUID, undefined],
      [CaseType.Success, "an array with a single valid UUID", [randomValidUUID], undefined],
      [CaseType.Success, "an array with many valid UUIDs", [randomUUID(), randomUUID(), randomUUID()], undefined],
    ])(
      `(%s) Validate 'UUIDHistory' when it is %s`,
      (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<T>(getModel(), "UUIDHistory", caseType, value, expectedFailureMessage);
      }
    );
  });
}
