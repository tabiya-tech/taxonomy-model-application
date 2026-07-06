import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
  testUUIDField,
} from "_test_utilities/stdSchemaTests";
import {
  getStdObjectIdTestCases,
  getStdNonEmptyStringTestCases,
  getStdStringTestCases,
} from "_test_utilities/stdSchemaTestCases";
import { assertCaseForProperty, CaseType } from "_test_utilities/assertCaseForProperty";
import ModelInfoAPISpecs from "./index";
import ModelInfoConstants from "./constants";
import LocaleAPISpecs from "locale";
import { getTestString } from "_test_utilities/specialCharacters";
import { getMockId } from "_test_utilities/mockMongoId";
import { randomUUID } from "crypto";

describe("Test ModelInfoReference schema validity", () => {
  testValidSchema("ModelInfoAPISpecs.Schemas.Reference", ModelInfoAPISpecs.Schemas.Reference);
});

describe("Test objects against the ModelInfoAPISpecs.Schemas.Reference schema", () => {
  const givenValidReference = {
    id: getMockId(1),
    UUID: randomUUID(),
    name: getTestString(ModelInfoConstants.NAME_MAX_LENGTH),
    version: getTestString(ModelInfoConstants.VERSION_MAX_LENGTH),
    localeShortCode: getTestString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
  };

  // WHEN the object is a valid reference
  testSchemaWithValidObject(
    "ModelInfoAPISpecs.Schemas.Reference",
    ModelInfoAPISpecs.Schemas.Reference,
    givenValidReference
  );

  // AND a reference where all the nullable fields are null (only UUID is required non-null)
  testSchemaWithValidObject("ModelInfoAPISpecs.Schemas.Reference (nulls)", ModelInfoAPISpecs.Schemas.Reference, {
    id: null,
    UUID: randomUUID(),
    name: null,
    version: null,
    localeShortCode: null,
  });

  // AND additional properties are not allowed
  testSchemaWithAdditionalProperties(
    "ModelInfoAPISpecs.Schemas.Reference",
    ModelInfoAPISpecs.Schemas.Reference,
    givenValidReference
  );

  describe("Validate ModelInfoAPISpecs.Schemas.Reference fields", () => {
    const givenSchema = ModelInfoAPISpecs.Schemas.Reference;

    describe("Test validation of 'id' (nullable)", () => {
      // id can be null, so filter out the standard null-failure case and add a null-success case
      const testCases = getStdObjectIdTestCases("/id").filter((testCase) => testCase[1] !== "null");
      test.each([...testCases, [CaseType.Success, "null", null, undefined]])(
        "(%s) Validate 'id' when it is %s",
        (caseType, _description, givenValue, failureMessages) => {
          assertCaseForProperty("/id", { id: givenValue }, givenSchema, caseType, failureMessages);
        }
      );
    });

    describe("Test validation of 'UUID'", () => {
      testUUIDField("UUID", givenSchema);
    });

    describe("Test validation of 'name' (nullable)", () => {
      const testCases = getStdNonEmptyStringTestCases("/name", ModelInfoConstants.NAME_MAX_LENGTH).filter(
        (testCase) => testCase[1] !== "null"
      );
      test.each([...testCases, [CaseType.Success, "null", null, undefined]])(
        "(%s) Validate 'name' when it is %s",
        (caseType, _description, givenValue, failureMessages) => {
          assertCaseForProperty("/name", { name: givenValue }, givenSchema, caseType, failureMessages);
        }
      );
    });

    describe("Test validation of 'version' (nullable)", () => {
      const testCases = getStdStringTestCases("/version", ModelInfoConstants.VERSION_MAX_LENGTH).filter(
        (testCase) => testCase[1] !== "null"
      );
      test.each([...testCases, [CaseType.Success, "null", null, undefined]])(
        "(%s) Validate 'version' when it is %s",
        (caseType, _description, givenValue, failureMessages) => {
          assertCaseForProperty("/version", { version: givenValue }, givenSchema, caseType, failureMessages);
        }
      );
    });

    describe("Test validation of 'localeShortCode' (nullable)", () => {
      const testCases = getStdNonEmptyStringTestCases(
        "/localeShortCode",
        LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH
      ).filter((testCase) => testCase[1] !== "null");
      test.each([...testCases, [CaseType.Success, "null", null, undefined]])(
        "(%s) Validate 'localeShortCode' when it is %s",
        (caseType, _description, givenValue, failureMessages) => {
          assertCaseForProperty(
            "/localeShortCode",
            { localeShortCode: givenValue },
            givenSchema,
            caseType,
            failureMessages
          );
        }
      );
    });
  });
});
