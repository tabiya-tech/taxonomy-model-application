import { APIGatewayProxyEvent } from "aws-lambda";
import "_test_utilities/consoleMock";
import Ajv from "ajv";
import { randomUUID } from "node:crypto";
import { Connection } from "mongoose";

import SkillAPISpecs from "api-specifications/esco/skill";

import { getRandomString } from "_test_utilities/getMockRandomData";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { handler as skillHandler } from "./index";
import addFormats from "ajv-formats";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { usersRequestContext } from "_test_utilities/dataModel";

describe("Test for skill PATCH handler with a DB", () => {
  const ajv = new Ajv({ validateSchema: true, strict: true, allErrors: true });
  addFormats(ajv);
  ajv.addSchema(SkillAPISpecs.Skill.PATCH.Schemas.Response.Payload);

  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    const config = getTestConfiguration("SkillPATCHHandlerTestDB");
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

  async function createModelInDB() {
    return await getRepositoryRegistry().modelInfo.create({
      name: "Test Model",
      description: "Test Description",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
      availableLanguages: ["en", "fr"],
    });
  }

  async function createSkillInDB(modelId: string) {
    return await getRepositoryRegistry().skill.create({
      modelId: modelId,
      preferredLabel: { en: "Original Skill" },
      description: { en: getRandomString(SkillAPISpecs.Constants.DESCRIPTION_MAX_LENGTH) },
      altLabels: [{ en: getRandomString(SkillAPISpecs.Constants.ALT_LABEL_MAX_LENGTH) }],
      originUri: `http://example.com/skills/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      definition: { en: getRandomString(SkillAPISpecs.Constants.DEFINITION_MAX_LENGTH) },
      scopeNote: { en: getRandomString(SkillAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH) },
      skillType: SkillAPISpecs.Enums.SkillType.Knowledge,
      reuseLevel: SkillAPISpecs.Enums.ReuseLevel.CrossSector,
      isLocalized: false,
    });
  }

  test("PATCH should respond with FORBIDDEN when user is not a model manager", async () => {
    const givenEvent = {
      httpMethod: HTTP_VERBS.PATCH,
      body: JSON.stringify({ preferredLabel: { en: "Updated" } }),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.REGISTED_USER,
      path: `/models/model-1/skills/${randomUUID()}`,
    };

    const actualResponse = await skillHandler(givenEvent as unknown as APIGatewayProxyEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
  });

  test("PATCH should respond with OK and response passes JSON schema validation", async () => {
    const givenModel = await createModelInDB();
    const givenModelId = givenModel.id;

    const givenSkill = await createSkillInDB(givenModelId);

    const givenPayload: SkillAPISpecs.Skill.PATCH.Types.Request.Payload = {
      description: { en: "Patched description only" },
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.PATCH,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/skills/${givenSkill.id}`,
      pathParameters: { modelId: givenModelId, id: givenSkill.id },
    };

    const actualResponse = await skillHandler(givenEvent as unknown as APIGatewayProxyEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    expect(
      ajv.getSchema(SkillAPISpecs.Skill.PATCH.Schemas.Response.Payload.$id as string)?.(JSON.parse(actualResponse.body))
    ).toBeTruthy();
    const responseBody = JSON.parse(actualResponse.body);
    expect(responseBody.description).toEqual("Patched description only");
    expect(responseBody.preferredLabel).toEqual("Original Skill");
  });

  test("PATCH should merge a single language payload, leaving the fallback language of other fields untouched", async () => {
    // GIVEN a model with 'en' and 'fr' available, and a skill with English-only fields
    const givenModel = await createModelInDB();
    const givenModelId = givenModel.id;
    const givenSkill = await createSkillInDB(givenModelId);

    // WHEN patching only preferredLabel with a French translation
    const givenPayload: SkillAPISpecs.Skill.PATCH.Types.Request.Payload = {
      preferredLabel: { fr: "Cuisinier" },
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.PATCH,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/skills/${givenSkill.id}`,
      pathParameters: { modelId: givenModelId, id: givenSkill.id },
    };
    const actualResponse = await skillHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect OK, and the fallback language preferredLabel and other fields untouched
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    const responseBody = JSON.parse(actualResponse.body);
    expect(responseBody.preferredLabel).toEqual("Original Skill");
    expect(responseBody.description).toEqual(givenSkill.description);
  });

  test("PATCH should merge a multi language payload across different fields", async () => {
    // GIVEN a model with 'en' and 'fr' available, and a skill with English-only fields
    const givenModel = await createModelInDB();
    const givenModelId = givenModel.id;
    const givenSkill = await createSkillInDB(givenModelId);

    // WHEN patching preferredLabel and description, each with both languages
    const givenPayload: SkillAPISpecs.Skill.PATCH.Types.Request.Payload = {
      preferredLabel: { en: "Cook", fr: "Cuisinier" },
      description: { en: "A cook", fr: "Un cuisinier" },
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.PATCH,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/skills/${givenSkill.id}`,
      pathParameters: { modelId: givenModelId, id: givenSkill.id },
    };
    const actualResponse = await skillHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect OK, and the fallback (English) view of both fields updated
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    const responseBody = JSON.parse(actualResponse.body);
    expect(responseBody.preferredLabel).toEqual("Cook");
    expect(responseBody.description).toEqual("A cook");
  });

  test("PATCH should respond with BAD_REQUEST when a field carries a language not available in the model", async () => {
    // GIVEN a model with only 'en' available, and a skill
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: "Test Model",
      description: "Test Description",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
      availableLanguages: ["en"],
    });
    const givenModelId = givenModel.id;
    const givenSkill = await createSkillInDB(givenModelId);

    // WHEN patching preferredLabel with a language ('fr') the model does not support
    const givenPayload: SkillAPISpecs.Skill.PATCH.Types.Request.Payload = {
      preferredLabel: { fr: "Cuisinier" },
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.PATCH,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/skills/${givenSkill.id}`,
      pathParameters: { modelId: givenModelId, id: givenSkill.id },
    };

    // THEN expect BAD_REQUEST naming the field and language
    const actualResponse = await skillHandler(givenEvent as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    const body = JSON.parse(actualResponse.body);
    expect(body.errorCode).toEqual(SkillAPISpecs.Skill.PATCH.Errors.Status400.ErrorCodes.UNSUPPORTED_LANGUAGE);
  });

  test("PATCH should reject deleting the fallback language via null", async () => {
    // GIVEN a model and a skill
    const givenModel = await createModelInDB();
    const givenModelId = givenModel.id;
    const givenSkill = await createSkillInDB(givenModelId);

    // WHEN patching preferredLabel, attempting to delete the fallback (English) language via null
    const givenPayload = { preferredLabel: { en: null } };
    const givenEvent = {
      httpMethod: HTTP_VERBS.PATCH,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/skills/${givenSkill.id}`,
      pathParameters: { modelId: givenModelId, id: givenSkill.id },
    };

    // THEN expect the request to be rejected by schema validation (the fallback language can never be null)
    const actualResponse = await skillHandler(givenEvent as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });
});
