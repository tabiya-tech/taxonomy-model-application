import "_test_utilities/consoleMock";

import { randomUUID } from "node:crypto";
import { Connection } from "mongoose";

import SkillAPISpecs from "api-specifications/esco/skill";

import { getRandomString, getTestString } from "_test_utilities/getMockRandomData";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { handler as skillParentsHandler } from "./index";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { ISkill } from "../../../_shared/skill.types";
import { getMockStringId } from "_test_utilities/mockMongoId";
import ModelInfoAPISpecs from "api-specifications/modelInfo";
import LocaleAPISpecs from "api-specifications/locale";
import { ObjectTypes } from "esco/common/objectTypes";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import SkillGroupAPISpecs from "api-specifications/esco/skillGroup";

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
    preferredLabel: getRandomString(SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    description: getRandomString(SkillAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    altLabels: [getRandomString(SkillAPISpecs.Constants.ALT_LABEL_MAX_LENGTH)],
    originUri: `http://some/path/to/api/resources/${randomUUID()}`,
    UUIDHistory: [randomUUID()],
    scopeNote: getRandomString(SkillAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH),
    definition: getRandomString(SkillAPISpecs.Constants.DEFINITION_MAX_LENGTH),
    skillType: SkillAPISpecs.Enums.SkillType.Knowledge,
    reuseLevel: SkillAPISpecs.Enums.ReuseLevel.CrossSector,
    isLocalized: true,
  });
}

async function createSkillGroupInDB(modelId: string = getMockStringId(1)) {
  return await getRepositoryRegistry().skillGroup.create({
    modelId: modelId,
    preferredLabel: getRandomString(SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    description: getRandomString(SkillGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    altLabels: [getRandomString(SkillGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH)],
    originUri: `http://some/path/to/api/resources/${randomUUID()}`,
    UUIDHistory: [randomUUID()],
    scopeNote: getRandomString(SkillGroupAPISpecs.Constants.MAX_SCOPE_NOTE_LENGTH),
    code: "S" + Math.floor(Math.random() * 100),
  });
}

describe("Test for skill parents GET handler with a DB", () => {
  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    const config = getTestConfiguration("SkillParentsHandlerTestDB");
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
      await dbConnection.models.SkillGroupModel.deleteMany({});
      await dbConnection.models[MongooseModelName.SkillHierarchy].deleteMany({});
      await dbConnection.models.ModelInfo.deleteMany({});
    }
  });
  test("GET /models/{modelId}/skills/{id}/parents should return parents", async () => {
    const givenModel = await createModelInDB();
    const modelId = givenModel.id.toString();
    const givenSubject = await createSkillInDB(modelId);
    const givenParentSkill = await createSkillInDB(modelId);
    const givenParentGroup = await createSkillGroupInDB(modelId);

    await getRepositoryRegistry().skillHierarchy.createMany(modelId, [
      {
        parentType: ObjectTypes.Skill,
        parentId: givenParentSkill.id,
        childType: ObjectTypes.Skill,
        childId: givenSubject.id,
      },
      {
        parentType: ObjectTypes.SkillGroup,
        parentId: givenParentGroup.id,
        childType: ObjectTypes.Skill,
        childId: givenSubject.id,
      },
    ]);

    const event = {
      httpMethod: HTTP_VERBS.GET,
      path: `/models/${modelId}/skills/${givenSubject.id}/parents`,
      pathParameters: {
        modelId: modelId,
        id: givenSubject.id,
      },
    };
    // @ts-ignore
    const response = await skillParentsHandler(event);

    expect(response.statusCode).toEqual(StatusCodes.OK);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("data");
    expect(body).toHaveProperty("limit");
    expect(body).toHaveProperty("nextCursor");
    expect(body.data).toHaveLength(2);
    const parentIds = body.data.map((p: { id: string }) => p.id);
    expect(parentIds).toContain(givenParentSkill.id);
    expect(parentIds).toContain(givenParentGroup.id);
  });
});
