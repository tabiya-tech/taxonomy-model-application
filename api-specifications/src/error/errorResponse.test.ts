import Ajv from "ajv";
import addFormats from "ajv-formats";
import {ErrorResponseSchema} from "./errorResponse";

describe('Test the ErrorResponse Schema', () => {
  test("The ModelInfoRequestSchema module can be required via the index", () => {
    expect(() => {
      expect(require("error/index").ErrorResponseSchema).toBeDefined();
    }).not.toThrowError();
  })

  test("The ErrorResponse schema is a valid Schema", () => {
    const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
    addFormats(ajv);
    expect(() => {
      ajv.addSchema(ErrorResponseSchema, ErrorResponseSchema.$id);
      ajv.getSchema(ErrorResponseSchema.$id as string);
    }).not.toThrowError();
  });
});