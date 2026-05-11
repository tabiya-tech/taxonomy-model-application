import "_test_utilities/consoleMock";
import Ajv, { ValidateFunction } from "ajv";
import addFormats from "ajv-formats";
import { randomUUID } from "node:crypto";
import { Connection } from "mongoose";

import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";

import { getRandomString, getTestString } from "_test_utilities/getMockRandomData";
import { getMockRandomISCOGroupCode } from "_test_utilities/mockOccupationGroupCode";
import { usersRequestContext } from "_test_utilities/dataModel";
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

describe("Test for occupationGroup POST handler with a DB", () => {
  const ajv = new Ajv({
    validateSchema: true,
    strict: true,
    allErrors: true,
  });
  addFormats(ajv);
  ajv.addSchema(OccupationGroupAPISpecs.POST.Schemas.Response.Payload);
  const validatePOSTResponse: ValidateFunction = ajv.getSchema(
    OccupationGroupAPISpecs.POST.Schemas.Response.Payload.$id as string
  ) as ValidateFunction;

  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    const config = getTestConfiguration("OccupationGroupPostHandlerTestDB");
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

  test("POST /occupationGroups should create an occupation group and return a valid response", async () => {
    const givenModelInfo = await createModelInDB();
    const givenPayload: OccupationGroupAPISpecs.POST.Types.Request.Payload = {
      modelId: givenModelInfo.id.toString(),
      code: getMockRandomISCOGroupCode(),
      groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
      preferredLabel: getRandomString(OccupationGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
      description: getTestString(OccupationGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
      altLabels: [getRandomString(OccupationGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH)],
      originUri: `https://example.com/resources/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
    };

    const givenEvent = {
      httpMethod: "POST",
      body: JSON.stringify(givenPayload),
      headers: {
        "Content-Type": "application/json",
      },
      path: `/models/${givenModelInfo.id}/occupationGroups`,
      pathParameters: { modelId: givenModelInfo.id.toString() },
      requestContext: usersRequestContext.MODEL_MANAGER,
    };

    const actualResponse = await occupationGroupHandler(givenEvent as never);
    expect(actualResponse.statusCode).toEqual(StatusCodes.CREATED);

    const actualBody = JSON.parse(actualResponse.body);
    expect(validatePOSTResponse(actualBody)).toBeTruthy();
    expect(actualBody.modelId).toEqual(givenModelInfo.id.toString());
    expect(actualBody.code).toEqual(givenPayload.code);
  });
});
