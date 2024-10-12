// Suppress chatty console during the tests
import "_test_utilities/consoleMock";

import Ajv, { ValidateFunction } from "ajv";
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
import { INewImportProcessStateSpec } from "import/ImportProcessState/importProcessState.types";
import ImportProcessStateAPISpecs from "api-specifications/importProcessState";
import ExportProcessStateAPISpecs from "api-specifications/exportProcessState";
import { INewExportProcessStateSpec } from "export/exportProcessState/exportProcessState.types";
import { IModelInfo } from "./modelInfo.types";
import { usersRequestContext } from "_test_utilities/dataModel";

async function createModelInDB() {
  return await getRepositoryRegistry().modelInfo.create({
    name: getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
    locale: {
      UUID: randomUUID(),
      name: getTestString(LocaleAPISpecs.Constants.NAME_MAX_LENGTH),
      shortCode: getTestString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
    },
    description: getTestString(ModelInfoAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    license: getTestString(ModelInfoAPISpecs.Constants.LICENSE_MAX_LENGTH),
    UUIDHistory: [randomUUID()],
  });
}

async function createModelsInDB(count: number) {
  const models: IModelInfo[] = [];
  for (let i = 0; i < count; i++) {
    models.push(await createModelInDB());
  }
  return models;
}

async function createExportProcessStatesForModel(modelInfo: IModelInfo) {
  // create an export process for the model
  const newExportProcessStateSpecs: INewExportProcessStateSpec = {
    modelId: modelInfo.id,
    result: {
      errored: false,
      exportErrors: false,
      exportWarnings: false,
    },
    status: ExportProcessStateAPISpecs.Enums.Status.PENDING,
    downloadUrl: "https://foo/bar",
    timestamp: new Date(),
  };
  await getRepositoryRegistry().exportProcessState.create(newExportProcessStateSpecs);
}

async function createImportProcessStatesForModel(modelInfo: IModelInfo) {
  // create an import process for the model
  const newImportProcessStateSpecs: INewImportProcessStateSpec = {
    // @ts-ignore
    id: modelInfo.importProcessState.id,
    modelId: modelInfo.id,
    result: {
      errored: false,
      parsingErrors: false,
      parsingWarnings: false,
    },
    status: ImportProcessStateAPISpecs.Enums.Status.PENDING,
  };
  await getRepositoryRegistry().importProcessState.create(newImportProcessStateSpecs);
}

describe("Test for model handler with a DB", () => {
  // set up the ajv validate GET, POST, etc response functions
  const ajv = new Ajv({
    validateSchema: true,
    strict: true,
    allErrors: true,
  });
  addFormats(ajv);
  ajv
    .addSchema(LocaleAPISpecs.Schemas.Payload)
    .addSchema(ModelInfoAPISpecs.Schemas.GET.Response.Payload)
    .addSchema(ModelInfoAPISpecs.Schemas.POST.Response.Payload);
  const validateGETResponse: ValidateFunction = ajv.getSchema(
    ModelInfoAPISpecs.Schemas.GET.Response.Payload.$id as string
  ) as ValidateFunction;
  const validatePOSTResponse: ValidateFunction = ajv.getSchema(
    ModelInfoAPISpecs.Schemas.POST.Response.Payload.$id as string
  ) as ValidateFunction;
  // ---

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

  test("POST should respond with the FORBIDDEN status code if the user is not a model manager", async () => {
    // GIVEN a valid request (method & header & payload)
    const givenPayload: ModelInfoAPISpecs.Types.POST.Request.Payload = {
      name: getRandomString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
      locale: {
        UUID: randomUUID(),
        name: getRandomString(LocaleAPISpecs.Constants.NAME_MAX_LENGTH),
        shortCode: getRandomString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
      },
      license: getRandomString(ModelInfoAPISpecs.Constants.LICENSE_MAX_LENGTH),
      description: getRandomString(ModelInfoAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
      UUIDHistory: [randomUUID()],
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: {
        "Content-Type": "application/json",
      },
      requestContext: usersRequestContext.REGISTED_USER,
    };

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await modelHandler(givenEvent);

    // THEN expect the handler to respond with the FORBIDDEN status code
    expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
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
      license: getRandomString(ModelInfoAPISpecs.Constants.LICENSE_MAX_LENGTH),
      UUIDHistory: [randomUUID()],
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: {
        "Content-Type": "application/json",
      },
      requestContext: usersRequestContext.MODEL_MANAGER,
    };

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await modelHandler(givenEvent);

    // THEN expect the handler to respond with the CREATED status code
    expect(actualResponse.statusCode).toEqual(StatusCodes.CREATED);
    // AND a modelInfo object that validates against the ModelInfoRequest schema
    validatePOSTResponse(JSON.parse(actualResponse.body));
    expect(validatePOSTResponse.errors).toBeNull();
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
    const models = await createModelsInDB(3);
    expect(models.length).toBeGreaterThan(0); // guard to ensure that we actually have models in the DB

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await modelHandler(givenEvent);

    // THEN expect the handler to respond with the OK status code
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);

    // AND a modelInfo object that validates against the ModelInfoResponseGET schema
    validateGETResponse(JSON.parse(actualResponse.body));
    expect(validateGETResponse.errors).toBeNull();
  });

  test("GET should respond with OK status code and the response passes the JSON Schema validation when there are export and import processes states", async () => {
    // GIVEN a valid request (method & header)
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      headers: {
        "Content-Type": "application/json",
      },
    };
    // AND several modelInfo objects are in the DB
    const models = await createModelsInDB(3);
    expect(models.length).toBeGreaterThan(0); // guard to ensure that we actually have models in the DB

    // AND each model has an import and an export process state
    for (const model of models) {
      await createImportProcessStatesForModel(model);
      await createExportProcessStatesForModel(model);
    }

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await modelHandler(givenEvent);

    // THEN expect the handler to respond with the OK status code
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);

    // AND a modelInfo object that validates against the ModelInfoResponseGET schema
    validateGETResponse(JSON.parse(actualResponse.body));
    expect(validateGETResponse.errors).toBeNull();
  });

  // security tests
  test("GET should return only released models for users who are not model managers", async () => {
    // GIVEN a valid request (method & header)
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      headers: {
        "Content-Type": "application/json",
      },
      requestContext: usersRequestContext.REGISTED_USER,
    };

    // AND several modelInfo objects are in the DB
    const models = await createModelsInDB(3);
    expect(models.length).toBeGreaterThan(0); // guard to ensure that we actually have models in the DB

    // AND each model has an import and an export process state
    await Promise.all(
      models.map(async (model) => {
        await createImportProcessStatesForModel(model);
        await createExportProcessStatesForModel(model);
      })
    );

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await modelHandler(givenEvent);
    const actualModels = JSON.parse(actualResponse.body) as IModelInfo[];

    // THEN expect the handler to respond with the OK status code
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);

    const actualReleasedModels = models.filter((model) => model.released);

    // AND the response should only contain released models
    expect(actualModels.length).toBe(actualReleasedModels.length);
    expect(actualModels.map((m) => m.UUID)).toMatchObject(actualReleasedModels.map((m) => m.UUID));
  });

  test("GET should return all models for users model managers", async () => {
    // GIVEN a valid request (method & header)
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      headers: {
        "Content-Type": "application/json",
      },
      requestContext: usersRequestContext.MODEL_MANAGER,
    };

    // AND several modelInfo objects are in the DB
    const models = await createModelsInDB(10);

    // AND each model has an import and an export process state
    await Promise.all(
      models.map(async (model) => {
        await createImportProcessStatesForModel(model);
        await createExportProcessStatesForModel(model);
      })
    );

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await modelHandler(givenEvent);
    const actualModels = JSON.parse(actualResponse.body) as IModelInfo[];

    // THEN expect the handler to respond with the OK status code
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);

    // AND the response should only contain released models
    expect(actualModels.length).toBe(models.length);

    expect(actualModels.map((m) => m.UUID)).toMatchObject(models.map((m) => m.UUID));
  });
});
