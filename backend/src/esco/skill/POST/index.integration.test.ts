import { APIGatewayProxyEvent } from "aws-lambda";
import "_test_utilities/consoleMock";
import Ajv from "ajv";
import { randomUUID } from "node:crypto";
import { Connection } from "mongoose";

import SkillAPISpecs from "api-specifications/esco/skill";

import { getRandomString, getTestString } from "_test_utilities/getMockRandomData";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { handler as skillHandler } from "./index";
import addFormats from "ajv-formats";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { usersRequestContext } from "_test_utilities/dataModel";
import LanguageAPISpecs from "api-specifications/language";

const givenFallbackDbKeyName = LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.dbKeyName;

// GIVEN a function to wrap a flat string into a single language translated value
const wrapFallback = (value: string) => ({ [givenFallbackDbKeyName]: value });

describe("Test for skill POST handler with a DB", () => {
  const ajv = new Ajv({
    validateSchema: true,
    strict: true,
    allErrors: true,
  });
  addFormats(ajv);
  ajv.addSchema(SkillAPISpecs.POST.Schemas.Response.Payload);

  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    const config = getTestConfiguration("SkillPOSTHandlerTestDB");
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
      await dbConnection.models.SkillModel.deleteMany({});
      await dbConnection.models.ModelInfo.deleteMany({});
    }
  });

  test("POST should respond with the CREATED status code and response passes the JSON schema validation", async () => {
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: getTestString(SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
      description: "Test Description",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
    });
    const givenModelId = givenModel.id;
    const givenPayload = {
      modelId: givenModelId,
      preferredLabel: wrapFallback(getRandomString(SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH)),
      description: wrapFallback(getRandomString(SkillAPISpecs.Constants.DESCRIPTION_MAX_LENGTH)),
      altLabels: [wrapFallback(getRandomString(SkillAPISpecs.Constants.ALT_LABEL_MAX_LENGTH))],
      originUri: `http://some/path/to/api/resources/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      scopeNote: wrapFallback(getRandomString(SkillAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH)),
      definition: wrapFallback(getRandomString(SkillAPISpecs.Constants.DEFINITION_MAX_LENGTH)),
      skillType: SkillAPISpecs.Enums.SkillType.Knowledge,
      reuseLevel: SkillAPISpecs.Enums.ReuseLevel.CrossSector,
      isLocalized: false,
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/skills`,
      pathParameters: { modelId: givenModelId },
    };
    const actualResponse = await skillHandler(givenEvent as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.CREATED);
    const body = JSON.parse(actualResponse.body);
    expect(body).toHaveProperty("id");
    expect(body).toHaveProperty("preferredLabel");
  });

  test("POST should respond with CREATED for a multi language payload and persist every language", async () => {
    // GIVEN a model supporting English and French
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: "Test Model",
      description: "Test Description",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
      availableLanguages: ["en", "fr"],
    });
    const givenModelId = givenModel.id;
    const givenPayload = {
      modelId: givenModelId,
      preferredLabel: {
        [givenFallbackDbKeyName]: getRandomString(SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
        fr: getRandomString(SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
      },
      description: wrapFallback(getRandomString(SkillAPISpecs.Constants.DESCRIPTION_MAX_LENGTH)),
      altLabels: [wrapFallback(getRandomString(SkillAPISpecs.Constants.ALT_LABEL_MAX_LENGTH))],
      originUri: `http://some/path/to/api/resources/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      scopeNote: wrapFallback(getRandomString(SkillAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH)),
      definition: wrapFallback(getRandomString(SkillAPISpecs.Constants.DEFINITION_MAX_LENGTH)),
      skillType: SkillAPISpecs.Enums.SkillType.Knowledge,
      reuseLevel: SkillAPISpecs.Enums.ReuseLevel.CrossSector,
      isLocalized: false,
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/skills`,
      pathParameters: { modelId: givenModelId },
    };

    // WHEN the handler is invoked
    const actualResponse = await skillHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect CREATED
    expect(actualResponse.statusCode).toEqual(StatusCodes.CREATED);
    const body = JSON.parse(actualResponse.body);

    // AND the persisted skill carries every language, not only the fallback
    const actualDoc = await getRepositoryRegistry().skill.Model.findById(body.id).lean();
    expect(actualDoc).not.toBeNull();
    expect(actualDoc!.preferredLabel).toMatchObject({
      [givenFallbackDbKeyName]: givenPayload.preferredLabel[givenFallbackDbKeyName],
      fr: givenPayload.preferredLabel.fr,
    });
  });

  test("POST should respond with BAD_REQUEST when preferredLabel is missing the fallback language", async () => {
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: "Test Model",
      description: "Test Description",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
      availableLanguages: ["en", "fr"],
    });
    const givenModelId = givenModel.id;
    const givenPayload = {
      modelId: givenModelId,
      preferredLabel: { fr: "Cuisinier" },
      description: wrapFallback(getRandomString(SkillAPISpecs.Constants.DESCRIPTION_MAX_LENGTH)),
      altLabels: [],
      originUri: `http://some/path/to/api/resources/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      scopeNote: wrapFallback(getRandomString(SkillAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH)),
      definition: wrapFallback(getRandomString(SkillAPISpecs.Constants.DEFINITION_MAX_LENGTH)),
      skillType: SkillAPISpecs.Enums.SkillType.Knowledge,
      reuseLevel: SkillAPISpecs.Enums.ReuseLevel.CrossSector,
      isLocalized: false,
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/skills`,
      pathParameters: { modelId: givenModelId },
    };
    const actualResponse = await skillHandler(givenEvent as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("POST should respond with BAD_REQUEST when a field uses a language unknown to the registry", async () => {
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: "Test Model",
      description: "Test Description",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
      availableLanguages: ["en", "fr"],
    });
    const givenModelId = givenModel.id;
    const givenPayload = {
      modelId: givenModelId,
      preferredLabel: { [givenFallbackDbKeyName]: "Cook", tlh: "nuqneH" },
      description: wrapFallback(getRandomString(SkillAPISpecs.Constants.DESCRIPTION_MAX_LENGTH)),
      altLabels: [],
      originUri: `http://some/path/to/api/resources/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      scopeNote: wrapFallback(getRandomString(SkillAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH)),
      definition: wrapFallback(getRandomString(SkillAPISpecs.Constants.DEFINITION_MAX_LENGTH)),
      skillType: SkillAPISpecs.Enums.SkillType.Knowledge,
      reuseLevel: SkillAPISpecs.Enums.ReuseLevel.CrossSector,
      isLocalized: false,
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/skills`,
      pathParameters: { modelId: givenModelId },
    };
    const actualResponse = await skillHandler(givenEvent as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("POST should respond with BAD_REQUEST when one language of a field exceeds the maximum length", async () => {
    // GIVEN a model that supports English and French
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: "Test Model",
      description: "Test Description",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
      availableLanguages: ["en", "fr"],
    });
    const givenModelId = givenModel.id;

    // AND a payload whose French preferredLabel exceeds the maximum length, English is valid
    const givenPayload = {
      modelId: givenModelId,
      preferredLabel: {
        [givenFallbackDbKeyName]: "Cook",
        fr: getRandomString(SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH + 1),
      },
      description: wrapFallback(getRandomString(SkillAPISpecs.Constants.DESCRIPTION_MAX_LENGTH)),
      altLabels: [],
      originUri: `http://some/path/to/api/resources/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      scopeNote: wrapFallback(getRandomString(SkillAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH)),
      definition: wrapFallback(getRandomString(SkillAPISpecs.Constants.DEFINITION_MAX_LENGTH)),
      skillType: SkillAPISpecs.Enums.SkillType.Knowledge,
      reuseLevel: SkillAPISpecs.Enums.ReuseLevel.CrossSector,
      isLocalized: false,
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/skills`,
      pathParameters: { modelId: givenModelId },
    };

    // WHEN the handler is invoked with the given event
    const actualResponse = await skillHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect the handler to respond with BAD_REQUEST
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("POST should respond with BAD_REQUEST when a field uses a language not in the model's availableLanguages", async () => {
    // GIVEN a model whose availableLanguages is only the fallback language
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: "Test Model",
      description: "Test Description",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
      availableLanguages: ["en"],
    });
    const givenModelId = givenModel.id;
    // AND a payload that carries a language ('fr') not in the model's availableLanguages
    const givenPayload = {
      modelId: givenModelId,
      preferredLabel: { [givenFallbackDbKeyName]: "Cook", fr: "Cuisinier" },
      description: wrapFallback(getRandomString(SkillAPISpecs.Constants.DESCRIPTION_MAX_LENGTH)),
      altLabels: [],
      originUri: `http://some/path/to/api/resources/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      scopeNote: wrapFallback(getRandomString(SkillAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH)),
      definition: wrapFallback(getRandomString(SkillAPISpecs.Constants.DEFINITION_MAX_LENGTH)),
      skillType: SkillAPISpecs.Enums.SkillType.Knowledge,
      reuseLevel: SkillAPISpecs.Enums.ReuseLevel.CrossSector,
      isLocalized: false,
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/skills`,
      pathParameters: { modelId: givenModelId },
    };

    // WHEN the handler is invoked with the given event
    const actualResponse = await skillHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect the handler to respond with BAD_REQUEST and name the field and the language
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    const body = JSON.parse(actualResponse.body);
    expect(body.errorCode).toEqual(SkillAPISpecs.POST.Errors.Status400.ErrorCodes.UNSUPPORTED_LANGUAGE);
  });
});
