import "_test_utilities/consoleMock";
import Ajv, { ValidateFunction } from "ajv";
import addFormats from "ajv-formats";
import { randomUUID } from "node:crypto";
import { Connection } from "mongoose";

import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";

import { getRandomString, getTestString } from "_test_utilities/getMockRandomData";
import { getMockRandomISCOGroupCode } from "_test_utilities/mockOccupationGroupCode";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { StatusCodes } from "server/httpUtils";
import { handler as occupationGroupHandler } from "./index";
import ModelInfoAPISpecs from "api-specifications/modelInfo";
import LocaleAPISpecs from "api-specifications/locale";

async function createModelInDB() {
  return await getRepositoryRegistry().modelInfo.create({
    name: getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
    locale: {
      UUID: randomUUID(),
      name: getTestString(LocaleAPISpecs.Constants.NAME_MAX_LENGTH),
      shortCode: getTestString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
    },
    description: getTestString(ModelInfoAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    license: getTestString(ModelInfoAPISpecs.Constants.LICENSE_MAX_LENGTH),
    UUIDHistory: [randomUUID()],
  });
}

async function createOccupationGroupInDB(modelId: string = getMockStringId(1)) {
  return await getRepositoryRegistry().OccupationGroup.create({
    modelId: modelId,
    code: getMockRandomISCOGroupCode(),
    groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
    preferredLabel: getRandomString(OccupationGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    description: getTestString(OccupationGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    altLabels: [getRandomString(OccupationGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH)],
    originUri: `https://example.com/resources/${randomUUID()}`,
    UUIDHistory: [randomUUID()],
  });
}

async function createOccupationGroupsInDB(count: number, modelId: string = getMockStringId(1)) {
  const occupationGroups = [];
  for (let i = 0; i < count; i++) {
    occupationGroups.push(await createOccupationGroupInDB(modelId));
  }
  return occupationGroups;
}

describe("Test for occupationGroup GET handler with a DB", () => {
  const ajv = new Ajv({
    validateSchema: true,
    strict: true,
    allErrors: true,
  });
  addFormats(ajv);
  ajv.addSchema(OccupationGroupAPISpecs.GET.Schemas.Response.Payload);
  const validateGETResponse: ValidateFunction = ajv.getSchema(
    OccupationGroupAPISpecs.GET.Schemas.Response.Payload.$id as string
  ) as ValidateFunction;

  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    const config = getTestConfiguration("OccupationGroupGetHandlerTestDB");
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

  test("GET /occupationGroups should return a paginated list of occupation groups", async () => {
    const givenModelInfo = await createModelInDB();
    const occupationGroups = await createOccupationGroupsInDB(3, givenModelInfo.id.toString());
    expect(occupationGroups.length).toBeGreaterThan(0);

    const limit = 2;
    const cursor = Buffer.from(
      JSON.stringify({ id: occupationGroups[2].id, createdAt: occupationGroups[2].createdAt })
    ).toString("base64");

    const givenEvent = {
      httpMethod: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      pathParameters: { modelId: givenModelInfo.id.toString() },
      path: `/models/${givenModelInfo.id}/occupationGroups`,
      queryStringParameters: {
        limit: limit.toString(),
        cursor: cursor,
      },
    };

    const actualResponse = await occupationGroupHandler(givenEvent as never);
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);

    const actualBody = JSON.parse(actualResponse.body);
    expect(validateGETResponse(actualBody)).toBeTruthy();
    expect(actualBody.limit).toEqual(limit);
    expect(actualBody.data).toHaveLength(limit);
  });
});
