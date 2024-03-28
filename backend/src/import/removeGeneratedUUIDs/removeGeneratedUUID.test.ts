//mute chatty console
import "_test_utilities/consoleMock";

import { RemoveGeneratedUUID } from "./removeGeneratedUUID";
import { Connection } from "mongoose";
import { RepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getNewConnection } from "server/connection/newConnection";
import { INewModelInfoSpec } from "modelInfo/modelInfo.types";
import { getTestString } from "_test_utilities/specialCharacters";
import ModelInfoAPISpecs from "api-specifications/modelInfo";
import LocaleAPISpecs from "api-specifications/locale";
import { randomUUID } from "crypto";
import {
  getNewESCOOccupationSpec,
  getNewISCOGroupSpec,
  getNewLocalOccupationSpec,
  getNewSkillGroupSpec,
  getNewSkillSpec,
} from "esco/_test_utilities/getNewSpecs";
import { getMockStringId } from "_test_utilities/mockMongoId";

/**
 * Helper function to create an INewModelInfoSpec with random values
 */
function getNewModelInfoSpec(): INewModelInfoSpec {
  return {
    name: getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
    UUIDHistory: [randomUUID()],
    locale: {
      UUID: randomUUID(),
      name: getTestString(LocaleAPISpecs.Constants.NAME_MAX_LENGTH),
      shortCode: getTestString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
    },
    description: getTestString(ModelInfoAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
  };
}

describe("RemoveGeneratedUUID", () => {
  let removeUUIDInstance: RemoveGeneratedUUID;

  let dbConnection: Connection;
  const repositoryRegistry = new RepositoryRegistry();

  beforeAll(async () => {
    // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("RemoveGeneratedUUIDsTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    await repositoryRegistry.initialize(dbConnection);
  });

  afterAll(async () => {
    if (dbConnection) {
      await dbConnection.dropDatabase();
      await dbConnection.close(false); // do not force close as there might be pending mongo operations
    }
  });

  beforeEach(() => {
    // Create an instance of RemoveGeneratedUUID class
    // You can mock the mongoose models as needed for testing
    removeUUIDInstance = new RemoveGeneratedUUID(
      repositoryRegistry.occupation.Model,
      repositoryRegistry.skill.Model,
      repositoryRegistry.skillGroup.Model,
      repositoryRegistry.ISCOGroup.Model,
      repositoryRegistry.modelInfo.Model
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("an instance of RemoveGeneratedUUID should be created", () => {
    // SANITY CHECK
    expect(removeUUIDInstance).toBeInstanceOf(RemoveGeneratedUUID);
  });

  test("should remove UUID from history for all entities matching modelId", async () => {
    // GIVEN a model with a single item in the UUIDHistory
    const givenNewModelInfoSpec: INewModelInfoSpec = getNewModelInfoSpec();
    givenNewModelInfoSpec.UUIDHistory = [randomUUID()];
    const actualNewModel = await repositoryRegistry.modelInfo.create(givenNewModelInfoSpec);

    // AND an occupation is created with the modelId and a single item in the UUIDHistory
    const givenNewOccupationSpec = getNewESCOOccupationSpec();
    givenNewOccupationSpec.modelId = actualNewModel.id;
    givenNewOccupationSpec.UUIDHistory = [randomUUID()];
    const actualNewESCOOccupation = await repositoryRegistry.occupation.create(givenNewOccupationSpec);
    // AND a local occupation is created with the modelId and a single item in the UUIDHistory
    const givenNewLocalOccupationSpec = getNewLocalOccupationSpec();
    givenNewLocalOccupationSpec.modelId = actualNewModel.id;
    givenNewLocalOccupationSpec.UUIDHistory = [randomUUID()];
    const actualNewLocalOccupation = await repositoryRegistry.occupation.create(givenNewLocalOccupationSpec);
    // AND a skill is created with the modelId and a single item in the UUIDHistory
    const givenNewSkillSpec = getNewSkillSpec();
    givenNewSkillSpec.modelId = actualNewModel.id;
    givenNewSkillSpec.UUIDHistory = [randomUUID()];
    const actualNewSkill = await repositoryRegistry.skill.create(givenNewSkillSpec);
    // AND a skill group is created with the modelId and a single item in the UUIDHistory
    const givenNewSkillGroupSpec = getNewSkillGroupSpec();
    givenNewSkillGroupSpec.modelId = actualNewModel.id;
    givenNewSkillGroupSpec.UUIDHistory = [randomUUID()];
    const actualNewSkillGroup = await repositoryRegistry.skillGroup.create(givenNewSkillGroupSpec);
    // AND an isco group is created with the modelId and a single item in the UUIDHistory
    const givenNewISCOGroupSpec = getNewISCOGroupSpec();
    givenNewISCOGroupSpec.modelId = actualNewModel.id;
    givenNewISCOGroupSpec.UUIDHistory = [randomUUID()];
    const actualNewISCOGroup = await repositoryRegistry.ISCOGroup.create(givenNewISCOGroupSpec);

    // WHEN removeUUIDFromHistory method is called with the modelId
    await removeUUIDInstance.removeUUIDFromHistory(actualNewModel.id);

    // THEN expect all of the entities to have the first UUID removed from the history
    const [updatedOccupation, updatedLocalOccupation, updatedSkill, updatedSkillGroup, updatedISCOGroup] =
      await Promise.all([
        repositoryRegistry.occupation.findById(actualNewESCOOccupation.id),
        repositoryRegistry.occupation.findById(actualNewLocalOccupation.id),
        repositoryRegistry.skill.findById(actualNewSkill.id),
        repositoryRegistry.skillGroup.findById(actualNewSkillGroup.id),
        repositoryRegistry.ISCOGroup.findById(actualNewISCOGroup.id),
      ]);
    expect(updatedOccupation?.UUIDHistory).toHaveLength(1);
    expect(updatedLocalOccupation?.UUIDHistory).toHaveLength(1);
    expect(updatedSkill?.UUIDHistory).toHaveLength(1);
    expect(updatedSkillGroup?.UUIDHistory).toHaveLength(1);
    expect(updatedISCOGroup?.UUIDHistory).toHaveLength(1);
    // AND expect the modelInfo to have the first UUID removed from the history
    const updatedModelInfo = await repositoryRegistry.modelInfo.getModelById(actualNewModel.id);
    expect(updatedModelInfo?.UUIDHistory).toHaveLength(1);
  });

  test("should not remove UUID from history for entities not matching modelId", async () => {
    // GIVEN a model with a single item in the UUIDHistory
    const givenNewModelInfoSpec: INewModelInfoSpec = getNewModelInfoSpec();
    givenNewModelInfoSpec.UUIDHistory = [randomUUID()];
    const actualNewModel = await repositoryRegistry.modelInfo.create(givenNewModelInfoSpec);

    // AND an occupation is created with the modelId and a single item in the UUIDHistory
    const givenNewOccupationSpec = getNewESCOOccupationSpec();
    givenNewOccupationSpec.modelId = actualNewModel.id;
    givenNewOccupationSpec.UUIDHistory = [randomUUID()];
    const actualNewESCOOccupation = await repositoryRegistry.occupation.create(givenNewOccupationSpec);
    // AND a local occupation is created with the modelId and a single item in the UUIDHistory
    const givenNewLocalOccupationSpec = getNewLocalOccupationSpec();
    givenNewLocalOccupationSpec.modelId = actualNewModel.id;
    givenNewLocalOccupationSpec.UUIDHistory = [randomUUID()];
    const actualNewLocalOccupation = await repositoryRegistry.occupation.create(givenNewLocalOccupationSpec);
    // AND a skill is created with the modelId and a single item in the UUIDHistory
    const givenNewSkillSpec = getNewSkillSpec();
    givenNewSkillSpec.modelId = actualNewModel.id;
    givenNewSkillSpec.UUIDHistory = [randomUUID()];
    const actualNewSkill = await repositoryRegistry.skill.create(givenNewSkillSpec);
    // AND a skill group is created with the modelId and a single item in the UUIDHistory
    const givenNewSkillGroupSpec = getNewSkillGroupSpec();
    givenNewSkillGroupSpec.modelId = actualNewModel.id;
    givenNewSkillGroupSpec.UUIDHistory = [randomUUID()];
    const actualNewSkillGroup = await repositoryRegistry.skillGroup.create(givenNewSkillGroupSpec);
    // AND an isco group is created with the modelId and a single item in the UUIDHistory
    const givenNewISCOGroupSpec = getNewISCOGroupSpec();
    givenNewISCOGroupSpec.modelId = actualNewModel.id;
    givenNewISCOGroupSpec.UUIDHistory = [randomUUID()];
    const actualNewISCOGroup = await repositoryRegistry.ISCOGroup.create(givenNewISCOGroupSpec);

    // AND a different model exists in the database
    const givenNewModelInfoSpec2: INewModelInfoSpec = getNewModelInfoSpec();
    givenNewModelInfoSpec2.UUIDHistory = [randomUUID()];
    const actualNewModel2 = await repositoryRegistry.modelInfo.create(givenNewModelInfoSpec2);

    // WHEN removeUUIDFromHistory method is called with a different modelId
    await removeUUIDInstance.removeUUIDFromHistory(actualNewModel2.id);

    // THEN expect none of the entities to have the first UUID removed from the history
    const [updatedOccupation, updatedLocalOccupation, updatedSkill, updatedSkillGroup, updatedISCOGroup] =
      await Promise.all([
        repositoryRegistry.occupation.findById(actualNewESCOOccupation.id),
        repositoryRegistry.occupation.findById(actualNewLocalOccupation.id),
        repositoryRegistry.skill.findById(actualNewSkill.id),
        repositoryRegistry.skillGroup.findById(actualNewSkillGroup.id),
        repositoryRegistry.ISCOGroup.findById(actualNewISCOGroup.id),
      ]);
    expect(updatedOccupation?.UUIDHistory).toHaveLength(2);
    expect(updatedLocalOccupation?.UUIDHistory).toHaveLength(2);
    expect(updatedSkill?.UUIDHistory).toHaveLength(2);
    expect(updatedSkillGroup?.UUIDHistory).toHaveLength(2);
    expect(updatedISCOGroup?.UUIDHistory).toHaveLength(2);
    // AND expect the modelInfo to have the first UUID removed from the history
    const updatedModelInfo = await repositoryRegistry.modelInfo.getModelById(actualNewModel.id);
    expect(updatedModelInfo?.UUIDHistory).toHaveLength(2);
  });

  test("should throw an error when the model is not found", async () => {
    // WHEN removeUUIDFromHistory method is called with a modelId that does not exist
    const givenModelId = getMockStringId(1);
    // THEN expect the method to not throw an error
    await expect(removeUUIDInstance.removeUUIDFromHistory(givenModelId)).rejects.toThrow();
    // AND expect an error to be logged
    expect(console.error).toHaveBeenCalledWith(
      expect.toMatchErrorWithCause("Error occurred during cleanup:", "Model not found")
    );
  });

  test("should throw an error when the modelId is not a valid objectId", async () => {
    // WHEN removeUUIDFromHistory method is called with an invalid modelId
    const givenModelId = "invalidObjectId";
    // THEN expect the method to throw an error
    await expect(removeUUIDInstance.removeUUIDFromHistory(givenModelId)).rejects.toThrow();
  });
});
