import "_test_utilities/consoleMock";

import { APIGatewayProxyEvent } from "aws-lambda";
import Ajv, { ValidateFunction } from "ajv";
import addFormats from "ajv-formats";
import { randomUUID } from "node:crypto";
import { Connection } from "mongoose";

import SkillAPISpecs from "api-specifications/esco/skill";
import ModelInfoAPISpecs from "api-specifications/modelInfo";

import { getRandomString } from "_test_utilities/getMockRandomData";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { handler as skillHistoryHandler } from "./index";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { ISkill } from "esco/skill/_shared/skill.types";
import { getMockStringId } from "_test_utilities/mockMongoId";

async function createModelInDB() {
  return await getRepositoryRegistry().modelInfo.create({
    name: "Test Model",
    description: "Test Description",
    locale: { shortCode: "en", name: "English", UUID: randomUUID() },
    license: "MIT",
    UUIDHistory: [],
  });
}

async function createSkillInDB(modelId: string, uuidHistory: string[] = [randomUUID()]): Promise<ISkill> {
  return await getRepositoryRegistry().skill.create({
    modelId: modelId,
    preferredLabel: getRandomString(SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    description: getRandomString(SkillAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    altLabels: [getRandomString(SkillAPISpecs.Constants.ALT_LABEL_MAX_LENGTH)],
    originUri: `http://some/path/to/api/resources/${randomUUID()}`,
    UUIDHistory: uuidHistory,
    scopeNote: getRandomString(SkillAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH),
    definition: getRandomString(SkillAPISpecs.Constants.DEFINITION_MAX_LENGTH),
    skillType: SkillAPISpecs.Enums.SkillType.Knowledge,
    reuseLevel: SkillAPISpecs.Enums.ReuseLevel.CrossSector,
    isLocalized: true,
  });
}

describe("Test for skill History GET handler with a DB", () => {
  const ajv = new Ajv({ validateSchema: true, strict: true, allErrors: true });
  addFormats(ajv);
  ajv.addSchema(ModelInfoAPISpecs.Schemas.Reference);
  ajv.addSchema(SkillAPISpecs.Skill.History.GET.Schemas.Response.Payload);
  const validateHistoryResponse: ValidateFunction = ajv.getSchema(
    SkillAPISpecs.Skill.History.GET.Schemas.Response.Payload.$id as string
  ) as ValidateFunction;

  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    const config = getTestConfiguration("SkillHistoryHandlerTestDB");
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

  test("GET /skills/{id}/history should resolve the skill's history to the models it appeared in", async () => {
    // GIVEN a prior model containing a skill (an earlier version of the skill)
    const givenPriorModel = await createModelInDB();
    const givenPriorSkill = await createSkillInDB(givenPriorModel.id);

    // AND a current model containing the current version of the skill, whose UUIDHistory references the prior
    // skill's UUID (plus a UUID that does not resolve to any skill)
    const givenCurrentModel = await createModelInDB();
    const givenCurrentSkill = await createSkillInDB(givenCurrentModel.id, [givenPriorSkill.UUID, randomUUID()]);
    // create prepends the skill's own new UUID, so its history is [currentUUID, priorSkill.UUID, <non-existent>].

    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      path: `/models/${givenCurrentModel.id}/skills/${givenCurrentSkill.id}/history`,
      pathParameters: { modelId: givenCurrentModel.id, id: givenCurrentSkill.id },
    };

    // WHEN the handler is called
    const actualResponse = await skillHistoryHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect OK, a schema-valid body, and the two models in UUIDHistory order (current then prior)
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    const actualBody = JSON.parse(actualResponse.body);
    expect(validateHistoryResponse(actualBody)).toBeTruthy();
    expect(actualBody).toHaveLength(2);
    // Each item is the skill's reference (as it was in that model) flat, plus the stripped model under `model`.
    expect(actualBody[0].id).toEqual(givenCurrentSkill.id);
    expect(actualBody[0].model.id).toEqual(givenCurrentModel.id);
    expect(actualBody[1].id).toEqual(givenPriorSkill.id);
    expect(actualBody[1].model.id).toEqual(givenPriorModel.id);
  });

  test("GET /skills/{id}/history should return only the current model for a freshly created skill", async () => {
    // GIVEN a model and a freshly created skill (create prepends its own UUID, so a brand-new skill has exactly
    // one history entry: its own UUID in the current model)
    const givenModel = await createModelInDB();
    const givenSkill = await createSkillInDB(givenModel.id, []);
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      path: `/models/${givenModel.id}/skills/${givenSkill.id}/history`,
      pathParameters: { modelId: givenModel.id, id: givenSkill.id },
    };

    // WHEN the handler is called
    const actualResponse = await skillHistoryHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect OK and exactly the skill's current model
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    const actualBody = JSON.parse(actualResponse.body);
    expect(validateHistoryResponse(actualBody)).toBeTruthy();
    expect(actualBody).toHaveLength(1);
    expect(actualBody[0].id).toEqual(givenSkill.id);
    expect(actualBody[0].model.id).toEqual(givenModel.id);
  });

  test("GET /skills/{id}/history should respond with NOT_FOUND when the skill does not exist", async () => {
    // GIVEN a model exists but the skill does not
    const givenModel = await createModelInDB();
    const givenNonExistentId = getMockStringId(9999);
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      path: `/models/${givenModel.id}/skills/${givenNonExistentId}/history`,
      pathParameters: { modelId: givenModel.id, id: givenNonExistentId },
    };

    // WHEN the handler is called
    const actualResponse = await skillHistoryHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect NOT_FOUND
    expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      SkillAPISpecs.GET.Errors.Status404.History.ErrorCodes.SKILL_NOT_FOUND
    );
  });
});
