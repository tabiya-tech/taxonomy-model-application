import { APIGatewayProxyEvent } from "aws-lambda";
import "_test_utilities/consoleMock";
import Ajv, { ValidateFunction } from "ajv";
import { randomUUID } from "node:crypto";
import { Connection } from "mongoose";

import OccupationAPISpecs from "api-specifications/esco/occupation";

import { getRandomString } from "_test_utilities/getMockRandomData";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { handler as occupationHandler } from "./index";
import addFormats from "ajv-formats";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { usersRequestContext } from "_test_utilities/dataModel";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getMockRandomOccupationCode } from "_test_utilities/mockOccupationCode";
import { getMockRandomISCOGroupCode } from "_test_utilities/mockOccupationGroupCode";
import LanguageAPISpecs from "api-specifications/language";

const givenFallbackDbKeyName = LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.dbKeyName;

// GIVEN a function to wrap a flat string into a single language translated value
const wrapFallback = (value: string) => ({ [givenFallbackDbKeyName]: value });

describe("Test for occupation POST handler with a DB", () => {
  const ajv = new Ajv({
    validateSchema: true,
    strict: true,
    allErrors: true,
  });
  addFormats(ajv);
  ajv.addSchema(OccupationAPISpecs.POST.Schemas.Response.Payload);
  const validatePOSTResponse: ValidateFunction = ajv.getSchema(
    OccupationAPISpecs.POST.Schemas.Response.Payload.$id as string
  ) as ValidateFunction;

  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    const config = getTestConfiguration("OccupationPOSTHandlerTestDB");
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
      await dbConnection.models.OccupationModel.deleteMany({});
    }
  });

  test("POST should respond with the FORBIDDEN status code if the user is not a model manager", async () => {
    const givenPayload: OccupationAPISpecs.POST.Types.Request.Payload = {
      modelId: getMockStringId(1),
      code: getMockRandomOccupationCode(false),
      occupationType: OccupationAPISpecs.Enums.OccupationType.ESCOOccupation,
      preferredLabel: wrapFallback(getRandomString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH)),
      description: wrapFallback(getRandomString(OccupationAPISpecs.Constants.DESCRIPTION_MAX_LENGTH)),
      altLabels: [wrapFallback(getRandomString(OccupationAPISpecs.Constants.ALT_LABEL_MAX_LENGTH))],
      originUri: `http://some/path/to/api/resources/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      occupationGroupCode: getMockRandomISCOGroupCode(),
      definition: wrapFallback(getRandomString(OccupationAPISpecs.Constants.DEFINITION_MAX_LENGTH)),
      scopeNote: wrapFallback(getRandomString(OccupationAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH)),
      regulatedProfessionNote: wrapFallback(
        getRandomString(OccupationAPISpecs.Constants.REGULATED_PROFESSION_NOTE_MAX_LENGTH)
      ),
      isLocalized: false,
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.REGISTED_USER,
    };
    const actualResponse = await occupationHandler(givenEvent as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
  });

  test("POST should respond with the CREATED status code and response passes the JSON schema validation", async () => {
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: "Test Model",
      description: "Test Description",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
      availableLanguages: ["en", "fr"],
    });
    const givenModelId = givenModel.id;
    const givenPayload: OccupationAPISpecs.POST.Types.Request.Payload = {
      modelId: givenModelId,
      code: getMockRandomOccupationCode(false),
      occupationType: OccupationAPISpecs.Enums.OccupationType.ESCOOccupation,
      preferredLabel: {
        [givenFallbackDbKeyName]: getRandomString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
        fr: getRandomString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
      },
      description: wrapFallback(getRandomString(OccupationAPISpecs.Constants.DESCRIPTION_MAX_LENGTH)),
      altLabels: [wrapFallback(getRandomString(OccupationAPISpecs.Constants.ALT_LABEL_MAX_LENGTH))],
      originUri: `http://some/path/to/api/resources/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      occupationGroupCode: getMockRandomISCOGroupCode(),
      definition: wrapFallback(getRandomString(OccupationAPISpecs.Constants.DEFINITION_MAX_LENGTH)),
      scopeNote: wrapFallback(getRandomString(OccupationAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH)),
      regulatedProfessionNote: wrapFallback(
        getRandomString(OccupationAPISpecs.Constants.REGULATED_PROFESSION_NOTE_MAX_LENGTH)
      ),
      isLocalized: false,
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/occupations`,
      pathParameters: { modelId: givenModelId },
    };
    const actualResponse = await occupationHandler(givenEvent as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.CREATED);
    expect(validatePOSTResponse(JSON.parse(actualResponse.body))).toBeTruthy();

    // AND the persisted occupation carries every language, not only the fallback
    const actualDoc = await getRepositoryRegistry()
      .occupation.Model.findOne({
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
      code: getMockRandomOccupationCode(false),
      occupationType: OccupationAPISpecs.Enums.OccupationType.ESCOOccupation,
      preferredLabel: { fr: "Cuisinier" },
      description: wrapFallback(getRandomString(OccupationAPISpecs.Constants.DESCRIPTION_MAX_LENGTH)),
      altLabels: [],
      originUri: `http://some/path/to/api/resources/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      occupationGroupCode: getMockRandomISCOGroupCode(),
      definition: wrapFallback(getRandomString(OccupationAPISpecs.Constants.DEFINITION_MAX_LENGTH)),
      scopeNote: wrapFallback(getRandomString(OccupationAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH)),
      regulatedProfessionNote: wrapFallback(
        getRandomString(OccupationAPISpecs.Constants.REGULATED_PROFESSION_NOTE_MAX_LENGTH)
      ),
      isLocalized: false,
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/occupations`,
      pathParameters: { modelId: givenModelId },
    };
    const actualResponse = await occupationHandler(givenEvent as unknown as APIGatewayProxyEvent);
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
      code: getMockRandomOccupationCode(false),
      occupationType: OccupationAPISpecs.Enums.OccupationType.ESCOOccupation,
      preferredLabel: { [givenFallbackDbKeyName]: "Cook", tlh: "nuqneH" },
      description: wrapFallback(getRandomString(OccupationAPISpecs.Constants.DESCRIPTION_MAX_LENGTH)),
      altLabels: [],
      originUri: `http://some/path/to/api/resources/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      occupationGroupCode: getMockRandomISCOGroupCode(),
      definition: wrapFallback(getRandomString(OccupationAPISpecs.Constants.DEFINITION_MAX_LENGTH)),
      scopeNote: wrapFallback(getRandomString(OccupationAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH)),
      regulatedProfessionNote: wrapFallback(
        getRandomString(OccupationAPISpecs.Constants.REGULATED_PROFESSION_NOTE_MAX_LENGTH)
      ),
      isLocalized: false,
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/occupations`,
      pathParameters: { modelId: givenModelId },
    };
    const actualResponse = await occupationHandler(givenEvent as unknown as APIGatewayProxyEvent);
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
      code: getMockRandomOccupationCode(false),
      occupationType: OccupationAPISpecs.Enums.OccupationType.ESCOOccupation,
      preferredLabel: { [givenFallbackDbKeyName]: "Cook", fr: "Cuisinier" },
      description: wrapFallback(getRandomString(OccupationAPISpecs.Constants.DESCRIPTION_MAX_LENGTH)),
      altLabels: [],
      originUri: `http://some/path/to/api/resources/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      occupationGroupCode: getMockRandomISCOGroupCode(),
      definition: wrapFallback(getRandomString(OccupationAPISpecs.Constants.DEFINITION_MAX_LENGTH)),
      scopeNote: wrapFallback(getRandomString(OccupationAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH)),
      regulatedProfessionNote: wrapFallback(
        getRandomString(OccupationAPISpecs.Constants.REGULATED_PROFESSION_NOTE_MAX_LENGTH)
      ),
      isLocalized: false,
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/occupations`,
      pathParameters: { modelId: givenModelId },
    };

    // WHEN the handler is invoked with the given event
    const actualResponse = await occupationHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect the handler to respond with BAD_REQUEST, naming the field and the language
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    const body = JSON.parse(actualResponse.body);
    expect(body.errorCode).toEqual(OccupationAPISpecs.POST.Errors.Status400.ErrorCodes.UNSUPPORTED_LANGUAGE);
    expect(body.message).toEqual("Field 'preferredLabel' uses a language not available in this model");
    expect(body.details).toEqual("Unsupported language: 'fr'");
  });

  test("POST should respond with CREATED when regulatedProfessionNote is a localized object with multiple languages", async () => {
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: "Test Model",
      description: "Test Description",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
      availableLanguages: ["en", "fr"],
    });
    const givenModelId = givenModel.id;
    const givenPayload: OccupationAPISpecs.POST.Types.Request.Payload = {
      modelId: givenModelId,
      code: getMockRandomOccupationCode(false),
      occupationType: OccupationAPISpecs.Enums.OccupationType.ESCOOccupation,
      preferredLabel: wrapFallback(getRandomString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH)),
      description: wrapFallback(getRandomString(OccupationAPISpecs.Constants.DESCRIPTION_MAX_LENGTH)),
      altLabels: [],
      originUri: `http://some/path/to/api/resources/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      occupationGroupCode: getMockRandomISCOGroupCode(),
      definition: wrapFallback(getRandomString(OccupationAPISpecs.Constants.DEFINITION_MAX_LENGTH)),
      scopeNote: wrapFallback(getRandomString(OccupationAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH)),
      regulatedProfessionNote: {
        [givenFallbackDbKeyName]: "Not a regulated profession.",
        fr: "Pas une profession réglementée.",
      },
      isLocalized: false,
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/occupations`,
      pathParameters: { modelId: givenModelId },
    };
    const actualResponse = await occupationHandler(givenEvent as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.CREATED);
    expect(validatePOSTResponse(JSON.parse(actualResponse.body))).toBeTruthy();

    const actualDoc = await getRepositoryRegistry()
      .occupation.Model.findOne({
        code: givenPayload.code,
        modelId: givenModelId,
      })
      .lean();
    expect(actualDoc).not.toBeNull();
    expect(actualDoc!.regulatedProfessionNote).toMatchObject({
      [givenFallbackDbKeyName]: "Not a regulated profession.",
      fr: "Pas une profession réglementée.",
    });
  });

  test("POST should respond with BAD_REQUEST when body is null", async () => {
    const givenModelId = getMockStringId(1);
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: null,
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/occupations`,
      pathParameters: { modelId: givenModelId },
    };
    const actualResponse = await occupationHandler(givenEvent as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });
});
