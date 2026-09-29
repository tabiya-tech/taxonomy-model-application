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

describe("Test for skill PUT handler with a DB", () => {
  const ajv = new Ajv({ validateSchema: true, strict: true, allErrors: true });
  addFormats(ajv);
  ajv.addSchema(SkillAPISpecs.Skill.PUT.Schemas.Response.Payload);

  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    const config = getTestConfiguration("SkillPUTHandlerTestDB");
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

  async function createModelInDB(availableLanguages: string[] = ["en", "fr"]) {
    return await getRepositoryRegistry().modelInfo.create({
      name: "Test Model",
      description: "Test Description",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
      availableLanguages,
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

  function buildPUTPayload(modelId: string): SkillAPISpecs.Skill.PUT.Types.Request.Payload {
    return {
      modelId,
      preferredLabel: { en: "Updated Skill" },
      originUri: `http://example.com/skills/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      altLabels: [],
      definition: { en: "Updated definition" },
      description: { en: "Updated description" },
      scopeNote: { en: "Updated scope" },
      skillType: SkillAPISpecs.Enums.SkillType.Knowledge,
      reuseLevel: SkillAPISpecs.Enums.ReuseLevel.CrossSector,
      isLocalized: false,
    };
  }

  test("PUT should respond with FORBIDDEN when user is not a model manager", async () => {
    const givenModelId = "model-1";
    const givenPayload = buildPUTPayload(givenModelId);
    const givenEvent = {
      httpMethod: HTTP_VERBS.PUT,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.REGISTED_USER,
      path: `/models/${givenModelId}/skills/${randomUUID()}`,
    };

    const actualResponse = await skillHandler(givenEvent as unknown as APIGatewayProxyEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
  });

  test("PUT should respond with OK and response passes JSON schema validation", async () => {
    const givenModel = await createModelInDB();
    const givenModelId = givenModel.id;

    const givenSkill = await createSkillInDB(givenModelId);

    const givenPayload = buildPUTPayload(givenModelId);
    const givenEvent = {
      httpMethod: HTTP_VERBS.PUT,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/skills/${givenSkill.id}`,
      pathParameters: { modelId: givenModelId, id: givenSkill.id },
    };

    const actualResponse = await skillHandler(givenEvent as unknown as APIGatewayProxyEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    expect(
      ajv.getSchema(SkillAPISpecs.Skill.PUT.Schemas.Response.Payload.$id as string)?.(JSON.parse(actualResponse.body))
    ).toBeTruthy();
    expect(JSON.parse(actualResponse.body).preferredLabel).toEqual("Updated Skill");
  });

  test("PUT should accept a multi language payload and reflect the fallback language in the response", async () => {
    // GIVEN a model with 'en' and 'fr' available, and a skill
    const givenModel = await createModelInDB();
    const givenModelId = givenModel.id;
    const givenSkill = await createSkillInDB(givenModelId);

    // WHEN replacing the skill with a payload whose preferredLabel carries both languages
    const givenPayload = {
      ...buildPUTPayload(givenModelId),
      preferredLabel: { en: "Cook", fr: "Cuisinier" },
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.PUT,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/skills/${givenSkill.id}`,
      pathParameters: { modelId: givenModelId, id: givenSkill.id },
    };

    // THEN expect OK, and the response (fallback language view) to reflect the English value
    const actualResponse = await skillHandler(givenEvent as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    expect(JSON.parse(actualResponse.body).preferredLabel).toEqual("Cook");
  });

  test("PUT should remove a previously stored non fallback language translation that is omitted from the payload", async () => {
    // GIVEN a model with 'en' and 'fr' available, and a skill whose preferredLabel carries a French translation
    const givenModel = await createModelInDB();
    const givenModelId = givenModel.id;
    const givenSkill = await createSkillInDB(givenModelId);
    await getRepositoryRegistry().skill.Model.updateOne(
      { _id: givenSkill.id },
      { $set: { "preferredLabel.fr": "Cuisinier" } }
    );

    // WHEN replacing the skill with a payload whose preferredLabel omits French (English only)
    const givenPayload = buildPUTPayload(givenModelId);
    const givenEvent = {
      httpMethod: HTTP_VERBS.PUT,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/skills/${givenSkill.id}`,
      pathParameters: { modelId: givenModelId, id: givenSkill.id },
    };
    await skillHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect the French translation to have been removed (PUT is a full replace)
    const actualRawDoc = await getRepositoryRegistry().skill.Model.findById(givenSkill.id).lean();
    expect(actualRawDoc?.preferredLabel).toEqual({ en: "Updated Skill" });
    expect(actualRawDoc?.preferredLabel).not.toHaveProperty("fr");
  });

  test("PUT should respond with BAD_REQUEST when a field carries a language not available in the model", async () => {
    // GIVEN a model with only 'en' available, and a skill
    const givenModel = await createModelInDB(["en"]);
    const givenModelId = givenModel.id;
    const givenSkill = await createSkillInDB(givenModelId);

    // WHEN replacing the skill with a payload whose preferredLabel carries a language ('fr') the model does not support
    const givenPayload = {
      ...buildPUTPayload(givenModelId),
      preferredLabel: { en: "Cook", fr: "Cuisinier" },
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.PUT,
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
    expect(body.errorCode).toEqual(SkillAPISpecs.Skill.PUT.Errors.Status400.ErrorCodes.UNSUPPORTED_LANGUAGE);
  });
});
