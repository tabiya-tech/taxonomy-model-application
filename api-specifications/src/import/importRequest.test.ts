import Ajv, {ValidateFunction} from "ajv";
import {FILEPATH_MAX_LENGTH, ImportFileTypes, ImportRequest, ImportRequestSchema} from "./importRequest";
import {getMockId} from "_test_utilities/mockMongoId";
import {WHITESPACE} from "_test_utilities/specialCharacters";
import {RegExp_Str_NotEmptyString} from "regex";

describe('Test the ImportRequest Schema', () => {
  test("The ImportRequestSchema module can be required via the index", () => {
    expect(() => {
      expect(require("import").ImportRequestSchema).toBeDefined();
    }).not.toThrowError();
  })

  test("The ImportRequest schema is a valid Schema", () => {
    const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
    expect(() => {
      ajv.addSchema(ImportRequestSchema, ImportRequestSchema.$id);
    }).not.toThrowError();
  });
});


describe('Validate JSON against the ImportRequest Schema', () => {
  const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
  ajv.addSchema(ImportRequestSchema, ImportRequestSchema.$id);

  let validateFunction = ajv.getSchema(ImportRequestSchema.$id as string) as ValidateFunction;

  describe('Successful validation of ImportRequest', () => {
    test("A valid ImportRequest object validates", () => {
      // GIVEN a valid ImportRequest object
      const importRequest: ImportRequest = {
        modelId: getMockId(2),
        filePaths: {
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
      // WHEN the object is validated
      const result = validateFunction(importRequest);

      // THEN no errors are returned
      expect(validateFunction.errors).toBeNull();
      // AND the object validates
      expect(result).toBeTruthy();
    });

    describe("At least of urls files ImportRequest object should validate", () => {

      Object.values(ImportFileTypes).forEach((value) => {
        test(`ImportRequest object should validate because it has ${value}`, () => {
          // GIVEN a valid ImportRequest object
          const importRequest: ImportRequest = {
            modelId: getMockId(2),
            filePaths: {
              [value]: "folder/file6",
            }
          }
          // WHEN the object is validated
          const result = validateFunction(importRequest);

          // THEN no errors are returned
          expect(validateFunction.errors).toBeNull();
          // AND the object validates
          expect(result).toBeTruthy();
        });
      });
    })
  })

  describe('Failed validation of ImportRequest', () => {
    function assertValidationErrors(importRequest: Partial<ImportRequest>, failure: {
      instancePath: string,
      keyword: string,
      message: string
    }) {
      const result = validateFunction(importRequest);
      expect(result).toBeFalsy();
      expect(validateFunction.errors).not.toBeNull()
      expect(validateFunction.errors).toEqual(expect.arrayContaining(
        [expect.objectContaining({
          instancePath: failure.instancePath,
          keyword: failure.keyword,
          message: failure.message
        })]
      ));
    }

    describe("Fail validation of 'modelId'", () => {
      test.each([
        ["undefined", undefined, {
          instancePath: "",
          keyword: "required",
          message: "must have required property 'modelId'"
        }],
        ["null", null, {instancePath: "/modelId", keyword: "type", message: "must be string"}],
        ["malformed", "foo", {
          instancePath: "/modelId",
          keyword: "pattern",
          message: "must match pattern \"^[0-9a-f]{24}$\""
        }],
      ])("Fail validation of ImportRequest 'modelId' because it is %s", (caseDescription, value, failure) => {
        const importRequestSpec: Partial<ImportRequest> = {
          // @ts-ignore
          modelId: value,
        }
        assertValidationErrors(importRequestSpec, failure);
      })
    })

    describe("Fail validation of 'filePaths'", () => {
      test.each([
        ["undefined", undefined, {
          instancePath: "",
          keyword: "required",
          message: "must have required property 'filePaths'"
        }],
        ["null", null, {instancePath: "/filePaths", keyword: "type", message: "must be object"}],
        ["malformed", "foo", {instancePath: "/filePaths", keyword: "type", message: "must be object"}],
        ["all files missing", {}, {
          instancePath: "/filePaths",
          keyword: "anyOf",
          message: "must match a schema in anyOf"
        }],
      ])("Fail validation of ImportRequest 'filePaths' because it is %s", (caseDescription, value, failure) => {
        const importRequestSpec: Partial<ImportRequest> = {
          // @ts-ignore
          filePaths: value,
        }
        assertValidationErrors(importRequestSpec, failure);
      })
    })

    describe("Fail validation of 'filePaths.{filetype}'", () => {
      Object.values(ImportFileTypes).forEach((fileType) => {
        test.each([
          ["null", null, {instancePath: `/filePaths/${fileType}`, keyword: "type", message: "must be string"}],
          ["empty", "", {
            instancePath: `/filePaths/${fileType}`,
            keyword: "pattern",
            message: `must match pattern "${RegExp_Str_NotEmptyString}"`
          }],
          ["only whitespace characters", WHITESPACE, {
            instancePath: `/filePaths/${fileType}`,
            keyword: "pattern",
            message: `must match pattern "${RegExp_Str_NotEmptyString}"`
          }],
          [`more than ${FILEPATH_MAX_LENGTH} characters`, "a".repeat(FILEPATH_MAX_LENGTH + 1), {
            instancePath: `/filePaths/${fileType}`,
            keyword: "maxLength",
            message: `must NOT have more than ${FILEPATH_MAX_LENGTH} characters`
          }],
        ])(`Fail validation of ImportRequest 'urls.${fileType}' because it is %s`, (caseDescription, value, failure) => {
          const importRequestSpec: Partial<ImportRequest> = {
            // @ts-ignore
            filePaths: {
              [fileType]: value
            },
          }
          assertValidationErrors(importRequestSpec, failure);
        })
      })
    })
  })
});