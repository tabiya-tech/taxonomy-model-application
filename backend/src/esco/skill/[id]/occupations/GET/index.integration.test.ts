import "_test_utilities/consoleMock";

import { randomUUID } from "node:crypto";
import { Connection } from "mongoose";

import SkillAPISpecs from "api-specifications/esco/skill";

import { getRandomString, getTestString } from "_test_utilities/getMockRandomData";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { handler as skillOccupationsHandler } from "./index";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { ISkill } from "../../../_shared/skill.types";
import { getMockStringId } from "_test_utilities/mockMongoId";
import ModelInfoAPISpecs from "api-specifications/modelInfo";
import LocaleAPISpecs from "api-specifications/locale";
import { ObjectTypes, SignallingValueLabel } from "esco/common/objectTypes";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { OccupationToSkillRelationType } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";
import OccupationAPISpecs from "api-specifications/esco/occupation";

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

async function createOccupationInDB(modelId: string = getMockStringId(1)) {
  return await getRepositoryRegistry().occupation.create({
    modelId: modelId,
    preferredLabel: getRandomString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    description: getRandomString(OccupationAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    altLabels: [getRandomString(OccupationAPISpecs.Constants.ALT_LABEL_MAX_LENGTH)],
    originUri: `http://some/path/to/api/resources/${randomUUID()}`,
    UUIDHistory: [randomUUID()],
    code: "1234." + Math.floor(Math.random() * 100),
    occupationGroupCode: "1234",
    occupationType: ObjectTypes.ESCOOccupation,
    isLocalized: true,
    definition: getRandomString(OccupationAPISpecs.Constants.DEFINITION_MAX_LENGTH),
    scopeNote: getRandomString(OccupationAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH),
    regulatedProfessionNote: getRandomString(OccupationAPISpecs.Constants.REGULATED_PROFESSION_NOTE_MAX_LENGTH),
  });
}

describe("Test for skill occupations GET handler with a DB", () => {
  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    const config = getTestConfiguration("SkillOccupationsHandlerTestDB");
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
      await dbConnection.models.OccupationModel.deleteMany({});
      await dbConnection.models[MongooseModelName.OccupationToSkillRelation].deleteMany({});
      await dbConnection.models.ModelInfo.deleteMany({});
    }
  });
  test("GET /models/{modelId}/skills/{id}/occupations should return related occupations", async () => {
    const givenModel = await createModelInDB();
    const modelId = givenModel.id.toString();
    const givenSubject = await createSkillInDB(modelId);
    const givenOccupation = await createOccupationInDB(modelId);

    const createdRelations = await getRepositoryRegistry().occupationToSkillRelation.createMany(modelId, [
      {
        requiringOccupationId: givenOccupation.id,
        requiringOccupationType: ObjectTypes.ESCOOccupation,
        requiredSkillId: givenSubject.id,
        relationType: OccupationToSkillRelationType.ESSENTIAL,
        signallingValue: null,
        signallingValueLabel: SignallingValueLabel.NONE,
      },
    ]);
    expect(createdRelations).toHaveLength(1);

    const event = {
      httpMethod: HTTP_VERBS.GET,
      path: `/models/${modelId}/skills/${givenSubject.id}/occupations`,
      pathParameters: {
        modelId: modelId,
        id: givenSubject.id,
      },
    };
    // @ts-ignore
    const response = await skillOccupationsHandler(event);

    expect(response.statusCode).toEqual(StatusCodes.OK);
    const body = JSON.parse(response.body);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toEqual(givenOccupation.id);
    expect(body.data[0].relationType).toEqual("essential");
  });
});
