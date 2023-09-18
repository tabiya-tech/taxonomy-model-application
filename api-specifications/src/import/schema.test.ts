import ImportAPISpecs from "./index";
import {getMockId} from "_test_utilities/mockMongoId";
import {WHITESPACE} from "_test_utilities/specialCharacters";
import {RegExp_Str_NotEmptyString} from "regex";
import {
  assertValidationErrors, testSchemaWithInvalidObject, testSchemaWithValidObject, testValidSchema
} from "../_test_utilities/stdSchemaTests";

describe('Test the Import Schema', () => {
  // GIVEN the ImportAPISpecs.Schemas.POST.Request.Payload schema

  // WHEN the schema is validated
  // THEN expect the schema to be valid
  testValidSchema("ImportAPISpecs.Schemas.POST.Request.Payload", ImportAPISpecs.Schemas.POST.Request.Payload);
});


describe('Validate JSON against the Import Schema', () => {

  // GIVEN a valid ImportRequest object
  const givenValidImportRequest: ImportAPISpecs.Types.POST.Request.Payload = {
    modelId: getMockId(2), filePaths: {
      ESCO_OCCUPATION: "folder/file1",
      ESCO_SKILL_HIERARCHY: "folder/file2",
      ESCO_SKILL_GROUP: "folder/file3",
      ESCO_SKILL: "folder/file4",
      ESCO_SKILL_SKILL_RELATIONS: "folder/file5",
      ISCO_GROUP: "folder/file6",
      LOCAL_OCCUPATION: "folder/file7",
      LOCALIZED_OCCUPATION: "folder/file8",
      MODEL_INFO: "folder/file9",
      OCCUPATION_HIERARCHY: "folder/file10",
      OCCUPATION_LOGS: "folder/file11",
      OCCUPATION_LOG_CHANGES: "folder/file12",
      OCCUPATION_SKILL_RELATION: "folder/file13"
    }
  }

  describe('Successful validation of Import', () => {
    // WHEN the object is validated
    // THEN expect the object to validate successfully
    testSchemaWithValidObject("ImportAPISpecs.Schemas.POST.Request.Payload", ImportAPISpecs.Schemas.POST.Request.Payload, givenValidImportRequest)

    // AND for each of the possible filetypes given in the filepaths
    describe("Should validate with any of the possible filetypes", () => {
      Object.values(ImportAPISpecs.Constants.ImportFileTypes).forEach((value) => {
        describe(`Import object should validate because it has ${value}`, () => {
          // GIVEN a valid Import object
          const givenValidImportRequestWithValue: ImportAPISpecs.Types.POST.Request.Payload = {
            modelId: getMockId(2), filePaths: {
              [value]: "folder/file6",
            }
          }

          // WHEN the object is validated
          // THEN expect the object to validate successfully
          testSchemaWithValidObject(`ImportAPISpecs.Schemas.POST.Request.Payload`, ImportAPISpecs.Schemas.POST.Request.Payload, givenValidImportRequestWithValue)
        });
      });
    })
  })

  describe('Failed validation of Import', () => {

    // WHEN the object has additional properties
    // THEN expect the object to not validate
    testSchemaWithInvalidObject("ImportAPISpecs.Schemas.POST.Request.Payload", ImportAPISpecs.Schemas.POST.Request.Payload, givenValidImportRequest)

    describe("Fail validation of 'modelId'", () => {
      test.each([
        // GIVEN an undefined modelId
        ["undefined", undefined, { instancePath: "", keyword: "required", message: "must have required property 'modelId'"}],
        // OR GIVEN a null modelId
        ["null", null, {instancePath: "/modelId", keyword: "type", message: "must be string"}],
        // OR GIVEN a malformed modelId
        ["malformed", "foo", { instancePath: "/modelId", keyword: "pattern", message: "must match pattern \"^[0-9a-f]{24}$\""}],
      ])("Fail validation of Import 'modelId' because it is %s", (caseDescription, value, failure) => {

        // GIVEN an Import object with the given modelId
        const importRequestSpec: Partial<ImportAPISpecs.Types.POST.Request.Payload> = {
          // @ts-ignore
          modelId: value,
        }

        // WHEN the object is validated

        // THEN expect the object to not validate with the expected errors
        assertValidationErrors(importRequestSpec, ImportAPISpecs.Schemas.POST.Request.Payload, [expect.objectContaining({
          instancePath: failure.instancePath, keyword: failure.keyword, message: failure.message
        })]);
      })
    })

    describe("Fail validation of 'filePaths'", () => {
      test.each([["undefined", undefined, {
        instancePath: "", keyword: "required", message: "must have required property 'filePaths'"
      }],

        // GIVEN a null filePaths object
        ["null", null, { instancePath: "/filePaths", keyword: "type", message: "must be object" }],
        // OR GIVEN a malformed filePaths object
        ["malformed", "foo", { instancePath: "/filePaths", keyword: "type", message: "must be object" }],
        // OR GIVEN an empty filePaths object
        ["all files missing", {}, { instancePath: "/filePaths", keyword: "anyOf", message: "must match a schema in anyOf" }],
      ])("Fail validation of Import 'filePaths' because it is %s", (caseDescription, value, failure) => {
        // GIVEN an Import object with the given filePaths
        const importRequestSpec: Partial<ImportAPISpecs.Types.POST.Request.Payload> = {
          // @ts-ignore
          filePaths: value,
        }

        // WHEN the object is validated

        // THEN expect the object to not validate with the expected errors
        assertValidationErrors(importRequestSpec, ImportAPISpecs.Schemas.POST.Request.Payload, [expect.objectContaining({
          instancePath: failure.instancePath, keyword: failure.keyword, message: failure.message
        })]);
      })
    })

    describe("Fail validation of 'filePaths.{filetype}'", () => {
      Object.values(ImportAPISpecs.Constants.ImportFileTypes).forEach((fileType) => {
        test.each([["null", null, {
          instancePath: `/filePaths/${fileType}`, keyword: "type", message: "must be string"
        }],

          // GIVEN a filePaths object with an empty string
          ["empty", "", {
          instancePath: `/filePaths/${fileType}`,
          keyword: "pattern",
          message: `must match pattern "${RegExp_Str_NotEmptyString}"`  }],
          // OR GIVEN a filePaths object with only whitespace characters
          ["only whitespace characters", WHITESPACE, {
          instancePath: `/filePaths/${fileType}`,
          keyword: "pattern",
          message: `must match pattern "${RegExp_Str_NotEmptyString}"` }],
          // OR GIVEN a filePaths object with a string that is too long
          [`more than ${ImportAPISpecs.Constants.FILEPATH_MAX_LENGTH} characters`, "a".repeat(ImportAPISpecs.Constants.FILEPATH_MAX_LENGTH + 1), {
          instancePath: `/filePaths/${fileType}`,
          keyword: "maxLength",
          message: `must NOT have more than ${ImportAPISpecs.Constants.FILEPATH_MAX_LENGTH} characters` }],
        ])(`Fail validation of Import 'urls.${fileType}' because it is %s`, (caseDescription, value, failure) => {

          // GIVEN an Import object with the given filePaths
          const importRequestSpec: Partial<ImportAPISpecs.Types.POST.Request.Payload> = {
            // @ts-ignore
            filePaths: {
              [fileType]: value
            },
          }

          // WHEN the object is validated

          // THEN expect the object to not validate with the expected errors
          assertValidationErrors(importRequestSpec, ImportAPISpecs.Schemas.POST.Request.Payload, [expect.objectContaining({
            instancePath: failure.instancePath, keyword: failure.keyword, message: failure.message
          })]);
        })
      })
    })
  })
});