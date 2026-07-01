import { APIGatewayProxyEvent } from "aws-lambda";
import "_test_utilities/consoleMock";
import Ajv, { ValidateFunction } from "ajv";
import { randomUUID } from "node:crypto";
import { Connection } from "mongoose";

import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";
import LocaleAPISpecs from "api-specifications/locale";

import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { handler as occupationGroupHistoryHandler } from "./index";
import addFormats from "ajv-formats";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getSimpleNewISCOGroupSpec } from "esco/_test_utilities/getNewSpecs";
import { INewOccupationGroupSpec } from "esco/occupationGroup/_shared/OccupationGroup.types";

async function createModelInDB() {
  return await getRepositoryRegistry().modelInfo.create({
    name: "Test Model",
    description: "Test Description",
    locale: { shortCode: "en", name: "English", UUID: randomUUID() },
    license: "MIT",
    UUIDHistory: [],
  });
}

async function createOccupationGroupInDB(modelId: string, spec?: Partial<INewOccupationGroupSpec>) {
  return await getRepositoryRegistry().OccupationGroup.create({
    ...getSimpleNewISCOGroupSpec(modelId, "group"),
    originUri: `https://example.com/occupation-groups/${randomUUID()}`,
    description: "An occupation group",
    ...spec,
  });
}

describe("Test for occupationGroup History GET handler with a DB", () => {
  const ajv = new Ajv({ validateSchema: true, strict: true, allErrors: true });
  addFormats(ajv);
  ajv.addSchema(LocaleAPISpecs.Schemas.Payload);
  ajv.addSchema(OccupationGroupAPISpecs.OccupationGroup.History.GET.Schemas.Response.Payload);
  const validateHistoryResponse: ValidateFunction = ajv.getSchema(
    OccupationGroupAPISpecs.OccupationGroup.History.GET.Schemas.Response.Payload.$id as string
  ) as ValidateFunction;

  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    const config = getTestConfiguration("OccupationGroupHistoryHandlerTestDB");
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
      await dbConnection.models.OccupationGroupModel.deleteMany({});
      await dbConnection.models.ModelInfo.deleteMany({});
    }
  });

  test("GET /occupationGroups/{id}/history should resolve the occupation group's history to the models it appeared in", async () => {
    // GIVEN a prior model containing an occupation group (an earlier version of the group)
    const givenPriorModel = await createModelInDB();
    const givenPriorGroup = await createOccupationGroupInDB(givenPriorModel.id);

    // AND a current model containing the current version of the group, whose UUIDHistory references the prior
    // group's UUID (plus a UUID that does not resolve to any occupation group)
    const givenCurrentModel = await createModelInDB();
    const givenCurrentGroup = await createOccupationGroupInDB(givenCurrentModel.id, {
      UUIDHistory: [givenPriorGroup.UUID, randomUUID()],
    });
    // create prepends the group's own new UUID, so its history is [currentUUID, priorGroup.UUID, <non-existent>].

    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      path: `/models/${givenCurrentModel.id}/occupationGroups/${givenCurrentGroup.id}/history`,
      pathParameters: { modelId: givenCurrentModel.id, id: givenCurrentGroup.id },
    };

    // WHEN the handler is called
    const actualResponse = await occupationGroupHistoryHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect OK, a schema-valid body, and the two models in UUIDHistory order (current then prior)
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    const actualBody = JSON.parse(actualResponse.body);
    expect(validateHistoryResponse(actualBody)).toBeTruthy();
    expect(actualBody).toHaveLength(2);
    expect(actualBody[0].id).toEqual(givenCurrentModel.id);
    expect(actualBody[1].id).toEqual(givenPriorModel.id);
  });

  test("GET /occupationGroups/{id}/history should return only the current model for a freshly created occupation group", async () => {
    // GIVEN a model and a freshly created occupation group (create prepends its own UUID, so a brand-new group
    // has exactly one history entry: its own UUID in the current model)
    const givenModel = await createModelInDB();
    const givenGroup = await createOccupationGroupInDB(givenModel.id, { UUIDHistory: [] });
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      path: `/models/${givenModel.id}/occupationGroups/${givenGroup.id}/history`,
      pathParameters: { modelId: givenModel.id, id: givenGroup.id },
    };

    // WHEN the handler is called
    const actualResponse = await occupationGroupHistoryHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect OK and exactly the group's current model
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    const actualBody = JSON.parse(actualResponse.body);
    expect(validateHistoryResponse(actualBody)).toBeTruthy();
    expect(actualBody).toHaveLength(1);
    expect(actualBody[0].id).toEqual(givenModel.id);
  });

  test("GET /occupationGroups/{id}/history should respond with NOT_FOUND when the occupation group does not exist", async () => {
    // GIVEN a model exists but the occupation group does not
    const givenModel = await createModelInDB();
    const givenNonExistentId = getMockStringId(9999);
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      path: `/models/${givenModel.id}/occupationGroups/${givenNonExistentId}/history`,
      pathParameters: { modelId: givenModel.id, id: givenNonExistentId },
    };

    // WHEN the handler is called
    const actualResponse = await occupationGroupHistoryHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect NOT_FOUND
    expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      OccupationGroupAPISpecs.OccupationGroup.History.GET.Enums.Response.Status404.ErrorCodes.OCCUPATION_GROUP_NOT_FOUND
    );
  });
});
