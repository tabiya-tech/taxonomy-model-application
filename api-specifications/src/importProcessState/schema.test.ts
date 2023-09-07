import Ajv, {ValidateFunction} from "ajv";
import addFormats from "ajv-formats";
import ImportProcessState from './index'
import {getMockId} from "../_test_utilities/mockMongoId";


describe('Test the ImportProcessState Schema', () => {
  test("The ImportProcessState module can be required via the index", () => {
    //GIVEN the  module
    //WHEN the module is required via the index
    expect(() => {
      // THEN Check if the module can be required without error
      expect(() => {
        require('./');
      }).not.toThrowError();
      const importProcessStateModule = require('./').default;
      // AND check if Schema is defined in it
      expect(importProcessStateModule.Schemas.GET.Response.Payload).toBeDefined();
      // AND check if the enums are defined in it
      expect(importProcessStateModule.Enums.Status).toBeDefined();
    }).not.toThrowError();
  })

  test("The ImportProcessState schema is a valid Schema", () => {
    const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
    addFormats(ajv);
    expect(() => {
      ajv.addSchema(ImportProcessState.Schemas.GET.Response.Payload, ImportProcessState.Schemas.GET.Response.Payload.$id);
      ajv.getSchema(ImportProcessState.Schemas.GET.Response.Payload.$id as string);
    }).not.toThrowError();
  });
});

describe('Validate JSON against the ImportProcessState Schema', () => {
  const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
  addFormats(ajv);
  ajv.addSchema(ImportProcessState.Schemas.GET.Response.Payload, ImportProcessState.Schemas.GET.Response.Payload.$id);
  let validateFunction = ajv.getSchema(ImportProcessState.Schemas.GET.Response.Payload.$id as string) as ValidateFunction;

  test("A valid ImportProcessState object validates", () => {
    // GIVEN a valid Locale object
    const validImportProcessState: ImportProcessState.Types.GET.Response.Payload = {
      id: getMockId(1),
      modelId: getMockId(2),
      status: ImportProcessState.Enums.Status.PENDING,
      result: {
        errored: false,
        parsingErrors: false,
        parsingWarnings: false,
      },
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }
    // WHEN the object is validated
    const result = validateFunction(validImportProcessState);

    // THEN no errors are returned
    expect(validateFunction.errors).toBeNull();
    // AND the object validates
    expect(result).toBeTruthy();
  });

  test("An ImportProcessState object with extra properties does not validate", () => {
    // GIVEN a Locale object with extra properties
    const validImportProcessState: ImportProcessState.Types.GET.Response.Payload = {
      id: getMockId(1),
      modelId: getMockId(2),
      status: ImportProcessState.Enums.Status.PENDING,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      // @ts-ignore
      extraProperty: "bar"
    }
    // WHEN the object is validated
    const result = validateFunction(validImportProcessState);

    // THEN no errors are returned
    expect(validateFunction.errors).not.toBeNull();
    // AND the object validates
    expect(result).toBeFalsy();
  });
});

