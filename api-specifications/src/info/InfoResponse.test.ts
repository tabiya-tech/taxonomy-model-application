import Ajv, {ValidateFunction} from "ajv";
import addFormats from "ajv-formats";
import {IInfoResponse, InfoResponseSchemaGET} from "./InfoResponse";
import {
    IModelInfoResponse,
    LOCALE_SHORTCODE_MAX_LENGTH,
    NAME_MAX_LENGTH,
    RELEASE_NOTES_MAX_LENGTH,
    VERSION_MAX_LENGTH
} from "../modelInfo";
import {randomUUID} from "crypto";
import {getTestString} from "../_test_utilities/specialCharacters";

describe('Test the InfoResponseSchemaGET', () => {
    test("The InfoResponseSchemaGET can be required via the index", () => {
        expect(() => {
            expect(require("info/index").InfoResponseSchemaGET).toBeDefined();
        }).not.toThrowError();
    })

    test("The InfoResponseSchemaGET is a valid schema", () => {
        expect(() => {
            const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
            addFormats(ajv);
            ajv.addSchema(InfoResponseSchemaGET, InfoResponseSchemaGET.$id);
            ajv.getSchema(InfoResponseSchemaGET.$id as string);
        }).not.toThrowError();
    })
})

describe('Validate JSON against the InfoResponseSchemaGET', () => {
    const ajv = new Ajv({validateSchema: true, allErrors: true, strict: true});
    addFormats(ajv);
    ajv.addSchema(InfoResponseSchemaGET, InfoResponseSchemaGET.$id);
    ajv.getSchema(InfoResponseSchemaGET.$id as string);

    let validateFunction = ajv.getSchema(InfoResponseSchemaGET.$id as string) as ValidateFunction;

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