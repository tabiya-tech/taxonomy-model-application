import Ajv, {ValidateFunction} from "ajv";
import addFormats from "ajv-formats";
import Info from './index';

describe('Test the InfoSchema', () => {
    test("The InfoSchema can be required via the index", () => {
      //GIVEN the module
      //WHEN the module is required via the index
      expect(() => {
        // THEN Check if the module can be required without error
        expect(() => {
          require('./');
        }).not.toThrowError();
        // AND check if Schema is defined in it
        expect(require("./").default.GET.Response.Schema).toBeDefined();
      }).not.toThrowError();
    })

    test("The InfoSchema is a valid schema", () => {
        expect(() => {
            const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
            addFormats(ajv);
            ajv.addSchema(Info.GET.Response.Schema, Info.GET.Response.Schema.$id);
            ajv.getSchema(Info.GET.Response.Schema.$id as string);
        }).not.toThrowError();
    })
})

describe('Validate JSON against the InfoSchema', () => {
    const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
    addFormats(ajv);
    ajv.addSchema(Info.GET.Response.Schema, Info.GET.Response.Schema.$id);
    ajv.getSchema(Info.GET.Response.Schema.$id as string);

    let validateFunction = ajv.getSchema(Info.GET.Response.Schema.$id as string) as ValidateFunction;

    test("A valid InfoResponse object validates", () => {
        // GIVEN a valid ModelInfoResponse object
        const givenValidInfoResponse: Info.GET.Response.Payload = {
            date: "2023-08-22T14:13:32.439Z",
            branch: "main",
            buildNumber: "972",
            sha: "c7846bd03d8bb709a93cd4eba4b88889e69a0fd2",
            path: "https://dev.tabiya.tech/api/info",
            database: "connected",
        };
        
        // WHEN the object is validated
        const actualResult =  validateFunction(givenValidInfoResponse);

        // THEN no errors are returned
        expect(validateFunction.errors).toBeNull();
        // AND the object validates
        expect(actualResult).toBeTruthy();
    });


    test("A InfoResponse object with extra properties does not validate", () => {
        // GIVEN a valid ModelInfoResponse object
        const givenInvalidInfoResponse: Info.GET.Response.Payload = {
            date: "2023-08-22T14:13:32.439Z",
            branch: "main",
            buildNumber: "972",
            sha: "c7846bd03d8bb709a93cd4eba4b88889e69a0fd2",
            path: "https://dev.tabiya.tech/api/info",
            database: "connected",
            // @ts-ignore
            extraProperty: "extraProperty"
        };

        // WHEN the object is validated
        const result = validateFunction(givenInvalidInfoResponse);

        // THEN errors are returned
        expect(validateFunction.errors).not.toBeNull();
        // AND the object does not validate
        expect(result).toBeFalsy();
    });
});