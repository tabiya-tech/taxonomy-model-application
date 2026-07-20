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

  test("PUT should respond with FORBIDDEN when user is not a model manager", async () => {
    const givenModelId = "model-1";
    const givenPayload: SkillAPISpecs.Skill.PUT.Types.Request.Payload = {
      modelId: givenModelId,
      preferredLabel: "Updated Skill",
      originUri: `http://example.com/skills/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      altLabels: ["Alt label"],
      definition: "Definition",
      description: "Description",
      scopeNote: "Scope note",
      skillType: SkillAPISpecs.Enums.SkillType.Knowledge,
      reuseLevel: SkillAPISpecs.Enums.ReuseLevel.CrossSector,
      isLocalized: false,
    };
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
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: "Test Model",
      description: "Test Description",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
    });
    const givenModelId = givenModel.id;

    const givenSkill = await getRepositoryRegistry().skill.create({
      modelId: givenModelId,
      preferredLabel: "Original Skill",
      description: getRandomString(SkillAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
      altLabels: [getRandomString(SkillAPISpecs.Constants.ALT_LABEL_MAX_LENGTH)],
      originUri: `http://example.com/skills/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      definition: getRandomString(SkillAPISpecs.Constants.DEFINITION_MAX_LENGTH),
      scopeNote: getRandomString(SkillAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH),
      skillType: SkillAPISpecs.Enums.SkillType.Knowledge,
      reuseLevel: SkillAPISpecs.Enums.ReuseLevel.CrossSector,
      isLocalized: false,
    });

    const givenPayload: SkillAPISpecs.Skill.PUT.Types.Request.Payload = {
      modelId: givenModelId,
      preferredLabel: "Updated Skill",
      originUri: `http://example.com/skills/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      altLabels: [],
      definition: "Updated definition",
      description: "Updated description",
      scopeNote: "Updated scope",
      skillType: SkillAPISpecs.Enums.SkillType.Knowledge,
      reuseLevel: SkillAPISpecs.Enums.ReuseLevel.CrossSector,
      isLocalized: false,
    };
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
});
