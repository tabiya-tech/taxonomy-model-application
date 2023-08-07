// Suppress chatty console during the tests
import "_test_utilities/consoleMock"

import mongoose, {Connection} from "mongoose";
import {randomUUID} from "crypto";
import {getNewConnection} from "server/connection/newConnection";
import {initializeSchemaAndModel} from "./skillModel";
import {
  ATL_LABELS_MAX_ITEMS, DEFINITION_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  ESCO_URI_MAX_LENGTH, IMPORT_ID_MAX_LENGTH,
  LABEL_MAX_LENGTH,
  SCOPE_NOTE_MAX_LENGTH
} from "esco/common/modelSchema";
import {getTestConfiguration} from "_test_utilities/getTestConfiguration";
import {getMockId} from "_test_utilities/mockMongoId";
import {generateRandomUrl, getRandomString, getTestString, WHITESPACE} from "_test_utilities/specialCharacters";
import {assertCaseForProperty, CaseType} from "_test_utilities/dataModel";
import {ISkillDoc} from "./skills.types";
import {testImportId} from "esco/_test_utilities/modelSchemaTestFunctions";

describe('Test the definition of the skill Model', () => {
  let dbConnection: Connection;
  let skillModel: mongoose.Model<ISkillDoc>;
  beforeAll(async () => {
    // Using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("skillGroupModelTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    // Initialize the schema and model
    skillModel = initializeSchemaAndModel(dbConnection);
  });

  afterAll(async () => {
    if (dbConnection) {
      await dbConnection.dropDatabase();
      await dbConnection.close();
    }
  });

  test("Successfully validate skill with mandatory fields", async () => {
    // GIVEN a skill object with all mandatory fields filled & a document
    const givenObject: ISkillDoc = {
      UUID: randomUUID(),
      preferredLabel: getTestString(LABEL_MAX_LENGTH),
      modelId: getMockId(2),
      originUUID: randomUUID(),
      ESCOUri: generateRandomUrl(),
      altLabels: [getRandomString(LABEL_MAX_LENGTH), getRandomString(LABEL_MAX_LENGTH)],
      definition: getTestString(DEFINITION_MAX_LENGTH),
      description: getTestString(DESCRIPTION_MAX_LENGTH),
      scopeNote: getTestString(SCOPE_NOTE_MAX_LENGTH),
      skillType: "skill/competence",
      reuseLevel: "sector-specific",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      importId: getTestString(IMPORT_ID_MAX_LENGTH)
    };
    const givenSkillDocument = new skillModel(givenObject);

    // WHEN validating that given skill document
    const actualValidationErrors = givenSkillDocument.validateSync();

    // THEN expect it to validate without any error
    expect(actualValidationErrors).toBeUndefined();
  });

  test("Successfully validate skill with optional fields", async () => {
    //@ts-ignore
    // GIVEN a skill object with empty optional fields & a document
    const givenObject: ISkillDoc = {
      UUID: randomUUID(),
      preferredLabel: getTestString(LABEL_MAX_LENGTH),
      modelId: getMockId(2),
      originUUID: "",
      altLabels: [],
      skillType: "",
      reuseLevel: "",
      ESCOUri: "",
      definition: "",
      description: "",
      scopeNote: "",
      importId: "",
    };
    const givenSkillDocument = new skillModel(givenObject);
    
    // WHEN validating that given skill document
    const actualValidationErrors = givenSkillDocument.validateSync();

    // THEN expect it to validate without any error
    expect(actualValidationErrors).toBeUndefined();
  });

  describe("Validate skillGroup fields", () => {
    describe("Test validation of 'modelId'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "empty", "", 'Cast to ObjectId failed for value .* at path "{0}" because of "BSONError"'],
        [CaseType.Failure, "only whitespace characters", WHITESPACE, 'Cast to ObjectId failed for value .* at path "{0}" because of "BSONError"'],
        [CaseType.Failure, "not a objectId (string)", "foo", 'Cast to ObjectId failed for value .* at path "{0}" because of "BSONError"'],
        [CaseType.Failure, "not a objectId (object)", {foo: "bar"}, 'Cast to ObjectId failed for value .* at path "{0}" because of "BSONError"'],
        [CaseType.Success, "ObjectID", new mongoose.Types.ObjectId(), undefined],
        [CaseType.Success, "hex 24 chars", getMockId(2), undefined],
      ])
      (`(%s) Validate 'modelId' when it is %s`, (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<ISkillDoc>(skillModel, "modelId", caseType, value, expectedFailureMessage);
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
        assertCaseForProperty<ISkillDoc>(skillModel, "UUID", caseType, value, expectedFailureMessage);
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
        assertCaseForProperty<ISkillDoc>(skillModel, "originUUID", caseType, value, expectedFailureMessage);
      });
    });


    describe("Test validation of 'ESCOUri'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "only whitespace characters", WHITESPACE, `Validator failed for path \`{0}\` with value \`${WHITESPACE}\``],
        [CaseType.Failure, "Too long Esco uri", getTestString(ESCO_URI_MAX_LENGTH + 1), `{0} must be at most ${ESCO_URI_MAX_LENGTH} chars long`],
        [CaseType.Success, "empty", "", undefined],
        [CaseType.Success, "one letter", "a", undefined],
        [CaseType.Success, "The longest ESCOUri", getTestString(ESCO_URI_MAX_LENGTH), undefined],
      ])
      (`(%s) Validate 'ESCOUri' when it is %s`, (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<ISkillDoc>(skillModel, "ESCOUri", caseType, value, expectedFailureMessage);
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
        assertCaseForProperty<ISkillDoc>(skillModel, "preferredLabel", caseType, value, expectedFailureMessage);
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
        assertCaseForProperty<ISkillDoc>(skillModel, "altLabels", caseType, value, expectedFailureMessage);
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
        assertCaseForProperty<ISkillDoc>(skillModel, "scopeNote", caseType, value, expectedFailureMessage);
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
        assertCaseForProperty<ISkillDoc>(skillModel, "definition", caseType, value, expectedFailureMessage);
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
        assertCaseForProperty<ISkillDoc>(skillModel, "description", caseType, value, expectedFailureMessage);
      });
    });

    describe("Test validation of 'skillType'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "only whitespace characters", WHITESPACE, ` is not a valid enum value for path \`{0}\`.`],
        [CaseType.Failure, "random string", "foo", `\`foo\` is not a valid enum value for path \`{0}\`.`],
        [CaseType.Success, "empty", "", undefined],
        [CaseType.Success, "skill/competence", "skill/competence", undefined],
        [CaseType.Success, "knowledge", "knowledge", undefined],
        [CaseType.Success, "language", "language", undefined],
        [CaseType.Success, "attitude", "attitude", undefined],
      ])
      (`(%s) Validate 'skillType' when it is %s`, (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<ISkillDoc>(skillModel, "skillType", caseType, value, expectedFailureMessage);
      });
    });

    describe("Test validation of 'reuseLevel'", () => {
      test.each([
        [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
        [CaseType.Failure, "null", null, "Path `{0}` is required."],
        [CaseType.Failure, "only whitespace characters", WHITESPACE, ` is not a valid enum value for path \`{0}\`.`],
        [CaseType.Failure, "random string", "foo", `\`foo\` is not a valid enum value for path \`{0}\`.`],
        [CaseType.Success, "sector-specific", "sector-specific", undefined],
        [CaseType.Success, "occupation-specific", "occupation-specific", undefined],
        [CaseType.Success, "cross-sector", "cross-sector", undefined],
        [CaseType.Success, "transversal", "transversal", undefined],
        [CaseType.Success, "empty", "", undefined],
      ])
      (`(%s) Validate 'reuseLevel' when it is %s`, (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
        assertCaseForProperty<ISkillDoc>(skillModel, "reuseLevel", caseType, value, expectedFailureMessage);
      });
    });

    describe("Test validation of 'importId'", () => {
      testImportId<ISkillDoc>(() => skillModel);
    });
  });
});
