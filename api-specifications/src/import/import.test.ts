import Ajv, {ValidateFunction} from "ajv";
import * as Import from "./index";
import {getMockId} from "_test_utilities/mockMongoId";
import {WHITESPACE} from "_test_utilities/specialCharacters";
import {RegExp_Str_NotEmptyString} from "regex";
import {ImportRequest} from "./import.types";

describe('Test the Import Schema', () => {
  test("The ImportSchema module can be required via the index", () => {
    expect(() => {
      expect(require("import").Schema).toBeDefined();
    }).not.toThrowError();
  })

  test("The Import schema is a valid Schema", () => {
    const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
    expect(() => {
      ajv.addSchema(Import.Schema.POST.Request, Import.Schema.POST.Request.$id);
    }).not.toThrowError();
  });
});


describe('Validate JSON against the Import Schema', () => {
  const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
  ajv.addSchema(Import.Schema.POST.Request, Import.Schema.POST.Request.$id);

  let validateFunction = ajv.getSchema(Import.Schema.POST.Request.$id as string) as ValidateFunction;

  describe('Successful validation of Import', () => {
    test("A valid Import object validates", () => {
      // GIVEN a valid Import object
      const importRequest: Import.Types.ImportRequest= {
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

    describe("At least of urls files Import object should validate", () => {

      Object.values(Import.Types.ImportFileTypes).forEach((value) => {
        test(`Import object should validate because it has ${value}`, () => {
          // GIVEN a valid Import object
          const importRequest: Import.Types.ImportRequest = {
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

  describe('Failed validation of Import', () => {
    function assertValidationErrors(importRequest: Partial<Import.Types.ImportRequest>, failure: {
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
      ])("Fail validation of Import 'modelId' because it is %s", (caseDescription, value, failure) => {
        const importRequestSpec: Partial<Import.Types.ImportRequest> = {
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
      ])("Fail validation of Import 'filePaths' because it is %s", (caseDescription, value, failure) => {
        const importRequestSpec: Partial<Import.Types.ImportRequest> = {
          // @ts-ignore
          filePaths: value,
        }
        assertValidationErrors(importRequestSpec, failure);
      })
    })

    describe("Fail validation of 'filePaths.{filetype}'", () => {
      Object.values(Import.Types.ImportFileTypes).forEach((fileType) => {
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
          [`more than ${Import.Constants.FILEPATH_MAX_LENGTH} characters`, "a".repeat(Import.Constants.FILEPATH_MAX_LENGTH + 1), {
            instancePath: `/filePaths/${fileType}`,
            keyword: "maxLength",
            message: `must NOT have more than ${Import.Constants.FILEPATH_MAX_LENGTH} characters`
          }],
        ])(`Fail validation of Import 'urls.${fileType}' because it is %s`, (caseDescription, value, failure) => {
          const importRequestSpec: Partial<Import.Types.ImportRequest> = {
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