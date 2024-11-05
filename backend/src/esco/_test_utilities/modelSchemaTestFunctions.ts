import mongoose from "mongoose";
import { assertCaseForProperty, CaseType } from "_test_utilities/dataModel";
import { getRandomString, getTestString, WHITESPACE } from "_test_utilities/getMockRandomData";
import {
  ATL_LABELS_MAX_ITEMS,
  DESCRIPTION_MAX_LENGTH,
  IMPORT_ID_MAX_LENGTH,
  LABEL_MAX_LENGTH,
  ORIGIN_URI_MAX_LENGTH,
  UUID_HISTORY_MAX_ITEMS,
} from "esco/common/modelSchema";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { ObjectTypes } from "esco/common/objectTypes";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { randomUUID } from "crypto";

export function testImportId<T>(getModel: () => mongoose.Model<T>) {
  return describe("Test validation of 'importId'", () => {
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
    ])(
      `(%s) Validate 'importId' when it is %s`,
      (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<T>({
          model: getModel(),
          propertyNames: "importId",
          caseType,
          testValue: value,
          expectedFailureMessage,
        });
      }
    );
  });
}

export function getStdDocModelFailureTestCases(
  acceptedModels: MongooseModelName[]
): [CaseType, string, string | null | undefined, string][] {
  const expectedFailingModelsCases = Object.values(MongooseModelName)
    .filter((value) => !acceptedModels.includes(value))
    .map((value) => [
      CaseType.Failure as CaseType,
      value,
      value,
      `\`${value}\` is not a valid enum value for path \`{0}\`.`,
    ]) as [CaseType, string, string, string][];
  return [
    [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
    [CaseType.Failure, "null", null, "Path `{0}` is required."],
    [CaseType.Failure, "only whitespace characters", WHITESPACE, ` is not a valid enum value for path \`{0}\`.`],
    [CaseType.Failure, "random string", "foo", `\`foo\` is not a valid enum value for path \`{0}\`.`],
    [CaseType.Failure, "empty", "", "Path `{0}` is required."],
    ...expectedFailingModelsCases,
  ];
}

export function testDocModel<T>(
  getModel: () => mongoose.Model<T>,
  fieldName: string,
  acceptedModels: MongooseModelName[]
) {
  const expectedFailingModelsCases = getStdDocModelFailureTestCases(acceptedModels);
  const expectedSuccessModelsCases = acceptedModels.map((value) => [
    CaseType.Success as CaseType,
    value,
    value,
    undefined,
  ]) as [CaseType, string, string, undefined][];

  describe(`Test validation of '${fieldName}'`, () => {
    test.each([...expectedFailingModelsCases, ...expectedSuccessModelsCases])(
      `(%s) Validate ''${fieldName}' when it is %s`,
      (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<T>({
          model: getModel(),
          propertyNames: fieldName,
          caseType,
          testValue: value,
          expectedFailureMessage,
        });
      }
    );
  });
}

export function testObjectType<T>(
  getModel: () => mongoose.Model<T>,
  fieldName: string,
  acceptedObjectTypes: ObjectTypes[],
  dependencies?: Partial<T>
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
        assertCaseForProperty({
          model: getModel(),
          propertyNames: fieldName,
          caseType,
          testValue: value,
          expectedFailureMessage,
          dependencies,
        });
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
        assertCaseForProperty({
          model: getModel(),
          propertyNames: fieldName,
          caseType,
          testValue: value,
          expectedFailureMessage,
        });
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
      assertCaseForProperty<T>({
        model: getModel(),
        propertyNames: "UUID",
        caseType,
        testValue: value,
        expectedFailureMessage,
      });
    });
  });
}

