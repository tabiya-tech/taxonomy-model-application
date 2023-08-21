import Ajv, {ValidateFunction} from "ajv";
import addFormats from "ajv-formats";
import {IInfoResponse, InfoResponseSchema} from "./InfoResponse";

describe('Test the InfoResponseSchema', () => {
    test("The InfoResponseSchema can be required via the index", () => {
        expect(() => {
            expect(require("info/index").InfoResponseSchema).toBeDefined();
        }).not.toThrowError();
    })

    test("The InfoResponseSchema is a valid schema", () => {
        expect(() => {
            const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
            addFormats(ajv);
            ajv.addSchema(InfoResponseSchema, InfoResponseSchema.$id);
            ajv.getSchema(InfoResponseSchema.$id as string);
        }).not.toThrowError();
    })
})

describe('Validate JSON against the InfoResponseSchema', () => {
    const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
    addFormats(ajv);
    ajv.addSchema(InfoResponseSchema, InfoResponseSchema.$id);
    ajv.getSchema(InfoResponseSchema.$id as string);

    let validateFunction = ajv.getSchema(InfoResponseSchema.$id as string) as ValidateFunction;

    test("A valid InfoResponse object validates", () => {
        // GIVEN a valid ModelInfoResponse object
        const givenValidInfoResponse: IInfoResponse = {
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
        const givenInvalidInfoResponse: IInfoResponse = {
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