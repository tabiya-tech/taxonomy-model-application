import { APIGatewayProxyEvent } from "aws-lambda";
import "_test_utilities/consoleMock";
import Ajv, { ValidateFunction } from "ajv";
import { randomUUID } from "node:crypto";
import { Connection } from "mongoose";

import OccupationAPISpecs from "api-specifications/esco/occupation";

import { StatusCodes } from "server/httpUtils";
import { handler as occupationHandler } from "./index";
import addFormats from "ajv-formats";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { ObjectTypes } from "esco/common/objectTypes";

describe("Test for occupation Parent GET handler with a DB", () => {
  const ajv = new Ajv({
    validateSchema: true,
    strict: true,
    allErrors: true,
  });
  addFormats(ajv);
  ajv.addSchema(OccupationAPISpecs.POST.Schemas.Response.Payload); // Reuse for parent entity
  const validateParentResponse: ValidateFunction = ajv.getSchema(
    OccupationAPISpecs.POST.Schemas.Response.Payload.$id as string
  ) as ValidateFunction;

  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    const config = getTestConfiguration("OccupationParentHandlerTestDB");
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

  test("GET /occupations/{id}/parent should return the parent of the occupation", async () => {
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: "Test Model",
      description: "Test Description",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
    });
    const givenModelId = givenModel.id;
    const repository = getRepositoryRegistry().occupation;
    const givenParent = await repository.create({
      modelId: givenModelId,
      code: "1234.1",
      preferredLabel: "Parent",
      occupationType: ObjectTypes.ESCOOccupation,
      originUri: "http://example.com/parent",
      UUIDHistory: [randomUUID()],
      isLocalized: false,
      description: "parent description",
      occupationGroupCode: "1234",
      altLabels: [],
      definition: "parent definition",
      scopeNote: "parent scopeNote",
      regulatedProfessionNote: "parent regulatedProfessionNote",
    });
    const givenChild = await repository.create({
      modelId: givenModelId,
      code: "1234.1.1",
      preferredLabel: "Child",
      occupationType: ObjectTypes.ESCOOccupation,
      originUri: "http://example.com/child",
      UUIDHistory: [randomUUID()],
      isLocalized: false,
      description: "child description",
      occupationGroupCode: "1234",
      altLabels: [],
      definition: "child definition",
      scopeNote: "child scopeNote",
      regulatedProfessionNote: "child regulatedProfessionNote",
    });

    await getRepositoryRegistry().occupationHierarchy.createMany(givenModelId, [
      {
        parentId: givenParent.id,
        parentType: ObjectTypes.ESCOOccupation,
        childId: givenChild.id,
        childType: ObjectTypes.ESCOOccupation,
      },
    ]);

    const givenEvent = {
      httpMethod: "GET",
      path: `/models/${givenModelId}/occupations/${givenChild.id}/parent`,
      pathParameters: { modelId: givenModelId, id: givenChild.id },
    };
    const actualResponse = await occupationHandler(givenEvent as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    expect(validateParentResponse(JSON.parse(actualResponse.body))).toBeTruthy();
    expect(JSON.parse(actualResponse.body).id).toEqual(givenParent.id);
  });

  test("GET /occupations/{id}/parent should return the parent OccupationGroup of the occupation", async () => {
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: "Test Model 2",
      description: "Test Description 2",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
    });
    const givenModelId = givenModel.id;

    const groupRepository = getRepositoryRegistry().OccupationGroup;
    const givenParent = await groupRepository.create({
      modelId: givenModelId,
      code: "1234",
      preferredLabel: "Parent Group",
      groupType: ObjectTypes.ISCOGroup,
      originUri: "http://example.com/parent-group",
      UUIDHistory: [randomUUID()],
      description: "group description",
      altLabels: [],
    });

    const occupationRepository = getRepositoryRegistry().occupation;
    const givenChild = await occupationRepository.create({
      modelId: givenModelId,
      code: "1234.1",
      preferredLabel: "Child",
      occupationType: ObjectTypes.ESCOOccupation,
      originUri: "http://example.com/child",
      UUIDHistory: [randomUUID()],
      isLocalized: false,
      description: "child description",
      occupationGroupCode: "1234",
      altLabels: [],
      definition: "child definition",
      scopeNote: "child scopeNote",
      regulatedProfessionNote: "child regulatedProfessionNote",
    });

    await getRepositoryRegistry().occupationHierarchy.createMany(givenModelId, [
      {
        parentId: givenParent.id,
        parentType: ObjectTypes.ISCOGroup,
        childId: givenChild.id,
        childType: ObjectTypes.ESCOOccupation,
      },
    ]);

    const givenEvent = {
      httpMethod: "GET",
      path: `/models/${givenModelId}/occupations/${givenChild.id}/parent`,
      pathParameters: { modelId: givenModelId, id: givenChild.id },
    };
    const actualResponse = await occupationHandler(givenEvent as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    const body = JSON.parse(actualResponse.body);
    expect(body.id).toEqual(givenParent.id);
    expect(body.preferredLabel).toEqual("Parent Group");
  });
});
