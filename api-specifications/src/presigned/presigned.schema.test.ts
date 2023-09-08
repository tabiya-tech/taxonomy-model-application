import Ajv, {ValidateFunction} from "ajv";
import Presigned from "./index";
import addFormats from "ajv-formats";
import {getTestString} from "../_test_utilities/specialCharacters";

describe('Test the PresignedSchema', () => {
  test("The PresignedSchema can be required via the index", () => {
    // GIVEN the ModelInfo module
    // WHEN the module is required via the index
    // THEN it should not throw an error
    expect(() => {
      require('./');
    }).not.toThrowError();

    let presignedModule = require('./').default;
    // AND the schema should be defined
    expect(presignedModule.GET.Response.Schema).toBeDefined();

    // AND the constants should be defined
    const Constants = presignedModule.Constants;
    expect(Constants.EXPIRES).toBeDefined();
    expect(Constants.MAX_FILE_SIZE).toBeDefined();
  })

  test("The PresignedSchema is a valid Schema", () => {
    expect(() => {
      const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
      addFormats(ajv);
      ajv.addSchema(Presigned.GET.Response.Schema, Presigned.GET.Response.Schema.$id);
      ajv.getSchema(Presigned.GET.Response.Schema.$id as string);
    }).not.toThrowError();
  });
});

describe('Validate JSON against the PresignedSchema', () => {
  const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
  addFormats(ajv);
  ajv.addSchema(Presigned.GET.Response.Schema, Presigned.GET.Response.Schema.$id);
  ajv.getSchema(Presigned.GET.Response.Schema.$id as string);

  let validateFunction = ajv.getSchema(Presigned.GET.Response.Schema.$id as string) as ValidateFunction;

  test("A valid PresignedResponse object validates", () => {
    // GIVEN a valid ModelInfoResponse object
    const validPresignedResponse: Presigned.GET.Response.Payload = {
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
    const validPresignedResponse: Presigned.GET.Response.Payload = {
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