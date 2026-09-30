import { APIGatewayProxyEvent } from "aws-lambda";
import "_test_utilities/consoleMock";
import Ajv, { ValidateFunction } from "ajv";
import { randomUUID } from "node:crypto";
import { Connection } from "mongoose";

import SkillGroupAPISpecs from "api-specifications/esco/skillGroup";

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

describe("Test for skillGroup PUT handler with a DB", () => {
  const ajv = new Ajv({ validateSchema: true, strict: true, allErrors: true });
  addFormats(ajv);
  ajv.addSchema(SkillGroupAPISpecs.SkillGroup.PUT.Schemas.Response.Payload);
  const validatePUTResponse: ValidateFunction = ajv.getSchema(
    SkillGroupAPISpecs.SkillGroup.PUT.Schemas.Response.Payload.$id as string
  ) as ValidateFunction;

  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    const config = getTestConfiguration("SkillGroupPUTHandlerTestDB");
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

  test("PUT should respond with FORBIDDEN when user is not a model manager", async () => {
    // GIVEN a request from a non-model-manager user
    const givenModelId = getMockStringId(1);
    const givenPayload: SkillGroupAPISpecs.SkillGroup.PUT.Types.Request.Payload = {
      modelId: givenModelId,
      code: getTestSkillGroupCode(100),
      preferredLabel: { en: getRandomString(SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH) },
      description: { en: getRandomString(SkillGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH) },
      altLabels: [{ en: getRandomString(SkillGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH) }],
      originUri: `http://some/path/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      scopeNote: { en: getRandomString(SkillGroupAPISpecs.Constants.MAX_SCOPE_NOTE_LENGTH) },
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.PUT,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.REGISTED_USER,
    };

    // WHEN the handler is invoked
    const actualResponse = await skillGroupHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect FORBIDDEN
    expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
  });

  test("PUT should respond with OK and response passes JSON schema validation", async () => {
    // GIVEN a model exists in the DB, supporting English and French
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: "Test Model",
      description: "Test Description",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
      availableLanguages: ["en", "fr"],
    });
    const givenModelId = givenModel.id;

    // AND a skill group exists in the DB
    const givenSkillGroup = await getRepositoryRegistry().skillGroup.create({
      modelId: givenModelId,
      code: getTestSkillGroupCode(100),
      preferredLabel: { en: getRandomString(SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH) },
      description: { en: getRandomString(SkillGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH) },
      altLabels: [{ en: getRandomString(SkillGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH) }],
      originUri: `http://some/path/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      scopeNote: { en: getRandomString(SkillGroupAPISpecs.Constants.MAX_SCOPE_NOTE_LENGTH) },
    });

    // AND a valid PUT payload with updated data, preferredLabel translated in English and French
    const givenNewPayload: SkillGroupAPISpecs.SkillGroup.PUT.Types.Request.Payload = {
      modelId: givenModelId,
      code: getTestSkillGroupCode(100),
      preferredLabel: { en: "Updated Label", fr: "Étiquette mise à jour" },
      description: { en: "Updated Description" },
      altLabels: [],
      originUri: `http://some/path/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      scopeNote: { en: "Updated Scope" },
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.PUT,
      body: JSON.stringify(givenNewPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/skillGroups/${givenSkillGroup.id}`,
      pathParameters: { modelId: givenModelId, id: givenSkillGroup.id },
    };

    // WHEN the handler is invoked
    const actualResponse = await skillGroupHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect OK
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    // AND the response passes schema validation
    expect(validatePUTResponse(JSON.parse(actualResponse.body))).toBeTruthy();
    // AND the preferred label (fallback language) has been updated
    expect(JSON.parse(actualResponse.body).preferredLabel).toEqual("Updated Label");
    // AND the persisted document carries both languages
    const actualDoc = await getRepositoryRegistry().skillGroup.Model.findById(givenSkillGroup.id).lean();
    expect(actualDoc?.preferredLabel).toEqual({ en: "Updated Label", fr: "Étiquette mise à jour" });
  });

  test("PUT should remove a language from a translatable field when the language is omitted from the payload", async () => {
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

    // AND a skill group exists with preferredLabel translated in both English and French
    const givenSkillGroup = await getRepositoryRegistry().skillGroup.create({
      modelId: givenModelId,
      code: getTestSkillGroupCode(100),
      preferredLabel: { en: "Managers", fr: "Directeurs" },
      description: { en: getRandomString(SkillGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH) },
      altLabels: [],
      originUri: `http://some/path/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      scopeNote: { en: getRandomString(SkillGroupAPISpecs.Constants.MAX_SCOPE_NOTE_LENGTH) },
    });

    // AND a sanity check that French is actually stored before the PUT
    const beforeDoc = await getRepositoryRegistry().skillGroup.Model.findById(givenSkillGroup.id).lean();
    expect(beforeDoc?.preferredLabel).toMatchObject({ en: "Managers", fr: "Directeurs" });

    // WHEN a PUT payload is sent whose preferredLabel carries only English (French omitted)
    const givenPutPayload: SkillGroupAPISpecs.SkillGroup.PUT.Types.Request.Payload = {
      modelId: givenModelId,
      code: givenSkillGroup.code,
      preferredLabel: { en: "Directors" },
      description: { en: getRandomString(SkillGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH) },
      altLabels: [],
      originUri: `http://some/path/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      scopeNote: { en: getRandomString(SkillGroupAPISpecs.Constants.MAX_SCOPE_NOTE_LENGTH) },
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.PUT,
      body: JSON.stringify(givenPutPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/skillGroups/${givenSkillGroup.id}`,
      pathParameters: { modelId: givenModelId, id: givenSkillGroup.id },
    };
    const actualResponse = await skillGroupHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect OK
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);

    // AND the stored document's preferredLabel now carries only English — French has been removed, not merged
    const actualDoc = await getRepositoryRegistry().skillGroup.Model.findById(givenSkillGroup.id).lean();
    expect(actualDoc?.preferredLabel).toEqual({ en: "Directors" });
    expect(actualDoc?.preferredLabel).not.toHaveProperty("fr");
  });

  test("PUT should respond with BAD_REQUEST when preferredLabel is missing the fallback language", async () => {
    // GIVEN a model exists in the DB
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: "Test Model",
      description: "Test Description",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
      availableLanguages: ["en", "fr"],
    });
    const givenModelId = givenModel.id;

    // AND a skill group exists in the DB
    const givenSkillGroup = await getRepositoryRegistry().skillGroup.create({
      modelId: givenModelId,
      code: getTestSkillGroupCode(100),
      preferredLabel: { en: getRandomString(SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH) },
      description: { en: getRandomString(SkillGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH) },
      altLabels: [],
      originUri: `http://some/path/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      scopeNote: { en: getRandomString(SkillGroupAPISpecs.Constants.MAX_SCOPE_NOTE_LENGTH) },
    });

    // AND a PUT payload whose preferredLabel omits the fallback language
    const givenPayload = {
      modelId: givenModelId,
      code: givenSkillGroup.code,
      preferredLabel: { fr: "Directeurs" },
      description: { en: getRandomString(SkillGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH) },
      altLabels: [],
      originUri: `http://some/path/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      scopeNote: { en: getRandomString(SkillGroupAPISpecs.Constants.MAX_SCOPE_NOTE_LENGTH) },
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.PUT,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/skillGroups/${givenSkillGroup.id}`,
      pathParameters: { modelId: givenModelId, id: givenSkillGroup.id },
    };
    const actualResponse = await skillGroupHandler(givenEvent as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("PUT should respond with BAD_REQUEST when a field uses a language unknown to the registry", async () => {
    // GIVEN a model exists in the DB
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: "Test Model",
      description: "Test Description",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
      availableLanguages: ["en", "fr"],
    });
    const givenModelId = givenModel.id;

    // AND a skill group exists in the DB
    const givenSkillGroup = await getRepositoryRegistry().skillGroup.create({
      modelId: givenModelId,
      code: getTestSkillGroupCode(100),
      preferredLabel: { en: getRandomString(SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH) },
      description: { en: getRandomString(SkillGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH) },
      altLabels: [],
      originUri: `http://some/path/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      scopeNote: { en: getRandomString(SkillGroupAPISpecs.Constants.MAX_SCOPE_NOTE_LENGTH) },
    });

    // AND a PUT payload with a language unknown to the registry
    const givenPayload = {
      modelId: givenModelId,
      code: givenSkillGroup.code,
      preferredLabel: { en: "Managers", tlh: "nuqneH" },
      description: { en: getRandomString(SkillGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH) },
      altLabels: [],
      originUri: `http://some/path/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      scopeNote: { en: getRandomString(SkillGroupAPISpecs.Constants.MAX_SCOPE_NOTE_LENGTH) },
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.PUT,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/skillGroups/${givenSkillGroup.id}`,
      pathParameters: { modelId: givenModelId, id: givenSkillGroup.id },
    };
    const actualResponse = await skillGroupHandler(givenEvent as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("PUT should respond with BAD_REQUEST when one language of a field exceeds the maximum length", async () => {
    // GIVEN a model exists in the DB
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: "Test Model",
      description: "Test Description",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
      availableLanguages: ["en", "fr"],
    });
    const givenModelId = givenModel.id;

    // AND a skill group exists in the DB
    const givenSkillGroup = await getRepositoryRegistry().skillGroup.create({
      modelId: givenModelId,
      code: getTestSkillGroupCode(100),
      preferredLabel: { en: getRandomString(SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH) },
      description: { en: getRandomString(SkillGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH) },
      altLabels: [],
      originUri: `http://some/path/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      scopeNote: { en: getRandomString(SkillGroupAPISpecs.Constants.MAX_SCOPE_NOTE_LENGTH) },
    });

    // AND a PUT payload whose French preferredLabel exceeds the maximum length, English is valid
    const givenPayload = {
      modelId: givenModelId,
      code: givenSkillGroup.code,
      preferredLabel: {
        en: "Managers",
        fr: getRandomString(SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH + 1),
      },
      description: { en: getRandomString(SkillGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH) },
      altLabels: [],
      originUri: `http://some/path/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      scopeNote: { en: getRandomString(SkillGroupAPISpecs.Constants.MAX_SCOPE_NOTE_LENGTH) },
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.PUT,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/skillGroups/${givenSkillGroup.id}`,
      pathParameters: { modelId: givenModelId, id: givenSkillGroup.id },
    };
    const actualResponse = await skillGroupHandler(givenEvent as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("PUT should respond with BAD_REQUEST when a field uses a language not in the model's availableLanguages", async () => {
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

    // AND a skill group exists in the DB
    const givenSkillGroup = await getRepositoryRegistry().skillGroup.create({
      modelId: givenModelId,
      code: getTestSkillGroupCode(100),
      preferredLabel: { en: getRandomString(SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH) },
      description: { en: getRandomString(SkillGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH) },
      altLabels: [],
      originUri: `http://some/path/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      scopeNote: { en: getRandomString(SkillGroupAPISpecs.Constants.MAX_SCOPE_NOTE_LENGTH) },
    });

    // AND a PUT payload whose preferredLabel carries a language ('fr') not in the model's availableLanguages
    const givenPayload = {
      modelId: givenModelId,
      code: givenSkillGroup.code,
      preferredLabel: { en: "Managers", fr: "Directeurs" },
      description: { en: getRandomString(SkillGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH) },
      altLabels: [],
      originUri: `http://some/path/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      scopeNote: { en: getRandomString(SkillGroupAPISpecs.Constants.MAX_SCOPE_NOTE_LENGTH) },
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.PUT,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/skillGroups/${givenSkillGroup.id}`,
      pathParameters: { modelId: givenModelId, id: givenSkillGroup.id },
    };

    // WHEN the handler is invoked
    const actualResponse = await skillGroupHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect BAD_REQUEST, naming the field and the language
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    const body = JSON.parse(actualResponse.body);
    expect(body.errorCode).toEqual(
      SkillGroupAPISpecs.SkillGroup.PUT.Errors.Response.Status400.ErrorCodes.UNSUPPORTED_LANGUAGE
    );
    expect(body.message).toEqual("Field 'preferredLabel' uses a language not available in this model");
    expect(body.details).toEqual("Unsupported language: 'fr'");
  });

  test("PUT should respond with NOT_FOUND when skill group id does not exist", async () => {
    // GIVEN a model exists
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: "Test Model",
      description: "Test Description",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
    });
    const givenModelId = givenModel.id;
    const givenNonExistentId = getMockStringId(99);
    const givenPayload: SkillGroupAPISpecs.SkillGroup.PUT.Types.Request.Payload = {
      modelId: givenModelId,
      code: getTestSkillGroupCode(100),
      preferredLabel: { en: "Label" },
      description: { en: "Desc" },
      altLabels: [],
      originUri: `http://some/path/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      scopeNote: { en: "Scope" },
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.PUT,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/skillGroups/${givenNonExistentId}`,
      pathParameters: { modelId: givenModelId, id: givenNonExistentId },
    };

    // WHEN the handler is invoked
    const actualResponse = await skillGroupHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect NOT_FOUND
    expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
  });

  test("PUT should respond with OK when scopeNote is a localized object with multiple languages", async () => {
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

    // AND a skill group exists in the DB
    const givenSkillGroup = await getRepositoryRegistry().skillGroup.create({
      modelId: givenModelId,
      code: getTestSkillGroupCode(100),
      preferredLabel: { en: getRandomString(SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH) },
      description: { en: getRandomString(SkillGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH) },
      altLabels: [],
      originUri: `http://some/path/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      scopeNote: { en: "Applies to management occupations." },
    });

    // WHEN a PUT payload sets scopeNote in both English and French
    const givenPayload: SkillGroupAPISpecs.SkillGroup.PUT.Types.Request.Payload = {
      modelId: givenModelId,
      code: givenSkillGroup.code,
      preferredLabel: { en: getRandomString(SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH) },
      description: { en: getRandomString(SkillGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH) },
      altLabels: [],
      originUri: `http://some/path/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      scopeNote: {
        en: "Applies to management occupations.",
        fr: "S'applique aux professions de gestion.",
      },
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.PUT,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/skillGroups/${givenSkillGroup.id}`,
      pathParameters: { modelId: givenModelId, id: givenSkillGroup.id },
    };
    const actualResponse = await skillGroupHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect OK
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    expect(validatePUTResponse(JSON.parse(actualResponse.body))).toBeTruthy();

    // AND the persisted document carries both languages
    const actualDoc = await getRepositoryRegistry().skillGroup.Model.findById(givenSkillGroup.id).lean();
    expect(actualDoc?.scopeNote).toEqual({
      en: "Applies to management occupations.",
      fr: "S'applique aux professions de gestion.",
    });
  });
});
