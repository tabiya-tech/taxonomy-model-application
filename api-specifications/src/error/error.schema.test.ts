import Ajv from "ajv";
import addFormats from "ajv-formats";
import APIError from "./index"

describe('Test the ErrorResponse Schema', () => {
  test("The ModelInfoRequestSchema module can be required via the index", () => {
    //GIVEN the module
    //WHEN the module is required via the index
    expect(() => {
      // THEN Check if the module can be required without error
      expect(() => {
        require('./');
      }).not.toThrowError();
      let apiErrorModule = require('./').default;
      // AND check if Schema is defined in it
      expect(apiErrorModule.POST.Response.Schema).toBeDefined();
      // AND check if all the Constants are defined
      const Constants = apiErrorModule.Constants;
      expect(Constants.ErrorCodes).toBeDefined();
      expect(Constants.ReasonPhrases).toBeDefined();
    }).not.toThrowError();
  })

  test("The ErrorResponse schema is a valid Schema", () => {
    const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
    addFormats(ajv);
    expect(() => {
      ajv.addSchema(APIError.POST.Response.Schema, APIError.POST.Response.Schema.$id);
      ajv.getSchema(APIError.POST.Response.Schema.$id as string);
    }).not.toThrowError();
  });
});