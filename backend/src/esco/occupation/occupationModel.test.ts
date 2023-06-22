// Suppress chatty console during the tests
import "_test_utilities/consoleMock"

import mongoose, {Connection} from "mongoose";
import {randomUUID} from "crypto";
import {getNewConnection} from "server/connection/newConnection";
import {
  initializeSchemaAndModel,
} from "./occupationModel";
import {getMockId} from "_test_utilities/mockMongoId";
import {
  generateRandomUrl, getRandomString,
  getTestString,
  WHITESPACE
} from "_test_utilities/specialCharacters";
import {
  ATL_LABELS_MAX_ITEMS, DEFINITION_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  ESCO_URI_MAX_LENGTH,
  LABEL_MAX_LENGTH, REGULATED_PROFESSION_NOTE_MAX_LENGTH, SCOPE_NOTE_MAX_LENGTH
} from "esco/common/modelSchema";
import {assertCaseForProperty, CaseType} from "_test_utilities/dataModel";
import {getTestConfiguration} from "_test_utilities/getTestConfiguration";
import {getMockRandomOccupationCode} from "_test_utilities/mockOccupationCode";
import {getMockRandomISCOGroupCode} from "_test_utilities/mockISCOCode";
import {IOccupationDoc} from "./occupation.types";

describe('Test the definition of the Occupation Model', () => {
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

  test("Successfully validate Occupation with mandatory fields", async () => {
    // GIVEN an Occupation object with all mandatory fields
    const givenObject: IOccupationDoc = {
      id: getMockId(1),
      UUID: randomUUID(),
      code: getMockRandomOccupationCode(),
      preferredLabel: getTestString(LABEL_MAX_LENGTH),
      modelId: getMockId(2),
      originUUID: randomUUID(),
      ESCOUri: generateRandomUrl(),
      altLabels: [getTestString(LABEL_MAX_LENGTH, "Label_1"), getTestString(LABEL_MAX_LENGTH, "Label_2")],
      description: getTestString(DESCRIPTION_MAX_LENGTH),
      ISCOGroupCode: getMockRandomISCOGroupCode(),
      definition: getTestString(DEFINITION_MAX_LENGTH),
      scopeNote: getTestString(SCOPE_NOTE_MAX_LENGTH),
      regulatedProfessionNote: getTestString(REGULATED_PROFESSION_NOTE_MAX_LENGTH),
      // @ts-ignore
      createdAt: new Date().toISOString(),
      // @ts-ignore
      updatedAt: new Date().toISOString(),
    };

    // WHEN validating that object
    const occupationModelValid = new OccupationModel(givenObject);

    // THEN it should validate successfully
    const errors = await occupationModelValid.validateSync()
    // @ts-ignore
    expect(errors).toBeUndefined();
  });

  test("Successfully validate Occupation with optional fields", async () => {
    // GIVEN an Occupation object with all optional fields
    const givenObject: IOccupationDoc = {
      id: getMockId(1),
      UUID: randomUUID(),
      code: getMockRandomOccupationCode(),
      preferredLabel: getTestString(LABEL_MAX_LENGTH),
      modelId: getMockId(2),
      originUUID: "",
      ESCOUri: "",
      altLabels: [],
      description: "",
      ISCOGroupCode: getMockRandomISCOGroupCode(),
      definition: "",
      scopeNote: "",
      regulatedProfessionNote: "",
      // @ts-ignore
      createdAt: new Date().toISOString(),
      // @ts-ignore
      updatedAt: new Date().toISOString(),
    };

    // WHEN validating that object
    const occupationModelValid = new OccupationModel(givenObject);

    // THEN it should validate successfully
    const errors = await occupationModelValid.validateSync()
    // @ts-ignore
    expect(errors).toBeUndefined();
  });

  describe("Validate Occupation fields", () => {
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
        assertCaseForProperty<IOccupationDoc>(OccupationModel, "modelId", caseType, value, expectedFailureMessage);
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
        assertCaseForProperty<IOccupationDoc>(OccupationModel, "UUID", caseType, value, expectedFailureMessage);
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
        assertCaseForProperty<IOccupationDoc>(OccupationModel, "originUUID", caseType, value, expectedFailureMessage);
      });
    });

    describe("Test validation of 'ISCOGroupCode'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "empty", "", "Path `{0}` is required."],
        [CaseType.Failure, "only whitespace characters", WHITESPACE, `Validator failed for path \`{0}\` with value \`${WHITESPACE}\``],
        [CaseType.Failure, "not a string od digits", "foo1", "Validator failed for path `{0}` with value `foo1`"],
        [CaseType.Failure, "more than 4 digits", "55555", "Validator failed for path `{0}` with value `55555`"],
        [CaseType.Failure, "with negative sign", "-9999", "Validator failed for path `{0}` with value `-9999`"],
        [CaseType.Success, "0", "0", undefined],
        [CaseType.Success, "max", "9999", undefined],
        [CaseType.Success, "leading zero", "0009", undefined],
        [CaseType.Success, "any way in range", "090", undefined],
      ])
      (`(%s) Validate 'code' when it is %s`, (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<IOccupationDoc>(OccupationModel, "ISCOGroupCode", caseType, value, expectedFailureMessage);
      });
    });

    describe("Test validation of 'code'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "empty", "", "Path `{0}` is required."],
        [CaseType.Failure, "only whitespace characters", WHITESPACE, `Validator failed for path \`{0}\` with value \`${WHITESPACE}\``],
        [CaseType.Failure, "not a string od digits", "foo1", "Validator failed for path `{0}` with value `foo1`"],
        [CaseType.Failure, "more than 4 digits", "55555.1", "Validator failed for path `{0}` with value `55555.1`"],
        [CaseType.Failure, "with negative sign", "-9999.1", "Validator failed for path `{0}` with value `-9999.1`"],
        [CaseType.Success, "extremely deep 1234.1.2.3.4.5.6.7.8.9", "1234.1.2.3.4.5.6.7.8.9", undefined],
        [CaseType.Success, "leading zeros 0001.01.01", "0001.01.01", undefined],
        [CaseType.Success, " typical value 1234.1", "1234.1", undefined],
      ])
      (`(%s) Validate 'code' when it is %s`, (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<IOccupationDoc>(OccupationModel, "code", caseType, value, expectedFailureMessage);
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
        assertCaseForProperty<IOccupationDoc>(OccupationModel, "ESCOUri", caseType, value, expectedFailureMessage);
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
        assertCaseForProperty<IOccupationDoc>(OccupationModel, "preferredLabel", caseType, value, expectedFailureMessage);
      });
    });

    describe("Test validation of 'altLabels'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "not and array of strings (objects)", [{foo: "bar"}], "Path `{0}` is required."],
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
        assertCaseForProperty<IOccupationDoc>(OccupationModel, "altLabels", caseType, value, expectedFailureMessage);
      });
    });

    describe("Test validation of 'scopeNote'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "Too long scopeNote", getTestString(SCOPE_NOTE_MAX_LENGTH + 1), `ScopeNote must be at most ${SCOPE_NOTE_MAX_LENGTH} chars long`],
        [CaseType.Success, "empty", "", undefined],
        [CaseType.Success, "one character", "a", undefined],
        [CaseType.Success, "only whitespace characters", WHITESPACE, undefined],
        [CaseType.Success, "the longest", getTestString(SCOPE_NOTE_MAX_LENGTH), undefined],
      ])
      (`(%s) Validate 'scopeNote' when it is %s`, (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<IOccupationDoc>(OccupationModel, "scopeNote", caseType, value, expectedFailureMessage);
      });
    });

    describe("Test validation of 'definition'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "Too long definition", getTestString(DEFINITION_MAX_LENGTH + 1), `Definition must be at most ${DEFINITION_MAX_LENGTH} chars long`],
        [CaseType.Success, "empty", "", undefined],
        [CaseType.Success, "one character", "a", undefined],
        [CaseType.Success, "only whitespace characters", WHITESPACE, undefined],
        [CaseType.Success, "the longest", getTestString(DEFINITION_MAX_LENGTH), undefined],
      ])
      (`(%s) Validate 'definition' when it is %s`, (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<IOccupationDoc>(OccupationModel, "definition", caseType, value, expectedFailureMessage);
      });
    });

    describe("Test validation of 'description'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "Too long description", getTestString(DESCRIPTION_MAX_LENGTH + 1), `Description must be at most ${DESCRIPTION_MAX_LENGTH} chars long`],
        [CaseType.Success, "empty", "", undefined],
        [CaseType.Success, "one character", "a", undefined],
        [CaseType.Success, "only whitespace characters", WHITESPACE, undefined],
        [CaseType.Success, "the longest", getTestString(DESCRIPTION_MAX_LENGTH), undefined],
      ])
      (`(%s) Validate 'description' when it is %s`, (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<IOccupationDoc>(OccupationModel, "description", caseType, value, expectedFailureMessage);
      });
    });

    describe("Test validation of 'regulatedProfessionNote'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "Too long description", getTestString(REGULATED_PROFESSION_NOTE_MAX_LENGTH + 1), `RegulatedProfessionNote must be at most ${REGULATED_PROFESSION_NOTE_MAX_LENGTH} chars long`],
        [CaseType.Success, "empty", "", undefined],
        [CaseType.Success, "one character", "a", undefined],
        [CaseType.Success, "only whitespace characters", WHITESPACE, undefined],
        [CaseType.Success, "the longest", getTestString(REGULATED_PROFESSION_NOTE_MAX_LENGTH), undefined],
      ])
      (`(%s) Validate 'description' when it is %s`, (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<IOccupationDoc>(OccupationModel, "regulatedProfessionNote", caseType, value, expectedFailureMessage);
      });
    });
  });
});