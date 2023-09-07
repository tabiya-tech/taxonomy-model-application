// Suppress chatty console during the tests
import "_test_utilities/consoleMock"

import Ajv from 'ajv';
import {randomUUID} from "crypto";
import {Connection} from "mongoose";

import Locale from "api-specifications/locale";
import ModelInfo from "api-specifications/modelInfo"

import {getRandomString, getTestString} from "_test_utilities/specialCharacters";
import {HTTP_VERBS, StatusCodes} from "server/httpUtils";
import {handler as modelHandler} from "./index";
import addFormats from "ajv-formats";
import {initOnce} from "server/init";
import {getConnectionManager} from "server/connection/connectionManager";
import {getTestConfiguration} from "_test_utilities/getTestConfiguration";
import {getRepositoryRegistry} from "../server/repositoryRegistry/repositoryRegisrty";

async function createModelsInDB(count: number) {
  for (let i = 0; i < count; i++) {
    await getRepositoryRegistry().modelInfo.create({
      name: getTestString(ModelInfo.Constants.NAME_MAX_LENGTH),
      locale: {
        UUID: randomUUID(),
        name: getTestString(ModelInfo.Constants.NAME_MAX_LENGTH),
        shortCode: getTestString(ModelInfo.Constants.LOCALE_SHORTCODE_MAX_LENGTH)
      },
      description: getTestString(ModelInfo.Constants.DESCRIPTION_MAX_LENGTH),
    });
  }
}

describe("Test for model handler with a DB", () => {

  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("ModelInfoHandlerTestDB");
    jest.spyOn(require("server/config/config"), "readEnvironmentConfiguration").mockReturnValue(config);
    await initOnce();
    dbConnection = getConnectionManager().getCurrentDBConnection();
  });

  afterAll(async () => {
    if (dbConnection) {
      await dbConnection.dropDatabase();
      await dbConnection.close();
    }
  });
  beforeEach(async () => {
    if (dbConnection) {
      // delete all documents in the DB
      await dbConnection.models.ModelInfo.deleteMany({});
    }
  });

  test("POST should respond with the CREATED status code and the response passes the JSON Schema validation", async () => {
    // GIVEN a valid request (method & header & payload)
    const givenPayload: ModelInfo.POST.Request.Payload = {
      name: getRandomString(ModelInfo.Constants.NAME_MAX_LENGTH),
      locale: {
        UUID: randomUUID(),
        name: getRandomString(ModelInfo.Constants.NAME_MAX_LENGTH),
        shortCode: getRandomString(ModelInfo.Constants.LOCALE_SHORTCODE_MAX_LENGTH)
      },
      description: getRandomString(ModelInfo.Constants.DESCRIPTION_MAX_LENGTH)
    }
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: {
        'Content-Type': 'application/json'
      }
    }

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await modelHandler(givenEvent);

    // THEN expect the handler to respond with the CREATED status code
    expect(actualResponse.statusCode).toEqual(StatusCodes.CREATED);
    // AND a modelInfo object that validates against the ModelInfoRequest schema
    const ajv = new Ajv({validateSchema: true, strict: true, allErrors: true});
    addFormats(ajv);
    ajv.addSchema(Locale.Schema);
    ajv.addSchema(ModelInfo.POST.Response.Schema);
    const validateResponse = ajv.compile(ModelInfo.POST.Response.Schema);
    validateResponse(JSON.parse(actualResponse.body));
    expect(validateResponse.errors).toBeNull();
  });

  test("GET should respond with the OK status code and the response passes the JSON Schema validation", async () => {
    // GIVEN a valid request (method & header)
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      headers: {
        'Content-Type': 'application/json'
      }
    }
    // AND several modelInfo objects are in the DB
    await createModelsInDB(3);

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await modelHandler(givenEvent);

    // THEN expect the handler to respond with the OK status code
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    // AND a modelInfo object that validates against the ModelInfoResponseGET schema
    const ajv = new Ajv({validateSchema: true, strict: true, allErrors: true});
    addFormats(ajv);
    ajv.addSchema(Locale.Schema);
    ajv.addSchema(ModelInfo.GET.Response.Schema);
    const validateResponse = ajv.compile(ModelInfo.GET.Response.Schema);
    validateResponse(JSON.parse(actualResponse.body));
    expect(validateResponse.errors).toBeNull();
  });
})