// Suppress chatty console during the tests
import "_test_utilities/consoleMock"

import mongoose, {Connection} from "mongoose";
import {
  DESCRIPTION_MAX_LENGTH,
  IModelInfo,
  NAME_MAX_LENGTH,
  RELEASE_NOTES_MAX_LENGTH, SHORTCODE_MAX_LENGTH,
  VERSION_MAX_LENGTH,
  ModelName, initializeSchemaAndModel
} from './modelInfoModel'
import {randomUUID} from "crypto";
import {getTestString, WHITESPACE} from "_test_utilities/specialCharacters";

import {getMockId} from "_test_utilities/mockMongoId";
import {getTestConfiguration} from "./testDataHelper";
import {getNewConnection} from "../server/connection/newConnection";



describe('Test the definition of the ModelInfo Model', () => {
  let dbConnection: Connection;
  let ModelInfoModel: mongoose.Model<IModelInfo>;
  beforeAll(async () => {
    // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("ModelInfoModelTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    // initialize the schema and model
    initializeSchemaAndModel(dbConnection);
    ModelInfoModel = dbConnection.model(ModelName);
  });

  afterAll(async () => {
    if (dbConnection) {
      await dbConnection.dropDatabase();
      await dbConnection.close();
    }
  });

  test("Successfully validate modelInfo with mandatory fields", async () => {
    // GIVEN an object with all mandatory fields
    const givenObject: IModelInfo = {
      id: getMockId(2),
      UUID: randomUUID(),
      previousUUID: randomUUID(),
      originUUID: randomUUID(),
      name: getTestString(NAME_MAX_LENGTH),
      locale: {
        UUID: randomUUID(),
        name: getTestString(NAME_MAX_LENGTH),
        shortCode: getTestString(SHORTCODE_MAX_LENGTH)
      },
      description: getTestString(DESCRIPTION_MAX_LENGTH),
      released: false,
      releaseNotes: getTestString(RELEASE_NOTES_MAX_LENGTH),
      version: getTestString(VERSION_MAX_LENGTH),
      // @ts-ignore
      createdAt: new Date().toISOString(),
      // @ts-ignore
      updatedAt: new Date().toISOString()
    };

    // WHEN validating that object
    const modelInfoValid = new ModelInfoModel(givenObject);

    // THEN it should validate successfully
    const errors = await modelInfoValid.validateSync()
    // @ts-ignore
    expect(errors).toBeUndefined();
  });

  test("Successfully validate modelInfo with optional fields", async () => {
    // GIVEN an object with all mandatory fields
    //@ts-ignore
    const givenObject: IModelInfo = {
      UUID: randomUUID(),
      previousUUID: "",
      originUUID: "",
      name: getTestString(NAME_MAX_LENGTH),
      locale: {
        UUID: randomUUID(),
        name: getTestString(NAME_MAX_LENGTH),
        shortCode: getTestString(SHORTCODE_MAX_LENGTH)
      },
      description: "",
      released: false,
      releaseNotes: "",
      version: "",
    };

    // WHEN validating that object
    const modelInfoValid = new ModelInfoModel(givenObject);

    // THEN it should validate successfully
    const errors = await modelInfoValid.validateSync()
    // @ts-ignore
    expect(errors).toBeUndefined();
  });

  function formatMessage(message: string, ...args: string[]) {
    return message.replace(/{(\d+)}/g, (match: string, number: number) => {
      return (typeof args[number] != 'undefined'
        ? args[number]
        : match);
    });
  }

  describe("Successfully validate modelInfo fields", () => {
    function assertNoValidationError(modelInfoSpec: Partial<IModelInfo>, failedProperty: string) {
      const newModel = new ModelInfoModel(modelInfoSpec);
      const result = newModel.validateSync();
      if (result) {
        expect(result.errors[failedProperty]).toBeUndefined();
      }
    }

    describe("Success validation of 'description'", () => {
      test.each([
        ["empty", ""],
        ["only whitespace characters", WHITESPACE],
        ["The longest description", getTestString(DESCRIPTION_MAX_LENGTH)],
      ])("Successful validation 'description' when it is %s", (caseDescription, value) => {
        const modelInfoSpec: Partial<IModelInfo> = {
          // @ts-ignore
          description: value
        };
        assertNoValidationError(modelInfoSpec, 'description');
      });
    });

    // success validation of 'releaseNotes'
    describe("Success validation of 'releaseNotes'", () => {
      test.each([
        ["empty", ""],
        ["only whitespace characters", WHITESPACE],
        ["The longest releaseNotes", getTestString(RELEASE_NOTES_MAX_LENGTH)],
      ])("Successful validation 'releaseNotes' when it is %s", (caseDescription, value) => {
        const modelInfoSpec: Partial<IModelInfo> = {
          // @ts-ignore
          releaseNotes: value
        };
        assertNoValidationError(modelInfoSpec, 'releaseNotes');
      });
    });

    // success validation of 'version'
    describe("Success validation of 'version'", () => {
      test.each([
        ["empty", ""],
        ["only whitespace characters", WHITESPACE],
        ["The longest version", getTestString(VERSION_MAX_LENGTH)],
      ])("Successful validation 'version' when it is %s", (caseDescription, value) => {
        const modelInfoSpec: Partial<IModelInfo> = {
          // @ts-ignore
          version: value
        };
        assertNoValidationError(modelInfoSpec, 'version');
      });
    });

    // success validation of 'name'
    describe("Success validation of 'name'", () => {
      test.each([
        ["The longest name", getTestString(NAME_MAX_LENGTH)],
      ])("Successful validation 'name' when it is %s", (caseDescription, value) => {
        const modelInfoSpec: Partial<IModelInfo> = {
          // @ts-ignore
          name: value
        };
        assertNoValidationError(modelInfoSpec, 'name');
      });
    });
    
    // success validation of 'locale'
    describe("Success validation of 'locale'", () => {
      test.each([
        ["Valid locale.UUID", randomUUID()]
      ])("Successful validation 'locale.UUID' when it is %s", (caseDescription, value) => {
        const modelInfoSpec: Partial<IModelInfo> = {
          // @ts-ignore
          locale:  {
            UUID: value,
            name: getTestString(NAME_MAX_LENGTH),
            shortCode: getTestString(SHORTCODE_MAX_LENGTH)
          }
        };
        assertNoValidationError(modelInfoSpec, 'locale.UUID');
        assertNoValidationError(modelInfoSpec, 'locale.name');
        assertNoValidationError(modelInfoSpec, 'locale.shortCode');
      });
    });

    // success validation of 'locale.uuid'
    describe("Success validation of 'locale.UUID'", () => {
      test.each([
        ["Valid locale.UUID", randomUUID()]
      ])("Successful validation 'locale.UUID' when it is %s", (caseDescription, value) => {
        const modelInfoSpec: Partial<IModelInfo> = {
          // @ts-ignore
          locale:  {
            UUID: value
          }
        };
        assertNoValidationError(modelInfoSpec, 'locale.UUID');
      });
    });


    // success validation of 'locale.name'
    describe("Success validation of 'locale.name'", () => {
      test.each([
        ["Empty locale.name", ""],
        ["Valid locale.name", getTestString(NAME_MAX_LENGTH)]
      ])("Successful validation 'locale.name' when it is %s", (caseDescription, value) => {
        const modelInfoSpec: Partial<IModelInfo> = {
          // @ts-ignore
          locale:  {
            name: value
          }
        };
        assertNoValidationError(modelInfoSpec, 'locale.name');
      });
    });


    // success validation of 'locale.shortCode'
    describe("Success validation of 'locale.shortcode'", () => {
      test.each([
        ["Empty locale.shortCode", ""],
        ["Valid locale.shortCode", getTestString(SHORTCODE_MAX_LENGTH)]
      ])("Successful validation 'locale.shortCode' when it is %s", (caseDescription, value) => {
        const modelInfoSpec: Partial<IModelInfo> = {
          // @ts-ignore
          locale:  {
            shortCode: value
          }
        };
        assertNoValidationError(modelInfoSpec, 'locale.shortCode');
      });
    });


    // success validation of 'previousUUID'
    describe("Success validation of 'previousUUID'", () => {
      test.each([
        ["Empty previousUUID", ""],
        ["Valid previousUUID", randomUUID()]
      ])("Successful validation 'previousUUID' when it is %s", (caseDescription, value) => {
        const modelInfoSpec: Partial<IModelInfo> = {
          // @ts-ignore
          previousUUID: value
        };
        assertNoValidationError(modelInfoSpec, 'previousUUID');
      });
    });

    // success validation of 'originUUID'
    describe("Success validation of 'originUUID'", () => {
      test.each([
        ["Empty originUUID", ""],
        ["Valid UUID", randomUUID()]
      ])("Successful validation 'originUUID' when it is %s", (caseDescription, value) => {
        const modelInfoSpec: Partial<IModelInfo> = {
          // @ts-ignore
          originUUID: value
        };
        assertNoValidationError(modelInfoSpec, 'originUUID');
      });
    });


    // success validation of 'UUID'
    describe("Success validation of 'UUID'", () => {
      test.each([
        ["Valid UUID", randomUUID()]
      ])("Successful validation 'UUID' when it is %s", (caseDescription, value) => {
        const modelInfoSpec: Partial<IModelInfo> = {
          // @ts-ignore
          UUID: value
        };
        assertNoValidationError(modelInfoSpec, 'UUID');
      });
    });

    // success validation of 'released'
    describe("Success validation of 'released'", () => {
      test.each([
        ["true", true],
        ["false", false]
      ])("Successful validation 'released' when it is %s", (caseDescription, value) => {
        const modelInfoSpec: Partial<IModelInfo> = {
          // @ts-ignore
          released: value
        };
        assertNoValidationError(modelInfoSpec, 'released');
      });
    });
  })

  describe("Fail validation of modelInfo fields", () => {
    function assertValidationError(modelInfoSpec: Partial<IModelInfo>, failedProperty: string, failMessage: string) {
      const newModel = new ModelInfoModel(modelInfoSpec);
      const result = newModel.validateSync();
      expect(result).toBeDefined();
      expect(result?.errors[failedProperty]?.message).toEqual(expect.stringMatching(new RegExp(failMessage)));
    }

    describe("Fail validation of 'UUID'", () => {
      test.each([
        ["undefined", undefined, "Path `{0}` is required."],
        ["null", null, "Path `{0}` is required."],
        ["empty", "", "Path `{0}` is required."],
        ["only whitespace characters", WHITESPACE, `Validator failed for path \`{0}\` with value \`${WHITESPACE}\``],
        ["not a UUID v4", "foo", "Validator failed for path `{0}` with value `foo`"],
      ])("Fail validation 'UUID' because it is %s", (caseDescription, value, message) => {
        const modelInfoSpec: Partial<IModelInfo> = {
          // @ts-ignore
          UUID: value
        };
        assertValidationError(modelInfoSpec, 'UUID', formatMessage(message, 'UUID'));
      });
    });


    describe("Fail validation of 'name'", () => {
      test.each([
        ["undefined", undefined, "Path `{0}` is required."],
        ["null", null, "Path `{0}` is required."],
        ["empty", "", "Path `{0}` is required."],
        ["only whitespace characters", WHITESPACE, `Validator failed for path \`{0}\` with value \`${WHITESPACE}\``],
        ["Too long name", getTestString(NAME_MAX_LENGTH + 1), 'Name must be at most 256']
      ])("Fail validation 'name' because it is %s", (caseDescription, value, message) => {
        const modelInfoSpec: Partial<IModelInfo> = {
          // @ts-ignore
          name: value
        };
        assertValidationError(modelInfoSpec, 'name', formatMessage(message, 'name'));
      });
    });

    describe("Fail validation of 'description'", () => {
      test.each([
        ["undefined", undefined, "Path `{0}` is required."],
        ["null", null, "Path `{0}` is required."],
        ["Too long description", getTestString(DESCRIPTION_MAX_LENGTH + 1), `Description must be at most ${DESCRIPTION_MAX_LENGTH} chars long`]
      ])("Fail validation 'description' because it is %s", (caseDescription, value, message) => {
        const modelInfoSpec: Partial<IModelInfo> = {
          // @ts-ignore
          description: value
        };
        assertValidationError(modelInfoSpec, 'description', formatMessage(message, 'description'));
      });
    });

    describe("Fail validation of 'previousUUID'", () => {
      test.each([
        ["undefined", undefined, "Path `{0}` is required."],
        ["null", null, "Path `{0}` is required."],
        ["only whitespace characters", WHITESPACE, `Validator failed for path \`{0}\` with value \`${WHITESPACE}\``],
        ["not a UUID v4", "foo", "Validator failed for path `{0}` with value `foo`"],
      ])("Fail validation 'previousUUID' because it is %s", (caseDescription, value, message) => {
        const modelInfoSpec: Partial<IModelInfo> = {
          // @ts-ignore
          previousUUID: value
        };
        assertValidationError(modelInfoSpec, 'previousUUID', formatMessage(message, 'previousUUID'));
      });
    });

    describe("Fail validation of 'originUUID'", () => {
      test.each([
        ["undefined", undefined, "Path `{0}` is required."],
        ["null", null, "Path `{0}` is required."],
        ["only whitespace characters", WHITESPACE, `Validator failed for path \`{0}\` with value \`${WHITESPACE}\``],
        ["not a UUID v4", "foo", "Validator failed for path `{0}` with value `foo`"],
      ])("Fail validation 'originUUID' because it is %s", (caseDescription, value, message) => {
        const modelInfoSpec: Partial<IModelInfo> = {
          // @ts-ignore
          originUUID: value
        };
        assertValidationError(modelInfoSpec, 'originUUID', formatMessage(message, 'originUUID'));
      });
    });

    describe("Fail validation of 'releaseNotes'", () => {
      test.each([
        ["undefined", undefined, "Path `{0}` is required."],
        ["null", null, "Path `{0}` is required."],
        ["Too long releaseNotes", getTestString(RELEASE_NOTES_MAX_LENGTH + 1), `Release notes must be at most ${RELEASE_NOTES_MAX_LENGTH}`]
      ])("Fail validation 'releaseNotes' because it is %s", (caseDescription, value, message) => {
        const modelInfoSpec: Partial<IModelInfo> = {
          // @ts-ignore
          releaseNotes: value
        };
        assertValidationError(modelInfoSpec, 'releaseNotes', formatMessage(message, 'releaseNotes'));
      });
    });

    describe("Fail validation of 'released'", () => {
      test.each([
        ["undefined", undefined, "Path `{0}` is required."],
        ["null", null, "Path `{0}` is required."],
        ["not boolean", "foo", 'Cast to Boolean failed .* path "{0}"'],
      ])("Fail validation 'released' because it is %s", (caseDescription, value, message) => {
        const modelInfoSpec: Partial<IModelInfo> = {
          // @ts-ignore
          released: value
        };
        assertValidationError(modelInfoSpec, 'released', formatMessage(message, 'released'));
      });
    });

    describe("Fail validation of 'version'", () => {
      test.each([
        ["undefined", undefined, "Path `{0}` is required."],
        ["null", null, "Path `{0}` is required."],
        ["Too long version", getTestString(VERSION_MAX_LENGTH + 1), `Version must be at most ${VERSION_MAX_LENGTH}`]
      ])("Fail validation 'version' because it is %s", (caseDescription, value, message) => {
        const modelInfoSpec: Partial<IModelInfo> = {
          // @ts-ignore
          version: value
        };
        assertValidationError(modelInfoSpec, 'version', formatMessage(message, 'version'));
      });
    });

/* REDUNDANT as it is covered by the individual locale properties
  describe("Fail validation of 'locale entity'", () => {
      test.each([
        ["undefined", undefined, "Path `{0}` is required."],
        ["null", null, "Path `{0}` is required."],
      ])("Fail validation 'locale entity' because it is %s", (caseDescription, value, message) => {
        const modelInfoSpec: Partial<IModelInfo> = {
          // @ts-ignore
          locale: value
        };
        assertValidationError(modelInfoSpec, 'locale', formatMessage(message, 'locale'));
      });
    });

 */

    describe("Fail validation of 'locale.UUID'", () => {
      test.each([
        ["undefined", undefined, "Path `{0}` is required."],
        ["null", null, "Path `{0}` is required."],
        ["empty", "", "Path `{0}` is required."],
        ["only whitespace characters", WHITESPACE, `Validator failed for path \`{0}\` with value \`${WHITESPACE}\``],
        ["not a UUID v4", "foo", "Validator failed for path `{0}` with value `foo`"]
      ])("Fail validation 'locale UUID' because it is %s", (caseDescription, value, message) => {
        const modelInfoSpec: Partial<IModelInfo> = {
          // @ts-ignore
          locale: {UUID: value}
        };
        assertValidationError(modelInfoSpec, 'locale.UUID', formatMessage(message, 'locale.UUID'));
      });
    });

    describe("Fail validation of 'locale.name'", () => {
      test.each([
        ["undefined", undefined, "Path `{0}` is required."],
        ["null", null, "Path `{0}` is required."],
        ["Too long locale name", getTestString(NAME_MAX_LENGTH + 1), `Name must be at most ${NAME_MAX_LENGTH}`]
      ])("Fail validation 'locale name' because it is %s", (caseDescription, value, message) => {
        const modelInfoSpec: Partial<IModelInfo> = {
          // @ts-ignore
          locale: {name: value}
        };
        assertValidationError(modelInfoSpec, 'locale.name', formatMessage(message, 'locale.name'));
      });
    });

    describe("Fail validation of 'locale.shortCode'", () => {
      test.each([
        ["undefined", undefined, "Path `{0}` is required."],
        ["null", null, "Path `{0}` is required."],
        ["Too long locale name", getTestString(SHORTCODE_MAX_LENGTH + 1), `Short code must be at most ${SHORTCODE_MAX_LENGTH}`]
      ])("Fail validation 'locale shortCode' because it is %s", (caseDescription, value, message) => {
        const modelInfoSpec: Partial<IModelInfo> = {
          // @ts-ignore
          locale: {shortCode: value}
        };
        assertValidationError(modelInfoSpec, 'locale.shortCode', formatMessage(message, 'locale.shortCode'));
      });
    });
  })
});