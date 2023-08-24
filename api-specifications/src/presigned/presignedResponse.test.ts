import Ajv, {ValidateFunction} from "ajv";
import {IPresignedResponse, PresignedResponseSchema,} from "./presignedResponse";
import addFormats from "ajv-formats";
import {getTestString} from "../_test_utilities/specialCharacters";

describe('Test the PresignedResponseSchema', () => {
  test("The PresignedResponseSchema can be required via the index", () => {
    expect(() => {
      expect(require("presigned/index").PresignedResponseSchema).toBeDefined();
    }).not.toThrowError();
  })

  test("The PresignedResponseSchema is a valid Schema", () => {
    expect(() => {
      const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
      addFormats(ajv);
      ajv.addSchema(PresignedResponseSchema, PresignedResponseSchema.$id);
      ajv.getSchema(PresignedResponseSchema.$id as string);
    }).not.toThrowError();
  });
});

describe('Validate JSON against the PresignedResponseSchema', () => {
  const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
  addFormats(ajv);
  ajv.addSchema(PresignedResponseSchema, PresignedResponseSchema.$id);
  ajv.getSchema(PresignedResponseSchema.$id as string);

  let validateFunction = ajv.getSchema(PresignedResponseSchema.$id as string) as ValidateFunction;

  test("A valid PresignedResponse object validates", () => {
    // GIVEN a valid ModelInfoResponse object
    const validPresignedResponse: IPresignedResponse = {
      url: "https://foo.bar",
      fields: [{name: "name1", value: getTestString(10)}, {name: "name2", value: getTestString(10)}],
      folder: getTestString(10),
    }
    // WHEN the object is validated
    const result = validateFunction(validPresignedResponse);

    // THEN no errors are returned
    expect(validateFunction.errors).toBeNull();
    // AND the object validates
    expect(result).toBeTruthy();
  });

  test("A valid PresignedResponse object with extra properties does not validate", () => {
    // GIVEN a valid ModelInfoResponse object with extra properties
    const validPresignedResponse: IPresignedResponse = {
      url: "https://foo.bar",
      fields: [{name: "name1", value: getTestString(10)}, {name: "name2", value: getTestString(10)}],
      folder: getTestString(10),
      // @ts-ignore
      extraProperty: "extraProperty"
    }
    // WHEN the object is validated
    const result = validateFunction(validPresignedResponse);

    // THEN errors are returned
    expect(validateFunction.errors).not.toBeNull();
    // AND the object does not validate
    expect(result).toBeFalsy();
  });
});