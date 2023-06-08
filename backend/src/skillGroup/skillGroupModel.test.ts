// Suppress chatty console during the tests
import "_test_utilities/consoleMock"

import mongoose, {Connection} from "mongoose";
import {randomUUID} from "crypto";
import {getNewConnection} from "server/connection/newConnection";
import {initializeSchemaAndModel, ISkillGroup, ModelName, PARENT_MAX_ITEMS,} from "./skillGroupModel";
import {getMockId} from "_test_utilities/mockMongoId";
import {generateRandomUrl, getRandomString, getTestString, WHITESPACE} from "_test_utilities/specialCharacters";
import {assertCaseForProperty, CaseType} from "_test_utilities/dataModel";
import {
  ATL_LABELS_MAX_ITEMS,
  DESCRIPTION_MAX_LENGTH,
  ESCO_URI_MAX_LENGTH,
  LABEL_MAX_LENGTH,
  SCOPE_NOTE_MAX_LENGTH
} from "esco/common/modelSchema";
import {getMockRandomSkillCode} from "../_test_utilities/mockSkillGroupCode";
import {getTestConfiguration} from "../_test_utilities/getTestConfiguration";

describe('Test the definition of the skillGroup Model', () => {
  let dbConnection: Connection;
  let skillGroupModel: mongoose.Model<ISkillGroup>;
  beforeAll(async () => {
    // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("skillGroupModelTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    // initialize the schema and model
    initializeSchemaAndModel(dbConnection);
    skillGroupModel = dbConnection.model(ModelName);
  });

  afterAll(async () => {
    if (dbConnection) {
      await dbConnection.dropDatabase();
      await dbConnection.close();
    }
  });

  test("Successfully validate skillGroup with mandatory fields", async () => {
    // GIVEN a skillGroup object with all mandatory fields
    const givenObject: ISkillGroup = {
      id: getMockId(2),
      UUID: randomUUID(),
      code: getMockRandomSkillCode(),
      preferredLabel: getTestString(LABEL_MAX_LENGTH),
      modelId: getMockId(2),
      originUUID: randomUUID(),
      ESCOUri: generateRandomUrl(),
      altLabels: [getRandomString(LABEL_MAX_LENGTH), getRandomString(LABEL_MAX_LENGTH)],
      description: getTestString(DESCRIPTION_MAX_LENGTH),
      scopeNote: getTestString(SCOPE_NOTE_MAX_LENGTH),
      parentGroups: [getMockId(2), getMockId(3), getMockId(4)],
      childrenGroups: [getMockId(2)],
      // @ts-ignore
      createdAt: new Date().toISOString(),
      // @ts-ignore
      updatedAt: new Date().toISOString(),

    };

    // WHEN validating that object
    const skillGroupModelValid = new skillGroupModel(givenObject);

    // THEN it should validate successfully
    const errors = await skillGroupModelValid.validateSync()
    // @ts-ignore
    expect(errors).toBeUndefined();
  });

  test("Successfully validate skillGroup with optional fields", async () => {
    // GIVEN an object with all mandatory fields
    //@ts-ignore
    // GIVEN an skillGroup object with all mandatory fields
    const givenObject: ISkillGroup = {
      UUID: randomUUID(),
      code: getMockRandomSkillCode(),
      preferredLabel: getTestString(LABEL_MAX_LENGTH),
      modelId: getMockId(2),
      originUUID: "",
      altLabels: [],
      parentGroups: [],
      ESCOUri: generateRandomUrl(),
      description: getTestString(DESCRIPTION_MAX_LENGTH),
      scopeNote: ""
    };

    // WHEN validating that object
    const skillGroupModelValid = new skillGroupModel(givenObject);

    // THEN it should validate successfully
    const errors = await skillGroupModelValid.validateSync()
    // @ts-ignore
    expect(errors).toBeUndefined();
  });

  describe("Validate skillGroup fields", () => {
    describe("Test validation of 'modelId'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "empty", "", 'Cast to ObjectId failed for value .* at path "{0}" because of "BSONError"'],
        [CaseType.Failure, "only whitespace characters", WHITESPACE, 'Cast to ObjectId failed for value .* at path "{0}" because of "BSONError"'],
        [CaseType.Failure, "not a objectId (string)", "foo", 'Cast to ObjectId failed for value .* at path "{0}" because of "BSONError"'],
        [CaseType.Failure, "not a objectId (object)", {foo:"bar"}, 'Cast to ObjectId failed for value .* at path "{0}" because of "BSONError"'],
        [CaseType.Success, "ObjectID", new mongoose.Types.ObjectId(), undefined],
        [CaseType.Success, "hex 24 chars", getMockId(2), undefined],
      ])
      (`(%s) Validate 'modelId' when it is %s`, (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<ISkillGroup>(skillGroupModel, "modelId", caseType, value, expectedFailureMessage);
      });
    });

    describe("Test validation of 'UUID'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "empty", "", "Path `{0}` is required."],
        [CaseType.Failure, "only whitespace characters", WHITESPACE, `Validator failed for path \`{0}\` with value \`${WHITESPACE}\``],
        [CaseType.Failure, "not a UUID v4", "foo", "Validator failed for path `{0}` with value `foo`"],
        [CaseType.Success, "Valid UUID", randomUUID(), undefined],
      ])
      (`(%s) Validate 'UUID' when it is %s`, (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<ISkillGroup>(skillGroupModel, "UUID", caseType, value, expectedFailureMessage);
      });
    });

    describe("Test validation of 'originUUID'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "only whitespace characters", WHITESPACE, `Validator failed for path \`{0}\` with value \`${WHITESPACE}\``],
        [CaseType.Failure, "not a UUID v4", "foo", "Validator failed for path `{0}` with value `foo`"],
        [CaseType.Success, "Empty originUUID", "", undefined],
        [CaseType.Success, "Valid UUID", randomUUID(), undefined],
      ])
      (`(%s) Validate 'originUUID' when it is %s`, (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<ISkillGroup>(skillGroupModel, "originUUID", caseType, value, expectedFailureMessage);
      });
    });

    describe("Test validation of 'code'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "only whitespace characters", WHITESPACE, `${WHITESPACE} is not a valid code.`],
        [CaseType.Failure, "not a string od digits", "foo1", "foo1 is not a valid code."],
        [CaseType.Failure, "more than 4 digits", "55555", "55555 is not a valid code."],
        [CaseType.Failure, "with negative sign", "-9999", "-9999 is not a valid code."],
        [CaseType.Success, "empty", "", undefined],
        [CaseType.Success, "valid code 'S1.3.5'", "S1.3.5", undefined],
        [CaseType.Success, "one letter 'L'", "L", undefined],
        [CaseType.Success, "one letter with number 'T3'", "T3", undefined],
        [CaseType.Success, "any way in range", getMockRandomSkillCode(), undefined],
      ])
      (`(%s) Validate 'code' when it is %s`, (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<ISkillGroup>(skillGroupModel, "code", caseType, value, expectedFailureMessage);
      });
    });

    describe("Test validation of 'ESCOUri'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "only whitespace characters", WHITESPACE, `Validator failed for path \`{0}\` with value \`${WHITESPACE}\``],
        [CaseType.Failure, "Too long Esco uri", getTestString(ESCO_URI_MAX_LENGTH + 1), `{0} must be at most ${ESCO_URI_MAX_LENGTH}.`],
        [CaseType.Success, "empty", "", undefined],
        [CaseType.Success, "one letter", "a", undefined],
        [CaseType.Success, "The longest ESCOUri", getTestString(ESCO_URI_MAX_LENGTH), undefined],
      ])
      (`(%s) Validate 'ESCOUri' when it is %s`, (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<ISkillGroup>(skillGroupModel, "ESCOUri", caseType, value, expectedFailureMessage);
      });
    });

    describe("Test validation of 'preferredLabel'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "empty", "", "Path `{0}` is required."],
        [CaseType.Failure, "only whitespace characters", WHITESPACE, `Validator failed for path \`{0}\` with value \`${WHITESPACE}\``],
        [CaseType.Failure, "Too long preferredLabel", getTestString(LABEL_MAX_LENGTH + 1), `PreferredLabel must be at most ${LABEL_MAX_LENGTH} chars long`],
        [CaseType.Success, "one character", "a", undefined],
        [CaseType.Success, "the longest", getTestString(LABEL_MAX_LENGTH), undefined],
      ])
      (`(%s) Validate 'preferredLabel' when it is %s`, (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<ISkillGroup>(skillGroupModel, "preferredLabel", caseType, value, expectedFailureMessage);
      });
    });

    describe("Test validation of 'altLabels'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "not and array of strings (objects)", [{foo: "bar"}], "Path `{0}` is required."],
        [CaseType.Failure, "not and array of array of (string)", [["bar"]], "Path `{0}` is required."],
        [CaseType.Failure, "array with null", [null, null], "Validator failed for path `altLabels` with value `,`"],
        [CaseType.Failure, "array with undefined", [undefined, undefined], "Validator failed for path `altLabels` with value `,`"],
        [CaseType.Failure, "array with double entries", ['foo', 'foo'], "Validator failed for path `{0}` with value `foo,foo`"],
        [CaseType.Failure, "array with too long label", [getTestString(LABEL_MAX_LENGTH + 1)], `Validator failed for path \`{0}\` with value \`.{${LABEL_MAX_LENGTH + 1}}\``],
        [CaseType.Failure, "too long array", new Array(ATL_LABELS_MAX_ITEMS + 1).fill(undefined).map((v, i) => "foo" + i), `Validator failed for path \`{0}\` with value \`foo0,foo1,.*,foo${ATL_LABELS_MAX_ITEMS}\``],
        [CaseType.Success, "empty array", [], undefined],
        [CaseType.Success, "a string (automatically converted to array)", 'foo', undefined],
        [CaseType.Success, "valid array", ['foo', 'bar'], undefined],
        [CaseType.Success, "valid array with longest label", [getTestString(LABEL_MAX_LENGTH)], undefined],
        [CaseType.Success, "valid longest array with longest label", new Array(ATL_LABELS_MAX_ITEMS).fill(undefined).map(() => getRandomString(LABEL_MAX_LENGTH)), undefined]
      ])
      (`(%s) Validate 'altLabels' when it is %s`, (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<ISkillGroup>(skillGroupModel, "altLabels", caseType, value, expectedFailureMessage);
      });
    });

    describe("Test validation of 'scopeNote'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "only whitespace characters", WHITESPACE, `Validator failed for path \`{0}\` with value \`${WHITESPACE}\``],
        [CaseType.Failure, "Too long scopeNote", getTestString(SCOPE_NOTE_MAX_LENGTH + 1), `ScopeNote must be at most ${SCOPE_NOTE_MAX_LENGTH} chars long`],
        [CaseType.Success, "empty", "", undefined],
        [CaseType.Success, "one character", "a", undefined],
        [CaseType.Success, "the longest", getTestString(LABEL_MAX_LENGTH), undefined],
      ])
      (`(%s) Validate 'scopeNote' when it is %s`, (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<ISkillGroup>(skillGroupModel, "scopeNote", caseType, value, expectedFailureMessage);
      });
    });

    describe("Test validation of 'parentGroups'", () => {
      test.each([
        [CaseType.Failure, "too long array", new Array(PARENT_MAX_ITEMS + 1).fill(undefined).map(() => new mongoose.Types.ObjectId()), `Validator failed for path \`{0}\` with value`],
        [CaseType.Failure, "not unique", [getMockId(2), getMockId(2)], `Validator failed for path \`{0}\` with value \`${getMockId(2)},${getMockId(2)}\``],
        [CaseType.Failure, 'array of numbers', [123], `Path \`{0}\` is required.`],
        [CaseType.Failure, 'array of string', ["foo"], `Path \`{0}\` is required.`],
        [CaseType.Failure, 'a string', "foo", `Path \`{0}\` is required.`],
        [CaseType.Failure, 'null', null, `Path \`{0}\` is required.`],
        [CaseType.Failure, 'undefined', undefined, `Path \`{0}\` is required.`],
        [CaseType.Success, 'empty array', [], undefined],
        [CaseType.Success, "ObjectID", [new mongoose.Types.ObjectId()], undefined],
        [CaseType.Success, "hex 24 chars", getMockId(2), undefined],
        [CaseType.Success, "valid longest array with objects ids", new Array(PARENT_MAX_ITEMS ).fill(undefined).map(() => new mongoose.Types.ObjectId()), undefined],
      ])
      (`(%s) Validate 'parentGroups' when it is %s`, (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<ISkillGroup>(skillGroupModel, "parentGroups", caseType, value, expectedFailureMessage);
      });
    });
  });
});
