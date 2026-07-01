import "_test_utilities/consoleMock";

import { APIGatewayProxyEvent } from "aws-lambda";
import Ajv, { ValidateFunction } from "ajv";
import addFormats from "ajv-formats";
import { randomUUID } from "node:crypto";
import { Connection } from "mongoose";

import SkillGroupAPISpecs from "api-specifications/esco/skillGroup";
import LocaleAPISpecs from "api-specifications/locale";

import { getRandomString } from "_test_utilities/getMockRandomData";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { handler as skillGroupHistoryHandler } from "./index";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { ISkillGroup } from "../../../_shared/skillGroup.types";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getTestSkillGroupCode } from "_test_utilities/mockSkillGroupCode";

async function createModelInDB() {
  return await getRepositoryRegistry().modelInfo.create({
    name: "Test Model",
    description: "Test Description",
    locale: { shortCode: "en", name: "English", UUID: randomUUID() },
    license: "MIT",
    UUIDHistory: [],
  });
}

async function createSkillGroupInDB(modelId: string, uuidHistory: string[] = [randomUUID()]): Promise<ISkillGroup> {
  return await getRepositoryRegistry().skillGroup.create({
    modelId: modelId,
    code: getTestSkillGroupCode(100),
    description: getRandomString(SkillGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    altLabels: [getRandomString(SkillGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH)],
    originUri: `http://some/path/to/api/resources/${randomUUID()}`,
    UUIDHistory: uuidHistory,
    scopeNote: getRandomString(SkillGroupAPISpecs.Constants.MAX_SCOPE_NOTE_LENGTH),
    preferredLabel: getRandomString(SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
  });
}

describe("Test for skillGroup History GET handler with a DB", () => {
  const ajv = new Ajv({ validateSchema: true, strict: true, allErrors: true });
  addFormats(ajv);
  ajv.addSchema(LocaleAPISpecs.Schemas.Payload);
  ajv.addSchema(SkillGroupAPISpecs.SkillGroup.History.GET.Schemas.Response.Payload);
  const validateHistoryResponse: ValidateFunction = ajv.getSchema(
    SkillGroupAPISpecs.SkillGroup.History.GET.Schemas.Response.Payload.$id as string
  ) as ValidateFunction;

  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    const config = getTestConfiguration("SkillGroupHistoryHandlerTestDB");
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
      await dbConnection.models.ModelInfo.deleteMany({});
    }
  });

  test("GET /skillGroups/{id}/history should resolve the skill group's history to the models it appeared in", async () => {
    // GIVEN a prior model containing a skill group (an earlier version of the group)
    const givenPriorModel = await createModelInDB();
    const givenPriorGroup = await createSkillGroupInDB(givenPriorModel.id);

    // AND a current model containing the current version of the group, whose UUIDHistory references the prior
    // group's UUID (plus a UUID that does not resolve to any skill group)
    const givenCurrentModel = await createModelInDB();
    const givenCurrentGroup = await createSkillGroupInDB(givenCurrentModel.id, [givenPriorGroup.UUID, randomUUID()]);
    // create prepends the group's own new UUID, so its history is [currentUUID, priorGroup.UUID, <non-existent>].

    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      path: `/models/${givenCurrentModel.id}/skillGroups/${givenCurrentGroup.id}/history`,
      pathParameters: { modelId: givenCurrentModel.id, id: givenCurrentGroup.id },
    };

    // WHEN the handler is called
    const actualResponse = await skillGroupHistoryHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect OK, a schema-valid body, and the two models in UUIDHistory order (current then prior)
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    const actualBody = JSON.parse(actualResponse.body);
    expect(validateHistoryResponse(actualBody)).toBeTruthy();
    expect(actualBody).toHaveLength(2);
    expect(actualBody[0].id).toEqual(givenCurrentModel.id);
    expect(actualBody[1].id).toEqual(givenPriorModel.id);
  });

  test("GET /skillGroups/{id}/history should return only the current model for a freshly created skill group", async () => {
    // GIVEN a model and a freshly created skill group (create prepends its own UUID, so a brand-new group has
    // exactly one history entry: its own UUID in the current model)
    const givenModel = await createModelInDB();
    const givenGroup = await createSkillGroupInDB(givenModel.id, []);
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      path: `/models/${givenModel.id}/skillGroups/${givenGroup.id}/history`,
      pathParameters: { modelId: givenModel.id, id: givenGroup.id },
    };

    // WHEN the handler is called
    const actualResponse = await skillGroupHistoryHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect OK and exactly the group's current model
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    const actualBody = JSON.parse(actualResponse.body);
    expect(validateHistoryResponse(actualBody)).toBeTruthy();
    expect(actualBody).toHaveLength(1);
    expect(actualBody[0].id).toEqual(givenModel.id);
  });

  test("GET /skillGroups/{id}/history should respond with NOT_FOUND when the skill group does not exist", async () => {
    // GIVEN a model exists but the skill group does not
    const givenModel = await createModelInDB();
    const givenNonExistentId = getMockStringId(9999);
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      path: `/models/${givenModel.id}/skillGroups/${givenNonExistentId}/history`,
      pathParameters: { modelId: givenModel.id, id: givenNonExistentId },
    };

    // WHEN the handler is called
    const actualResponse = await skillGroupHistoryHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect NOT_FOUND
    expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      SkillGroupAPISpecs.SkillGroup.History.GET.Enums.Response.Status404.ErrorCodes.SKILL_GROUP_NOT_FOUND
    );
  });
});
