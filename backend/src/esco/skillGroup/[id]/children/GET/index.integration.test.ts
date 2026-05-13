import "_test_utilities/consoleMock";
import Ajv, { ValidateFunction } from "ajv";
import { randomUUID } from "node:crypto";
import { Connection } from "mongoose";

import SkillGroupAPISpecs from "api-specifications/esco/skillGroup";

import { getRandomString, getTestString } from "_test_utilities/getMockRandomData";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { handler as skillGroupHandler } from "./index";
import addFormats from "ajv-formats";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { ISkillGroup } from "../../../_shared/skillGroup.types";
import { getMockStringId } from "_test_utilities/mockMongoId";
import ModelInfoAPISpecs from "api-specifications/modelInfo";
import LocaleAPISpecs from "api-specifications/locale";
import { getTestSkillGroupCode } from "_test_utilities/mockSkillGroupCode";

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

async function createSkillGroupInDB(modelId: string = getMockStringId(1)): Promise<ISkillGroup> {
  return await getRepositoryRegistry().skillGroup.create({
    modelId: modelId,
    code: getTestSkillGroupCode(100),
    description: getRandomString(SkillGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    altLabels: [getRandomString(SkillGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH)],
    originUri: `http://some/path/to/api/resources/${randomUUID()}`,
    UUIDHistory: [randomUUID()],
    scopeNote: getRandomString(SkillGroupAPISpecs.Constants.MAX_SCOPE_NOTE_LENGTH),
    preferredLabel: getRandomString(SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
  });
}

describe("Test for skillGroup children handler with a DB", () => {
  const ajv = new Ajv({
    validateSchema: true,
    strict: true,
    allErrors: true,
  });
  addFormats(ajv);
  ajv.addSchema(SkillGroupAPISpecs.SkillGroup.Children.GET.Schemas.Response.Children.Payload);
  const validateResponse: ValidateFunction = ajv.getSchema(
    SkillGroupAPISpecs.SkillGroup.Children.GET.Schemas.Response.Children.Payload.$id as string
  ) as ValidateFunction;

  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    const config = getTestConfiguration("SkillGroupChildrenHandlerTestDB");
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

  test("GET should respond with the OK status code and an empty children payload for an existing group with no children", async () => {
    const givenModelInfo = await createModelInDB();
    const givenSkillGroup = await createSkillGroupInDB(givenModelInfo.id.toString());

    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      headers: {
        "Content-Type": "application/json",
      },
      pathParameters: { modelId: givenModelInfo.id.toString(), id: givenSkillGroup.id.toString() },
      path: `/models/${givenModelInfo.id.toString()}/skillGroups/${givenSkillGroup.id.toString()}/children`,
    };

    // @ts-ignore
    const actualResponse = await skillGroupHandler(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    validateResponse(JSON.parse(actualResponse.body));
    expect(validateResponse.errors).toBeNull();
  });
});
