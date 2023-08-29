import Ajv, {ValidateFunction} from "ajv";
import * as Presigned from "./index";
import addFormats from "ajv-formats";
import {getTestString} from "../_test_utilities/specialCharacters";

describe('Test the PresignedSchema', () => {
  test("The PresignedSchema can be required via the index", () => {
    expect(() => {
      expect(require("presigned/index").Schema.POST.Response).toBeDefined();
    }).not.toThrowError();
  })

  test("The PresignedSchema is a valid Schema", () => {
    expect(() => {
      const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
      addFormats(ajv);
      ajv.addSchema(Presigned.Schema.POST.Response, Presigned.Schema.POST.Response.$id);
      ajv.getSchema(Presigned.Schema.POST.Response.$id as string);
    }).not.toThrowError();
  });
});

describe('Validate JSON against the PresignedSchema', () => {
  const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
  addFormats(ajv);
  ajv.addSchema(Presigned.Schema.POST.Response, Presigned.Schema.POST.Response.$id);
  ajv.getSchema(Presigned.Schema.POST.Response.$id as string);

  let validateFunction = ajv.getSchema(Presigned.Schema.POST.Response.$id as string) as ValidateFunction;

  test("A valid PresignedResponse object validates", () => {
    // GIVEN a valid ModelInfoResponse object
    const validPresignedResponse: Presigned.Types.IPresignedResponse = {
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
    const validPresignedResponse: Presigned.Types.IPresignedResponse = {
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