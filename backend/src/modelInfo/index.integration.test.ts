// Suppress chatty console during the tests
import "_test_utilities/consoleMock";

import Ajv from "ajv";
import { randomUUID } from "crypto";
import { Connection } from "mongoose";

import LocaleAPISpecs from "api-specifications/locale";
import ModelInfoAPISpecs from "api-specifications/modelInfo";

import { getRandomString, getTestString } from "_test_utilities/specialCharacters";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { handler as modelHandler } from "./index";
import addFormats from "ajv-formats";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";

async function createModelsInDB(count: number) {
  for (let i = 0; i < count; i++) {
    await getRepositoryRegistry().modelInfo.create({
      name: getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
      locale: {
        UUID: randomUUID(),
        name: getTestString(LocaleAPISpecs.Constants.NAME_MAX_LENGTH),
        shortCode: getTestString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
      },
      description: getTestString(ModelInfoAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    });
  }
}

describe("Test for model handler with a DB", () => {
  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("ModelInfoHandlerTestDB");
    const configModule = await import("server/config/config");
    jest.spyOn(configModule, "readEnvironmentConfiguration").mockReturnValue(config);
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
    const givenPayload: ModelInfoAPISpecs.Types.POST.Request.Payload = {
      name: getRandomString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
      locale: {
        UUID: randomUUID(),
        name: getRandomString(LocaleAPISpecs.Constants.NAME_MAX_LENGTH),
        shortCode: getRandomString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
      },
      description: getRandomString(ModelInfoAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: {
        "Content-Type": "application/json",
      },
    };

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await modelHandler(givenEvent);

    // THEN expect the handler to respond with the CREATED status code
    expect(actualResponse.statusCode).toEqual(StatusCodes.CREATED);
    // AND a modelInfo object that validates against the ModelInfoRequest schema
    const ajv = new Ajv({
      validateSchema: true,
      strict: true,
      allErrors: true,
    });
    addFormats(ajv);
    ajv.addSchema(LocaleAPISpecs.Schemas.Payload);
    ajv.addSchema(ModelInfoAPISpecs.Schemas.POST.Response.Payload);
    const validateResponse = ajv.compile(ModelInfoAPISpecs.Schemas.POST.Response.Payload);
    validateResponse(JSON.parse(actualResponse.body));
    expect(validateResponse.errors).toBeNull();
  });

  test("GET should respond with the OK status code and the response passes the JSON Schema validation", async () => {
    // GIVEN a valid request (method & header)
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      headers: {
        "Content-Type": "application/json",
      },
    };
    // AND several modelInfo objects are in the DB
    await createModelsInDB(3);

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await modelHandler(givenEvent);

    // THEN expect the handler to respond with the OK status code
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    // AND a modelInfo object that validates against the ModelInfoResponseGET schema
    const ajv = new Ajv({
      validateSchema: true,
      strict: true,
      allErrors: true,
    });
    addFormats(ajv);
    ajv.addSchema(LocaleAPISpecs.Schemas.Payload);
    ajv.addSchema(ModelInfoAPISpecs.Schemas.GET.Response.Payload);
    const validateResponse = ajv.compile(ModelInfoAPISpecs.Schemas.GET.Response.Payload);
    validateResponse(JSON.parse(actualResponse.body));
    expect(validateResponse.errors).toBeNull();
  });
});
