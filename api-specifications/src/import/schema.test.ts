import ImportAPISpecs from "./index";
import { getMockId } from "_test_utilities/mockMongoId";
import { WHITESPACE } from "_test_utilities/specialCharacters";
import { RegExp_Str_NotEmptyString } from "regex";
import {
  testBooleanField,
  testObjectIdField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";

describe("Test the Import Schema", () => {
  // GIVEN the ImportAPISpecs.Schemas.POST.Request.Payload schema

  // WHEN the schema is validated
  // THEN expect the schema to be valid
  testValidSchema("ImportAPISpecs.Schemas.POST.Request.Payload", ImportAPISpecs.Schemas.POST.Request.Payload);
});

describe("Validate JSON against the Import Schema", () => {
  // GIVEN a valid ImportRequest object
  const givenValidImportRequest: ImportAPISpecs.Types.POST.Request.Payload = {
    modelId: getMockId(2),
    filePaths: {
      OCCUPATION_GROUPS: "folder/file6",
      OCCUPATIONS: "folder/file7",
      ESCO_SKILL_GROUPS: "folder/file3",
      ESCO_SKILLS: "folder/file4",
      OCCUPATION_HIERARCHY: "folder/file10",
      ESCO_SKILL_HIERARCHY: "folder/file2",
      ESCO_SKILL_SKILL_RELATIONS: "folder/file5",
      OCCUPATION_SKILL_RELATIONS: "folder/file13",
      // OCCUPATION_LOGS: "folder/file11",
      // OCCUPATION_LOG_CHANGES: "folder/file12",
    },
    isOriginalESCOModel: true,
  };

  describe("Successful validation of Import", () => {
    // WHEN the object is validated
    // THEN expect the object to validate successfully
    testSchemaWithValidObject(
      "ImportAPISpecs.Schemas.POST.Request.Payload",
      ImportAPISpecs.Schemas.POST.Request.Payload,
      givenValidImportRequest
    );

    // AND for each of the possible filetypes given in the filepaths
    describe("Should validate with any of the possible filetypes", () => {
      Object.values(ImportAPISpecs.Constants.ImportFileTypes).forEach((value) => {
        describe(`Import object should validate because it has ${value}`, () => {
          // GIVEN a valid Import object
          const givenValidImportRequestWithValue: ImportAPISpecs.Types.POST.Request.Payload = {
            modelId: getMockId(2),
            filePaths: {
              [value]: "folder/file6",
            },
            isOriginalESCOModel: true,
          };

          // WHEN the object is validated
          // THEN expect the object to validate successfully
          testSchemaWithValidObject(
            `ImportAPISpecs.Schemas.POST.Request.Payload`,
            ImportAPISpecs.Schemas.POST.Request.Payload,
            givenValidImportRequestWithValue
          );
        });
      });
    });
  });

  describe("Failed validation of Import", () => {
    // WHEN the object has additional properties
    // THEN expect the object to not validate
    testSchemaWithAdditionalProperties(
      "ImportAPISpecs.Schemas.POST.Request.Payload",
      ImportAPISpecs.Schemas.POST.Request.Payload,
      givenValidImportRequest
    );
  });

  describe("Validate the ImportRequest Fields", () => {
    describe("Test validation of modelId", () => {
      testObjectIdField("modelId", ImportAPISpecs.Schemas.POST.Request.Payload);
    });
    describe("Test validation of 'filePaths'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'filePaths'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/filePaths", "type", "must be object")],
        [
          CaseType.Failure,
          "only whitespace characters",
          WHITESPACE,
          constructSchemaError("/filePaths", "type", "must be object"),
        ],
        [CaseType.Failure, "random string", "foo", constructSchemaError("/filePaths", "type", "must be object")],
        [
          CaseType.Failure,
          "empty object",
          {},
          [
            constructSchemaError("/filePaths", "required", "must have required property 'OCCUPATION_GROUPS'"),
            constructSchemaError("/filePaths", "required", "must have required property 'OCCUPATIONS'"),
            constructSchemaError("/filePaths", "required", "must have required property 'ESCO_SKILL_GROUPS'"),
            constructSchemaError("/filePaths", "required", "must have required property 'ESCO_SKILLS'"),
            constructSchemaError("/filePaths", "required", "must have required property 'OCCUPATION_HIERARCHY'"),
            constructSchemaError("/filePaths", "required", "must have required property 'ESCO_SKILL_HIERARCHY'"),
            constructSchemaError("/filePaths", "required", "must have required property 'ESCO_SKILL_SKILL_RELATIONS'"),
            constructSchemaError("/filePaths", "required", "must have required property 'OCCUPATION_SKILL_RELATIONS'"),
          ],
        ],
        [CaseType.Success, "a valid filePaths object", givenValidImportRequest.filePaths, undefined],
      ])("(%s) Validate 'filePaths' when it is %s", (caseType, _description, givenValue, failureMessages) => {
        // GIVEN an object with the given value
        const givenObject: ImportAPISpecs.Types.POST.Request.Payload = {
          // @ts-ignore
          filePaths: givenValue,
        };
        // THEN expect the object to validate accordingly
        assertCaseForProperty(
          "filePaths",
          givenObject,
          ImportAPISpecs.Schemas.POST.Request.Payload,
          caseType,
          failureMessages
        );
      });
    });
    describe("Test validation of 'filePaths/fileType'", () => {
      Object.values(ImportAPISpecs.Constants.ImportFileTypes).forEach((fileType) => {
        test.each([
          [CaseType.Failure, "null", null, constructSchemaError(`/filePaths/${fileType}`, "type", "must be string")],
          [
            CaseType.Failure,
            "empty",
            "",
            constructSchemaError(
              `/filePaths/${fileType}`,
              "pattern",
              `must match pattern "${RegExp_Str_NotEmptyString}"`
            ),
          ],
          [
            CaseType.Failure,
            "only whitespace characters",
            WHITESPACE,
            constructSchemaError(
              `/filePaths/${fileType}`,
              "pattern",
              `must match pattern "${RegExp_Str_NotEmptyString}"`
            ),
          ],
          [
            CaseType.Failure,
            `more than ${ImportAPISpecs.Constants.FILEPATH_MAX_LENGTH} characters`,
            "a".repeat(ImportAPISpecs.Constants.FILEPATH_MAX_LENGTH + 1),
            constructSchemaError(
              `/filePaths/${fileType}`,
              "maxLength",
              `must NOT have more than ${ImportAPISpecs.Constants.FILEPATH_MAX_LENGTH} characters`
            ),
          ],
          [CaseType.Success, "a valid file", "folder/file", undefined],
        ])(
          `(%s) Validate 'filePaths/${fileType}' when it is %s`,
          (caseType, _description, givenValue, failureMessages) => {
            // GIVEN an object with the given value
            // @ts-ignore
            const givenObject: ImportAPISpecs.Types.POST.Request.Payload = {
              filePaths: {
                [fileType]: givenValue,
              },
            };
            // THEN expect the object to validate accordingly
            assertCaseForProperty(
              "filePaths",
              givenObject,
              ImportAPISpecs.Schemas.POST.Request.Payload,
              caseType,
              failureMessages
            );
          }
        );
      });
    });

    describe("Test validation of 'isOriginalESCOModel'", () => {
      testBooleanField("isOriginalESCOModel", ImportAPISpecs.Schemas.POST.Request.Payload);
    });
  });
});
