import { APIGatewayProxyEvent } from "aws-lambda";
import "_test_utilities/consoleMock";
import { randomUUID } from "node:crypto";
import { Connection } from "mongoose";

import { getRandomString } from "_test_utilities/getMockRandomData";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { handler as occupationHandler } from "./index";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { usersRequestContext } from "_test_utilities/dataModel";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getMockRandomOccupationCode } from "_test_utilities/mockOccupationCode";
import { getMockRandomISCOGroupCode } from "_test_utilities/mockOccupationGroupCode";
import { ObjectTypes } from "esco/common/objectTypes";

describe("Test for occupation DELETE handler with a DB", () => {
  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    const config = getTestConfiguration("OccupationDELETEHandlerTestDB");
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
      await getRepositoryRegistry().occupation.Model.deleteMany({});
      await getRepositoryRegistry().occupationHierarchy.hierarchyModel.deleteMany({});
      await getRepositoryRegistry().occupationToSkillRelation.relationModel.deleteMany({});
    }
  });

  test("DELETE should respond with FORBIDDEN when user is not a model manager", async () => {
    // GIVEN a request from a non-model-manager user
    const givenModelId = getMockStringId(1);
    const givenOccupationId = getMockStringId(2);
    const givenEvent = {
      httpMethod: HTTP_VERBS.DELETE,
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.REGISTED_USER,
      path: `/models/${givenModelId}/occupations/${givenOccupationId}`,
      pathParameters: { modelId: givenModelId, id: givenOccupationId },
    };

    // WHEN the handler is invoked
    const actualResponse = await occupationHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect FORBIDDEN
    expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
  });

  test("DELETE should respond with NO_CONTENT (204) when deleting a leaf occupation", async () => {
    // GIVEN a model exists in DB
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: "Test Model",
      description: "Test Description",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
    });

    // AND an occupation exists in DB
    const givenOccupation = await getRepositoryRegistry().occupation.create({
      modelId: givenModel.id,
      code: getMockRandomOccupationCode(false),
      occupationType: ObjectTypes.ESCOOccupation,
      preferredLabel: getRandomString(10),
      description: getRandomString(20),
      altLabels: [],
      originUri: `http://some/path/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      occupationGroupCode: getMockRandomISCOGroupCode(),
      definition: getRandomString(20),
      scopeNote: getRandomString(20),
      regulatedProfessionNote: getRandomString(20),
      isLocalized: false,
    });

    const givenEvent = {
      httpMethod: HTTP_VERBS.DELETE,
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModel.id}/occupations/${givenOccupation.id}`,
      pathParameters: { modelId: givenModel.id, id: givenOccupation.id },
    };

    // WHEN calling the handler
    const actualResponse = await occupationHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect NO_CONTENT (204)
    expect(actualResponse.statusCode).toEqual(StatusCodes.NO_CONTENT);

    // AND the occupation should no longer exist in the DB
    const found = await getRepositoryRegistry().occupation.findById(givenOccupation.id);
    expect(found).toBeNull();
  });

  test("DELETE should respond with CONFLICT (409) when trying to delete a non-leaf occupation (has children)", async () => {
    // GIVEN a model exists in DB
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: "Test Model",
      description: "Test Description",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
    });

    // AND a parent occupation exists
    const parentOccupation = await getRepositoryRegistry().occupation.create({
      modelId: givenModel.id,
      code: "1234.1",
      occupationType: ObjectTypes.ESCOOccupation,
      preferredLabel: "Parent",
      description: "Parent desc",
      altLabels: [],
      originUri: `http://some/path/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      occupationGroupCode: "1234",
      definition: "def",
      scopeNote: "scope",
      regulatedProfessionNote: "note",
      isLocalized: false,
    });

    // AND a child occupation exists
    const childOccupation = await getRepositoryRegistry().occupation.create({
      modelId: givenModel.id,
      code: "1234.1.1",
      occupationType: ObjectTypes.ESCOOccupation,
      preferredLabel: "Child",
      description: "Child desc",
      altLabels: [],
      originUri: `http://some/path/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      occupationGroupCode: "1234",
      definition: "def",
      scopeNote: "scope",
      regulatedProfessionNote: "note",
      isLocalized: false,
    });

    // AND a parent-child relationship exists
    await getRepositoryRegistry().occupationHierarchy.createMany(givenModel.id, [
      {
        parentType: ObjectTypes.ESCOOccupation,
        parentId: parentOccupation.id,
        childType: ObjectTypes.ESCOOccupation,
        childId: childOccupation.id,
      },
    ]);

    const givenEvent = {
      httpMethod: HTTP_VERBS.DELETE,
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModel.id}/occupations/${parentOccupation.id}`,
      pathParameters: { modelId: givenModel.id, id: parentOccupation.id },
    };

    // WHEN calling the handler to delete the parent occupation
    const actualResponse = await occupationHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect CONFLICT (409)
    expect(actualResponse.statusCode).toEqual(StatusCodes.CONFLICT);
  });

  test("DELETE should respond with NOT_FOUND (404) when occupation does not exist", async () => {
    // GIVEN a model exists in DB
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: "Test Model",
      description: "Test Description",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
    });
    const nonExistentId = getMockStringId(999);

    const givenEvent = {
      httpMethod: HTTP_VERBS.DELETE,
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModel.id}/occupations/${nonExistentId}`,
      pathParameters: { modelId: givenModel.id, id: nonExistentId },
    };

    // WHEN calling the handler
    const actualResponse = await occupationHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect NOT_FOUND (404)
    expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
  });
});
