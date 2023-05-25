import Ajv, {ValidateFunction} from "ajv";
import addFormats from "ajv-formats";
import {ImportFileTypes, ImportRequest, ImportRequestSchema} from "./importRequest";
import {getMockId} from "../_test_utilities/mockMongoId";
import {getTestString} from "../_test_utilities/specialCharacters";

describe('Test the ImportRequest Schema', () => {
  test("The ImportRequestSchema module can be required via the index", () => {
    expect(() => {
      expect(require("import").ImportRequestSchema).toBeDefined();
    }).not.toThrowError();
  })

  test("The ImportRequest schema is a valid Schema", () => {
    const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
    addFormats(ajv);
    expect(() => {
      ajv.addSchema(ImportRequestSchema, ImportRequestSchema.$id);
    }).not.toThrowError();
  });
});


describe('Validate JSON against the ImportRequest Schema', () => {
  const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
  addFormats(ajv);
  ajv.addSchema(ImportRequestSchema, ImportRequestSchema.$id);

  let validateFunction = ajv.getSchema(ImportRequestSchema.$id as string) as ValidateFunction;

  describe('Successful validation of ImportRequest', () => {
    test("A valid ImportRequest object validates", () => {
      // GIVEN a valid ImportRequest object
      const importRequest: ImportRequest = {
        modelId: getMockId(2),
        urls: {
          ESCO_OCCUPATION: "https://example.com/folder/file1",
          ESCO_SKILL_HIERARCHY: "https://example.com/folder/file2",
          ESCO_SKILL_GROUP: "https://example.com/folder/file3",
          ESCO_SKILL: "https://example.com/folder/file4",
          ESCO_SKILL_SKILL_RELATIONS: "https://example.com/folder/file5",
          ISCO_GROUP: "https://example.com/folder/file6",
          LOCAL_OCCUPATION: "https://example.com/folder/file7",
          LOCALIZED_OCCUPATION: "https://example.com/folder/file8",
          MODEL_INFO: "https://example.com/folder/file9",
          OCCUPATION_HIERARCHY: "https://example.com/folder/file10",
          OCCUPATION_LOGS: "https://example.com/folder/file11",
          OCCUPATION_LOG_CHANGES: "https://example.com/folder/file12",
          OCCUPATION_SKILL_RELATION: "https://example.com/folder/file13"
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

      const values = Object.values(ImportFileTypes);
      values.forEach((fileType) => {
        test(`ImportRequest object should validate because it has ${fileType}`, () => {
          // GIVEN a valid ImportRequest object
          const importRequest: ImportRequest = {
            modelId: getMockId(2),
            urls: {
              [fileType]: "https://example.com/folder/file6",
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
        ["undefined", null, {instancePath: "/modelId", keyword: "type", message: "must be string"}],
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

    describe("Fail validation of 'urls'", () => {
      test.each([
        ["undefined", undefined, {
          instancePath: "",
          keyword: "required",
          message: "must have required property 'urls'"
        }],
        ["undefined", null, {instancePath: "/urls", keyword: "type", message: "must be object"}],
        ["malformed", "foo", {instancePath: "/urls", keyword: "type", message: "must be object"}],
        ["all files missing", {}, {instancePath: "/urls", keyword: "anyOf", message: "must match a schema in anyOf"}],
      ])("Fail validation of ImportRequest 'urls' because it is %s", (caseDescription, value, failure) => {
        const importRequestSpec: Partial<ImportRequest> = {
          // @ts-ignore
          urls: value,
        }
        assertValidationErrors(importRequestSpec, failure);
      })
    })

    describe("Fail validation of 'urls.uri'", () => {

      const values = Object.values(ImportFileTypes);
      values.forEach((fileType) => {
        test.each([
          ["malformed uri", {[fileType]: getTestString(5)}, {
            instancePath: `/urls/${fileType}`,
            keyword: "format",
            message: "must match format \"uri\""
          }],
        ])(`Fail validation of ImportRequest 'urls.${fileType}' because it is %s`, (caseDescription, value, failure) => {
          const importRequestSpec: Partial<ImportRequest> = {
            urls: value,
          }
          assertValidationErrors(importRequestSpec, failure);
        })
      })

    })

  })
});