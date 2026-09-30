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

describe("Test for skillGroup PATCH handler with a DB", () => {
  const ajv = new Ajv({ validateSchema: true, strict: true, allErrors: true });
  addFormats(ajv);
  ajv.addSchema(SkillGroupAPISpecs.SkillGroup.PATCH.Schemas.Response.Payload);
  const validatePATCHResponse: ValidateFunction = ajv.getSchema(
    SkillGroupAPISpecs.SkillGroup.PATCH.Schemas.Response.Payload.$id as string
  ) as ValidateFunction;

  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    const config = getTestConfiguration("SkillGroupPATCHHandlerTestDB");
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

  test("PATCH should respond with FORBIDDEN when user is not a model manager", async () => {
    // GIVEN a request from a non-model-manager user
    const givenEvent = {
      httpMethod: HTTP_VERBS.PATCH,
      body: JSON.stringify({ preferredLabel: { en: "Label" } }),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.REGISTED_USER,
    };

    // WHEN the handler is invoked
    const actualResponse = await skillGroupHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect FORBIDDEN
    expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
  });

  test("PATCH should respond with OK, only update provided fields, and response passes JSON schema validation", async () => {
    // GIVEN a model exists in the DB
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: "Test Model",
      description: "Test Description",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
    });
    const givenModelId = givenModel.id;
    const givenOriginalLabel = "Original Label";

    // AND a skill group exists in the DB
    const givenSkillGroup = await getRepositoryRegistry().skillGroup.create({
      modelId: givenModelId,
      code: getTestSkillGroupCode(100),
      preferredLabel: { en: givenOriginalLabel },
      description: { en: getRandomString(SkillGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH) },
      altLabels: [{ en: getRandomString(SkillGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH) }],
      originUri: `http://some/path/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      scopeNote: { en: getRandomString(SkillGroupAPISpecs.Constants.MAX_SCOPE_NOTE_LENGTH) },
    });

    // AND a PATCH payload that only updates description
    const givenPatchPayload: SkillGroupAPISpecs.SkillGroup.PATCH.Types.Request.Payload = {
      description: { en: "Patched Description Only" },
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.PATCH,
      body: JSON.stringify(givenPatchPayload),
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
    expect(validatePATCHResponse(JSON.parse(actualResponse.body))).toBeTruthy();
    const responseBody = JSON.parse(actualResponse.body);
    // AND description has been updated
    expect(responseBody.description).toEqual("Patched Description Only");
    // AND preferredLabel is unchanged
    expect(responseBody.preferredLabel).toEqual(givenOriginalLabel);
    // AND the raw stored preferredLabel is completely untouched, not merely flattened to the same value
    const actualRawDoc = await getRepositoryRegistry().skillGroup.Model.findById(givenSkillGroup.id).lean();
    expect(actualRawDoc?.preferredLabel).toEqual({ en: givenOriginalLabel });
  });

  test("PATCH should respond with NOT_FOUND when skill group id does not exist", async () => {
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
    const givenEvent = {
      httpMethod: HTTP_VERBS.PATCH,
      body: JSON.stringify({ preferredLabel: { en: "Label" } }),
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

  test("PATCH should respond with BAD_REQUEST when body is null", async () => {
    // GIVEN a request with null body
    const givenModelId = getMockStringId(1);
    const givenEvent = {
      httpMethod: HTTP_VERBS.PATCH,
      body: null,
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/skillGroups/${getMockStringId(2)}`,
    };

    // WHEN the handler is invoked
    const actualResponse = await skillGroupHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect BAD_REQUEST
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("PATCH should merge a single language into preferredLabel, leaving other languages untouched", async () => {
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

    // AND a skill group exists with preferredLabel translated in English only
    const givenSkillGroup = await getRepositoryRegistry().skillGroup.create({
      modelId: givenModelId,
      code: getTestSkillGroupCode(100),
      preferredLabel: { en: "Managers" },
      description: { en: getRandomString(SkillGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH) },
      altLabels: [],
      originUri: `http://some/path/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      scopeNote: { en: getRandomString(SkillGroupAPISpecs.Constants.MAX_SCOPE_NOTE_LENGTH) },
    });

    // WHEN a PATCH payload is sent that sets only the French preferredLabel
    const givenPatchPayload: SkillGroupAPISpecs.SkillGroup.PATCH.Types.Request.Payload = {
      preferredLabel: { fr: "Directeurs" },
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.PATCH,
      body: JSON.stringify(givenPatchPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/skillGroups/${givenSkillGroup.id}`,
      pathParameters: { modelId: givenModelId, id: givenSkillGroup.id },
    };
    const actualResponse = await skillGroupHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect OK
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);

    // AND the stored preferredLabel carries both languages: English untouched, French merged in
    const actualDoc = await getRepositoryRegistry().skillGroup.Model.findById(givenSkillGroup.id).lean();
    expect(actualDoc?.preferredLabel).toEqual({ en: "Managers", fr: "Directeurs" });
  });

  test("PATCH should delete a non fallback language translation when it is set to null", async () => {
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

    // WHEN a PATCH payload is sent that sets the French preferredLabel to null
    const givenPatchPayload: SkillGroupAPISpecs.SkillGroup.PATCH.Types.Request.Payload = {
      preferredLabel: { fr: null },
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.PATCH,
      body: JSON.stringify(givenPatchPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/skillGroups/${givenSkillGroup.id}`,
      pathParameters: { modelId: givenModelId, id: givenSkillGroup.id },
    };
    const actualResponse = await skillGroupHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect OK
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);

    // AND the stored preferredLabel no longer carries French, English is untouched
    const actualDoc = await getRepositoryRegistry().skillGroup.Model.findById(givenSkillGroup.id).lean();
    expect(actualDoc?.preferredLabel).toEqual({ en: "Managers" });
    expect(actualDoc?.preferredLabel).not.toHaveProperty("fr");
  });

  test("PATCH should respond with BAD_REQUEST when the fallback language is explicitly set to null", async () => {
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
      preferredLabel: { en: "Managers", fr: "Directeurs" },
      description: { en: getRandomString(SkillGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH) },
      altLabels: [],
      originUri: `http://some/path/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      scopeNote: { en: getRandomString(SkillGroupAPISpecs.Constants.MAX_SCOPE_NOTE_LENGTH) },
    });

    // AND a PATCH payload that attempts to delete the fallback language
    const givenPayload = { preferredLabel: { en: null } };
    const givenEvent = {
      httpMethod: HTTP_VERBS.PATCH,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/skillGroups/${givenSkillGroup.id}`,
      pathParameters: { modelId: givenModelId, id: givenSkillGroup.id },
    };

    // WHEN the handler is invoked
    const actualResponse = await skillGroupHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect BAD_REQUEST
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);

    // AND the stored preferredLabel is unchanged (the write never reached the DB)
    const actualDoc = await getRepositoryRegistry().skillGroup.Model.findById(givenSkillGroup.id).lean();
    expect(actualDoc?.preferredLabel).toEqual({ en: "Managers", fr: "Directeurs" });
  });

  test("PATCH should respond with BAD_REQUEST when a field uses a language unknown to the registry", async () => {
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
      preferredLabel: { en: "Managers" },
      description: { en: getRandomString(SkillGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH) },
      altLabels: [],
      originUri: `http://some/path/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      scopeNote: { en: getRandomString(SkillGroupAPISpecs.Constants.MAX_SCOPE_NOTE_LENGTH) },
    });

    // AND a PATCH payload with a language unknown to the registry
    const givenPayload = { preferredLabel: { tlh: "nuqneH" } };
    const givenEvent = {
      httpMethod: HTTP_VERBS.PATCH,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/skillGroups/${givenSkillGroup.id}`,
      pathParameters: { modelId: givenModelId, id: givenSkillGroup.id },
    };
    const actualResponse = await skillGroupHandler(givenEvent as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("PATCH should respond with BAD_REQUEST when one language of a field exceeds the maximum length", async () => {
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
      preferredLabel: { en: "Managers" },
      description: { en: getRandomString(SkillGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH) },
      altLabels: [],
      originUri: `http://some/path/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      scopeNote: { en: getRandomString(SkillGroupAPISpecs.Constants.MAX_SCOPE_NOTE_LENGTH) },
    });

    // AND a PATCH payload whose French preferredLabel exceeds the maximum length, English is valid
    const givenPayload = {
      preferredLabel: {
        en: "Directors",
        fr: getRandomString(SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH + 1),
      },
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.PATCH,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/skillGroups/${givenSkillGroup.id}`,
      pathParameters: { modelId: givenModelId, id: givenSkillGroup.id },
    };
    const actualResponse = await skillGroupHandler(givenEvent as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("PATCH should respond with OK when scopeNote is patched as a localized object with multiple languages", async () => {
    // GIVEN a model that supports English and Spanish
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: "Test Model",
      description: "Test Description",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
      availableLanguages: ["en", "es"],
    });
    const givenModelId = givenModel.id;

    // AND a skill group exists in the DB
    const givenSkillGroup = await getRepositoryRegistry().skillGroup.create({
      modelId: givenModelId,
      code: getTestSkillGroupCode(100),
      preferredLabel: { en: "Managers" },
      description: { en: getRandomString(SkillGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH) },
      altLabels: [],
      originUri: `http://some/path/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      scopeNote: { en: "Applies to management occupations." },
    });

    // WHEN a PATCH payload sets scopeNote in Spanish, English omitted
    const givenPatchPayload: SkillGroupAPISpecs.SkillGroup.PATCH.Types.Request.Payload = {
      scopeNote: { es: "Se aplica a las ocupaciones de gestión." },
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.PATCH,
      body: JSON.stringify(givenPatchPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/skillGroups/${givenSkillGroup.id}`,
      pathParameters: { modelId: givenModelId, id: givenSkillGroup.id },
    };
    const actualResponse = await skillGroupHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect OK
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);

    // AND the stored scopeNote carries both languages
    const actualDoc = await getRepositoryRegistry().skillGroup.Model.findById(givenSkillGroup.id).lean();
    expect(actualDoc?.scopeNote).toEqual({
      en: "Applies to management occupations.",
      es: "Se aplica a las ocupaciones de gestión.",
    });
  });
});
