import { APIGatewayProxyEvent } from "aws-lambda";
import "_test_utilities/consoleMock";
import Ajv, { ValidateFunction } from "ajv";
import { randomUUID } from "node:crypto";
import { Connection } from "mongoose";

import SkillGroupAPISpecs from "api-specifications/esco/skillGroup";
import LanguageAPISpecs from "api-specifications/language";

import { getRandomString } from "_test_utilities/getMockRandomData";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { handler as skillGroupHandler } from "./index";
import addFormats from "ajv-formats";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { usersRequestContext } from "_test_utilities/dataModel";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getTestSkillGroupCode } from "_test_utilities/mockSkillGroupCode";

const givenFallbackDbKeyName = LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.dbKeyName;

// GIVEN a function to wrap a flat string into a single language translated value
const wrapFallback = (value: string) => ({ [givenFallbackDbKeyName]: value });

describe("Test for skillGroup POST handler with a DB", () => {
  const ajv = new Ajv({
    validateSchema: true,
    strict: true,
    allErrors: true,
  });
  addFormats(ajv);
  ajv.addSchema(SkillGroupAPISpecs.POST.Schemas.Response.Payload);
  const validatePOSTResponse: ValidateFunction = ajv.getSchema(
    SkillGroupAPISpecs.POST.Schemas.Response.Payload.$id as string
  ) as ValidateFunction;

  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    const config = getTestConfiguration("SkillGroupPOSTHandlerTestDB");
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
      await dbConnection.models.SkillGroupModel.deleteMany({});
    }
  });

  test("POST should respond with the FORBIDDEN status code if the user is not a model manager", async () => {
    // GIVEN a valid multilingual payload
    const givenPayload: SkillGroupAPISpecs.POST.Types.Request.Payload = {
      modelId: getMockStringId(1),
      code: getTestSkillGroupCode(100),
      preferredLabel: wrapFallback(getRandomString(SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH)),
      description: wrapFallback(getRandomString(SkillGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH)),
      altLabels: [wrapFallback(getRandomString(SkillGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH))],
      originUri: `http://some/path/to/api/resources/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      scopeNote: wrapFallback(getRandomString(SkillGroupAPISpecs.Constants.MAX_SCOPE_NOTE_LENGTH)),
    };
    // AND a request from a user who is not a model manager
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.REGISTED_USER,
    };

    // WHEN the handler is invoked with the given event
    const actualResponse = await skillGroupHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect the handler to respond with FORBIDDEN
    expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
  });

  test("POST should respond with the CREATED status code and response passes the JSON schema validation", async () => {
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
    // AND a payload whose preferredLabel is translated in both English and French
    const givenPayload: SkillGroupAPISpecs.POST.Types.Request.Payload = {
      modelId: givenModelId,
      code: getTestSkillGroupCode(100),
      preferredLabel: {
        [givenFallbackDbKeyName]: getRandomString(SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
        fr: getRandomString(SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
      },
      description: wrapFallback(getRandomString(SkillGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH)),
      altLabels: [wrapFallback(getRandomString(SkillGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH))],
      originUri: `http://some/path/to/api/resources/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      scopeNote: wrapFallback(getRandomString(SkillGroupAPISpecs.Constants.MAX_SCOPE_NOTE_LENGTH)),
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/skillGroups`,
      pathParameters: { modelId: givenModelId },
    };

    // WHEN the handler is invoked with the given event
    const actualResponse = await skillGroupHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect the handler to respond with CREATED and the response to pass schema validation
    expect(actualResponse.statusCode).toEqual(StatusCodes.CREATED);
    expect(validatePOSTResponse(JSON.parse(actualResponse.body))).toBeTruthy();

    // AND the persisted skill group carries every language, not only the fallback
    const actualDoc = await getRepositoryRegistry()
      .skillGroup.Model.findOne({
        code: givenPayload.code,
        modelId: givenModelId,
      })
      .lean();
    expect(actualDoc).not.toBeNull();
    expect(actualDoc!.preferredLabel).toMatchObject({
      [givenFallbackDbKeyName]: givenPayload.preferredLabel[givenFallbackDbKeyName],
      fr: givenPayload.preferredLabel.fr,
    });
  });

  test("POST should respond with BAD_REQUEST when preferredLabel is missing the fallback language", async () => {
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
    // AND a payload whose preferredLabel omits the fallback language
    const givenPayload = {
      modelId: givenModelId,
      code: getTestSkillGroupCode(100),
      preferredLabel: { fr: "Directeurs" },
      description: wrapFallback(getRandomString(SkillGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH)),
      altLabels: [],
      originUri: `http://some/path/to/api/resources/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      scopeNote: wrapFallback(getRandomString(SkillGroupAPISpecs.Constants.MAX_SCOPE_NOTE_LENGTH)),
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/skillGroups`,
      pathParameters: { modelId: givenModelId },
    };

    // WHEN the handler is invoked with the given event
    const actualResponse = await skillGroupHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect the handler to respond with BAD_REQUEST
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("POST should respond with BAD_REQUEST when a field uses a language unknown to the registry", async () => {
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
    // AND a payload whose preferredLabel carries a language that is not in the registry
    const givenPayload = {
      modelId: givenModelId,
      code: getTestSkillGroupCode(100),
      preferredLabel: { [givenFallbackDbKeyName]: "Managers", tlh: "nuqneH" },
      description: wrapFallback(getRandomString(SkillGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH)),
      altLabels: [],
      originUri: `http://some/path/to/api/resources/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      scopeNote: wrapFallback(getRandomString(SkillGroupAPISpecs.Constants.MAX_SCOPE_NOTE_LENGTH)),
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/skillGroups`,
      pathParameters: { modelId: givenModelId },
    };

    // WHEN the handler is invoked with the given event
    const actualResponse = await skillGroupHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect the handler to respond with BAD_REQUEST
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
      code: getTestSkillGroupCode(100),
      preferredLabel: {
        [givenFallbackDbKeyName]: "Managers",
        fr: getRandomString(SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH + 1),
      },
      description: wrapFallback(getRandomString(SkillGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH)),
      altLabels: [],
      originUri: `http://some/path/to/api/resources/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      scopeNote: wrapFallback(getRandomString(SkillGroupAPISpecs.Constants.MAX_SCOPE_NOTE_LENGTH)),
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/skillGroups`,
      pathParameters: { modelId: givenModelId },
    };

    // WHEN the handler is invoked with the given event
    const actualResponse = await skillGroupHandler(givenEvent as unknown as APIGatewayProxyEvent);

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
      code: getTestSkillGroupCode(100),
      preferredLabel: { [givenFallbackDbKeyName]: "Managers", fr: "Directeurs" },
      description: wrapFallback(getRandomString(SkillGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH)),
      altLabels: [],
      originUri: `http://some/path/to/api/resources/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      scopeNote: wrapFallback(getRandomString(SkillGroupAPISpecs.Constants.MAX_SCOPE_NOTE_LENGTH)),
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/skillGroups`,
      pathParameters: { modelId: givenModelId },
    };

    // WHEN the handler is invoked with the given event
    const actualResponse = await skillGroupHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect the handler to respond with BAD_REQUEST, naming the field and the language
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    const body = JSON.parse(actualResponse.body);
    expect(body.errorCode).toEqual(SkillGroupAPISpecs.POST.Enums.Response.Status400.ErrorCodes.UNSUPPORTED_LANGUAGE);
    expect(body.message).toEqual("Field 'preferredLabel' uses a language not available in this model");
    expect(body.details).toEqual("Unsupported language: 'fr'");
  });

  test("POST should respond with CREATED when scopeNote is a localized object with multiple languages", async () => {
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
    // AND a payload whose scopeNote is translated in both English and French
    const givenPayload: SkillGroupAPISpecs.POST.Types.Request.Payload = {
      modelId: givenModelId,
      code: getTestSkillGroupCode(100),
      preferredLabel: wrapFallback(getRandomString(SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH)),
      description: wrapFallback(getRandomString(SkillGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH)),
      altLabels: [],
      originUri: `http://some/path/to/api/resources/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      scopeNote: {
        [givenFallbackDbKeyName]: "Applies to management occupations.",
        fr: "S'applique aux professions de gestion.",
      },
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/skillGroups`,
      pathParameters: { modelId: givenModelId },
    };

    // WHEN the handler is invoked with the given event
    const actualResponse = await skillGroupHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect the handler to respond with CREATED and the response to pass schema validation
    expect(actualResponse.statusCode).toEqual(StatusCodes.CREATED);
    expect(validatePOSTResponse(JSON.parse(actualResponse.body))).toBeTruthy();

    // AND the persisted skill group carries both languages of scopeNote
    const actualDoc = await getRepositoryRegistry()
      .skillGroup.Model.findOne({
        code: givenPayload.code,
        modelId: givenModelId,
      })
      .lean();
    expect(actualDoc).not.toBeNull();
    expect(actualDoc!.scopeNote).toMatchObject({
      [givenFallbackDbKeyName]: "Applies to management occupations.",
      fr: "S'applique aux professions de gestion.",
    });
  });

  test("POST should respond with BAD_REQUEST when body is null", async () => {
    // GIVEN a request whose body is null
    const givenModelId = getMockStringId(1);
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: null,
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/skillGroups`,
      pathParameters: { modelId: givenModelId },
    };

    // WHEN the handler is invoked with the given event
    const actualResponse = await skillGroupHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect the handler to respond with BAD_REQUEST
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });
});
