import Ajv from "ajv";
import addFormats from "ajv-formats";
import * as APIError from "./index"

describe('Test the ErrorResponse Schema', () => {
  test("The ModelInfoRequestSchema module can be required via the index", () => {
    expect(() => {
      expect(require("error/index").Schema).toBeDefined();
    }).not.toThrowError();
  })

  test("The ErrorResponse schema is a valid Schema", () => {
    const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
    addFormats(ajv);
    expect(() => {
      ajv.addSchema(APIError.Schema.POST.Response, APIError.Schema.POST.Response.$id);
      ajv.getSchema(APIError.Schema.POST.Response.$id as string);
    }).not.toThrowError();
  });
});