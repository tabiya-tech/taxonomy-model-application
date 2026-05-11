import { APIGatewayProxyEvent } from "aws-lambda";
import "_test_utilities/consoleMock";
import Ajv, { ValidateFunction } from "ajv";
import { randomUUID } from "node:crypto";
import { Connection } from "mongoose";

import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";

import { StatusCodes } from "server/httpUtils";
import { handler as occupationGroupChildrenHandler } from "./index";
import addFormats from "ajv-formats";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { ObjectTypes } from "esco/common/objectTypes";
import { getSimpleNewISCOGroupSpec, getSimpleNewISCOGroupSpecWithParentCode } from "esco/_test_utilities/getNewSpecs";

describe("Test for occupation Children GET handler with a DB", () => {
  const ajv = new Ajv({
    validateSchema: true,
    strict: true,
    allErrors: true,
  });
  addFormats(ajv);
  ajv.addSchema(OccupationGroupAPISpecs.OccupationGroup.Children.GET.Schemas.Response.Children.Payload);
  const validateChildrenResponse: ValidateFunction = ajv.getSchema(
    OccupationGroupAPISpecs.OccupationGroup.Children.GET.Schemas.Response.Children.Payload.$id as string
  ) as ValidateFunction;

  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    const config = getTestConfiguration("OccupationGroupChildrenHandlerTestDB");
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

  test("GET /occupationGroups/{id}/children should return the children of the occupation group", async () => {
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: "Test Model",
      description: "Test Description",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
    });
    const givenModelId = givenModel.id;
    const repository = getRepositoryRegistry().OccupationGroup;
    const givenParent = await repository.create({
      ...getSimpleNewISCOGroupSpec(givenModelId, "parent"),
      originUri: "https://example.com/occupation-groups/parent",
      description: "Parent occupation group",
    });
    const givenChild = await repository.create({
      ...getSimpleNewISCOGroupSpecWithParentCode(givenModelId, "child_1", givenParent.code),
      originUri: "https://example.com/occupation-groups/child-1",
      description: "Child occupation group",
    });

    await getRepositoryRegistry().occupationHierarchy.createMany(givenModelId, [
      {
        parentId: givenParent.id,
        parentType: ObjectTypes.ISCOGroup,
        childId: givenChild.id,
        childType: ObjectTypes.ISCOGroup,
      },
    ]);

    const givenEvent = {
      httpMethod: "GET",
      path: `/models/${givenModelId}/occupationGroups/${givenParent.id}/children`,
      pathParameters: { modelId: givenModelId, id: givenParent.id },
    };
    const actualResponse = await occupationGroupChildrenHandler(givenEvent as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    const actualBody = JSON.parse(actualResponse.body);
    expect(validateChildrenResponse(actualBody)).toBeTruthy();
    expect(actualBody.data[0].id).toEqual(givenChild.id);
  });
});
