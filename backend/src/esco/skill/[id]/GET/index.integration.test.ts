import "_test_utilities/consoleMock";

import { randomUUID } from "node:crypto";
import { Connection } from "mongoose";

import SkillAPISpecs from "api-specifications/esco/skill";
import LanguageAPISpecs from "api-specifications/language";

import { getRandomString, getTestString } from "_test_utilities/getMockRandomData";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { handler as skillDetailHandler } from "./index";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { ISkill } from "../../_shared/skill.types";
import { getMockStringId } from "_test_utilities/mockMongoId";
import ModelInfoAPISpecs from "api-specifications/modelInfo";
import LocaleAPISpecs from "api-specifications/locale";
import { getFallbackLanguageConfig } from "common/language/fallbackLanguage";

const fallbackDbKeyName = getFallbackLanguageConfig().dbKeyName;
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

async function createSkillInDB(modelId: string = getMockStringId(1)): Promise<ISkill> {
  return await getRepositoryRegistry().skill.create({
    modelId: modelId,
    preferredLabel: { [fallbackDbKeyName]: getRandomString(SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH) },
    description: { [fallbackDbKeyName]: getRandomString(SkillAPISpecs.Constants.DESCRIPTION_MAX_LENGTH) },
    altLabels: [{ [fallbackDbKeyName]: getRandomString(SkillAPISpecs.Constants.ALT_LABEL_MAX_LENGTH) }],
    originUri: `http://some/path/to/api/resources/${randomUUID()}`,
    UUIDHistory: [randomUUID()],
    scopeNote: { [fallbackDbKeyName]: getRandomString(SkillAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH) },
    definition: { [fallbackDbKeyName]: getRandomString(SkillAPISpecs.Constants.DEFINITION_MAX_LENGTH) },
    skillType: SkillAPISpecs.Enums.SkillType.Knowledge,
    reuseLevel: SkillAPISpecs.Enums.ReuseLevel.CrossSector,
    isLocalized: true,
  });
}

async function createSkillsInDB(count: number, modelId: string = getMockStringId(1)): Promise<ISkill[]> {
  const skills: ISkill[] = [];
  for (let i = 0; i < count; i++) {
    skills.push(await createSkillInDB(modelId));
  }
  return skills;
}

describe("Test for skill detail GET handler with a DB", () => {
  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    const config = getTestConfiguration("SkillDetailGETHandlerTestDB");
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
  test("GET should set Content-Language and Vary response headers", async () => {
    const givenModelInfo = await createModelInDB();
    const givenSkill = await createSkillInDB(givenModelInfo.id.toString());
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      headers: {},
      pathParameters: { modelId: givenModelInfo.id.toString(), id: givenSkill.id.toString() },
      path: `/models/${givenModelInfo.id.toString()}/skills/${givenSkill.id.toString()}`,
    };
    // @ts-ignore
    const actualResponse = await skillDetailHandler(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    expect(actualResponse.headers?.["Content-Language"]).toEqual(
      LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.shortCode
    );
    expect(actualResponse.headers?.["Vary"]).toEqual("Accept-Language");
  });

  test("GET should respond with a single skill when asked for one", async () => {
    const givenModelInfo = await createModelInDB();

    const skills = await createSkillsInDB(3, givenModelInfo.id.toString());
    expect(skills.length).toBeGreaterThan(0);
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      headers: {
        "Content-Type": "application/json",
      },
      pathParameters: { modelId: givenModelInfo.id.toString(), id: skills[1].id.toString() },
      path: `/models/${givenModelInfo.id.toString()}/skills/${skills[1].id.toString()}`,
    };
    // @ts-ignore
    const actualResponse = await skillDetailHandler(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);

    const responseBody = JSON.parse(actualResponse.body);
    expect(responseBody.id).toEqual(skills[1].id);
    expect(responseBody.UUID).toEqual(skills[1].UUID);
  });
});