export function testUUIDHistoryField<T>(getModel: () => mongoose.Model<T>) {
  return describe("Test validation of 'UUIDHistory'", () => {
    const randomValidUUID = randomUUID();
    test.each([
      [CaseType.Failure, "undefined", undefined, "Path `UUIDHistory` is required.", undefined],
      [CaseType.Failure, "null", null, "Path `{0}` is required.", undefined],
      [
        CaseType.Failure,
        "empty string",
        "",
        "Validator failed for path `UUIDHistory` with value ``",
        "UUIDHistory must be an array of valid UUIDs",
      ],
      [
        CaseType.Failure,
        "only whitespace characters",
        WHITESPACE,
        `Validator failed for path \`{0}\` with value \`${WHITESPACE}\``,
        "UUIDHistory must be an array of valid UUIDs",
      ],
      [
        CaseType.Failure,
        "not a UUID v4",
        "foo",
        "Validator failed for path `UUIDHistory` with value `foo`",
        "UUIDHistory must be an array of valid UUIDs",
      ],
      [
        CaseType.Failure,
        "an array of non UUID strings",
        ["foo", "bar"],
        "Validator failed for path `UUIDHistory` with value `foo,bar`",
        "UUIDHistory must be an array of valid UUIDs",
      ],
      [
        CaseType.Failure,
        "mixed array of strings and UUIDs",
        [randomValidUUID, "foo"],
        "Validator failed for path `UUIDHistory` with value `" + randomValidUUID + ",foo`",
        "UUIDHistory must be an array of valid UUIDs",
      ],
      [
        CaseType.Failure,
        "empty array",
        [],
        "Validator failed for path `UUIDHistory` with value ``",
        "UUIDHistory must be a non empty array",
      ],
      [
        CaseType.Failure,
        "not unique UUIDs",
        [randomValidUUID, randomValidUUID],
        `Validator failed for path \`UUIDHistory\` with value \`${randomValidUUID},${randomValidUUID}\``,
        "Duplicate UUID found",
      ],
      [
        CaseType.Failure,
        "an array with too many UUIDs",
        new Array(UUID_HISTORY_MAX_ITEMS + 1).fill(undefined).map(() => randomUUID()),
        "Validator failed for path `UUIDHistory` with value `.*`",
        `UUIDHistory can be no larger than ${UUID_HISTORY_MAX_ITEMS} items`,
      ],
      [CaseType.Success, "Valid UUID", randomValidUUID, undefined, undefined],
      [CaseType.Success, "an array with a single valid UUID", [randomValidUUID], undefined, undefined],
      [
        CaseType.Success,
        "an array with many valid UUIDs",
        [randomUUID(), randomUUID(), randomUUID()],
        undefined,
        undefined,
      ],
      [
        CaseType.Success,
        "an array with the maximum support number of UUIDs",
        new Array(UUID_HISTORY_MAX_ITEMS).fill(undefined).map(() => randomUUID()),
        undefined,
        undefined,
      ],
    ])(
      `(%s) Validate 'UUIDHistory' when it is %s`,
      (caseType: CaseType, caseDescription, value, expectedFailureMessage, expectedFailureReason) => {
        assertCaseForProperty<T>({
          model: getModel(),
          propertyNames: "UUIDHistory",
          caseType,
          testValue: value,
          expectedFailureMessage,
          expectedFailureReason,
        });
      }
    );
  });
}

export function testAltLabelsField<T>(getModel: () => mongoose.Model<T>) {
  return describe("Test validation of 'altLabels'", () => {
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
        assertCaseForProperty<T>({
          model: getModel(),
          propertyNames: "altLabels",
          caseType,
          testValue: value,
          expectedFailureMessage,
        });
      }
    );
  });
}

export function testPreferredLabel<T>(getModel: () => mongoose.Model<T>) {
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
        assertCaseForProperty<T>({
          model: getModel(),
          propertyNames: "preferredLabel",
          caseType,
          testValue: value,
          expectedFailureMessage,
        });
      }
    );
  });
}

export function testDescription<T>(getModel: () => mongoose.Model<T>) {
  return describe("Test validation of 'description'", () => {
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
        assertCaseForProperty<T>({
          model: getModel(),
          propertyNames: "description",
          caseType,
          testValue: value,
          expectedFailureMessage,
        });
      }
    );
  });
}

export function testOriginUri<T>(getModel: () => mongoose.Model<T>) {
  return describe("Test validation of 'originUri'", () => {
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
        "Too long Origin uri",
        getTestString(ORIGIN_URI_MAX_LENGTH + 1),
        `{0} must be at most ${ORIGIN_URI_MAX_LENGTH} chars long`,
      ],
      [CaseType.Success, "empty", "", undefined],
      [CaseType.Success, "one letter", "a", undefined],
      [CaseType.Success, "The longest originUri", getTestString(ORIGIN_URI_MAX_LENGTH), undefined],
    ])(
      `(%s) Validate 'originUri' when it is %s`,
      (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<T>({
          model: getModel(),
          propertyNames: "originUri",
          caseType,
          testValue: value,
          expectedFailureMessage,
        });
      }
    );
  });
}

export const testEnumField = <T>(getModel: () => mongoose.Model<T>, fieldName: string, enumValues: string[]) => {
  describe("Test validation of '" + fieldName + "'", () => {
    const test_cases: [CaseType, string, string | null | undefined, string | undefined][] = [
      [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
      [CaseType.Failure, "null", null, "Path `{0}` is required."],
      [CaseType.Failure, "empty", "", "Path `{0}` is required."],
      [CaseType.Failure, "only whitespace characters", WHITESPACE, ` is not a valid enum value for path \`{0}\`.`],
      [CaseType.Failure, "random string", "foo", `\`foo\` is not a valid enum value for path \`{0}\`.`],
    ];

    for (const enumValue of enumValues) {
      test_cases.push([CaseType.Success, `valid enum value ${enumValue}`, enumValue, undefined]);
    }

    test.each(test_cases)(
      `(%s) Validate 'preferredLabel' when it is %s`,
      (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<T>({
          model: getModel(),
          propertyNames: fieldName,
          caseType,
          testValue: value,
          expectedFailureMessage,
        });
      }
    );
  });
};
