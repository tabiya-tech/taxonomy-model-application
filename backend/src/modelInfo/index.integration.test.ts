// Suppress chatty console during the tests
import "_test_utilities/consoleMock"

import Ajv from 'ajv';
import {randomUUID} from "crypto";
import {Connection} from "mongoose";

import {
  DESCRIPTION_MAX_LENGTH,
  IModelInfoRequest,
  LOCALE_SHORTCODE_MAX_LENGTH, LocaleSchema, ModelInfoRequestSchema, ModelInfoResponseSchema,
  NAME_MAX_LENGTH
} from "api-specifications/modelInfo";

import {getRandomString} from "../_test_utilities/specialCharacters";
import {HTTP_VERBS, StatusCodes} from "../server/httpUtils";
import {handler as modelHandler} from "./index";
import addFormats from "ajv-formats";
import {getTestConfiguration} from "./testDataHelper";
import {initOnce} from "../server/init";
import {getConnectionManager} from "../server/connection/connectionManager";

describe("test for model handler with a DB", () => {

  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("ModelInfoHandlerTestDB");
    jest.spyOn(require("server/config/config"),  "readEnvironmentConfiguration").mockReturnValue(config);
    await initOnce();
    dbConnection = getConnectionManager().getCurrentDBConnection();
  });

  afterAll(async () => {
    if (dbConnection) {
      await dbConnection.dropDatabase();
      await dbConnection.close();
    }
  });

  test("POST should respond with the CREATED and response passes the JSON Schema validation", async () => {
    // GIVEN a valid request payload

    const givenPayload: IModelInfoRequest = {
      name: getRandomString(NAME_MAX_LENGTH),
      locale: {
        UUID: randomUUID(),
        name: getRandomString(NAME_MAX_LENGTH),
        shortCode: getRandomString(LOCALE_SHORTCODE_MAX_LENGTH)
      },
      description: getRandomString(DESCRIPTION_MAX_LENGTH)
    }
    // WHEN the handler is invoked with the payload
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: {
        'Content-Type': 'application/json'
      }
    }
    // @ts-ignore
    const actualResponse = await modelHandler(givenEvent);

    // THEN expect the handler to respond with the CREATED status code
    expect(actualResponse.statusCode).toEqual(StatusCodes.CREATED);
    // AND a modelInfo object that validates against the ModelInfoRequest schema
    const ajv = new Ajv({validateSchema: true, strict: true, allErrors: true});
    addFormats(ajv);
    ajv.addSchema(LocaleSchema);
    ajv.addSchema(ModelInfoRequestSchema);
    ajv.addSchema(ModelInfoResponseSchema);
    const validateResponse = ajv.compile(ModelInfoResponseSchema);
    validateResponse(JSON.parse(actualResponse.body));
    expect(validateResponse.errors).toBeNull();
  });
})