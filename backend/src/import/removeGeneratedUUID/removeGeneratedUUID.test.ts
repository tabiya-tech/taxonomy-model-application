//mute chatty console
import "_test_utilities/consoleMock";

import { RemoveGeneratedUUID } from "./removeGeneratedUUID";
import { Connection } from "mongoose";
import { RepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getNewConnection } from "server/connection/newConnection";
import {IModelInfo, INewModelInfoSpec} from "modelInfo/modelInfo.types";
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
import {IOccupation} from "esco/occupations/occupation.types";
import {ISkill} from "esco/skill/skills.types";
import {IISCOGroup} from "esco/iscoGroup/ISCOGroup.types";
import {ISkillGroup} from "esco/skillGroup/skillGroup.types";

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

  afterEach(async () => {
    jest.clearAllMocks();
    // clear the database entities
    await Promise.all([
      repositoryRegistry.occupation.Model.deleteMany({}),
      repositoryRegistry.skill.Model.deleteMany({}),
      repositoryRegistry.skillGroup.Model.deleteMany({}),
      repositoryRegistry.ISCOGroup.Model.deleteMany({}),
      repositoryRegistry.modelInfo.Model.deleteMany({}),
    ]);
  });

  test("an instance of RemoveGeneratedUUID should be created", () => {
    // SANITY CHECK
    expect(removeUUIDInstance).toBeInstanceOf(RemoveGeneratedUUID);
  });

  const checkOccupationFieldsNotChanged = (givenOccupation: IOccupation, actualOccupation: IOccupation) => {
   // check every field except UUID and UUIDHistory
    expect(actualOccupation.modelId).toEqual(givenOccupation.modelId);
    expect(actualOccupation.id).toEqual(givenOccupation.id);
    expect(actualOccupation.preferredLabel).toEqual(givenOccupation.preferredLabel);
    expect(actualOccupation.originUri).toEqual(givenOccupation.originUri);
    expect(actualOccupation.ISCOGroupCode).toEqual(givenOccupation.ISCOGroupCode);
    expect(actualOccupation.code).toEqual(givenOccupation.code);
    expect(actualOccupation.altLabels).toEqual(givenOccupation.altLabels);
    expect(actualOccupation.description).toEqual(givenOccupation.description);
    expect(actualOccupation.definition).toEqual(givenOccupation.definition);
    expect(actualOccupation.scopeNote).toEqual(givenOccupation.scopeNote);
    expect(actualOccupation.regulatedProfessionNote).toEqual(givenOccupation.regulatedProfessionNote);
    expect(actualOccupation.occupationType).toEqual(givenOccupation.occupationType);
    expect(actualOccupation.isLocalized).toEqual(givenOccupation.isLocalized);
    expect(actualOccupation.parent).toEqual(givenOccupation.parent);
    expect(actualOccupation.children).toEqual(givenOccupation.children);
    expect(actualOccupation.createdAt).toEqual(givenOccupation.createdAt);
    expect(actualOccupation.updatedAt).toEqual(expect.any(Date)); // updatedAt is updated
    expect(actualOccupation.requiresSkills).toEqual(givenOccupation.requiresSkills);
  };

  const checkSkillFieldsNotChanged = (givenSkill: ISkill, actualSkill: ISkill) => {
    // check every field except UUID and UUIDHistory
    expect(actualSkill.modelId).toEqual(givenSkill.modelId);
    expect(actualSkill.id).toEqual(givenSkill.id);
    expect(actualSkill.preferredLabel).toEqual(givenSkill.preferredLabel);
    expect(actualSkill.originUri).toEqual(givenSkill.originUri);
    expect(actualSkill.altLabels).toEqual(givenSkill.altLabels);
    expect(actualSkill.description).toEqual(givenSkill.description);
    expect(actualSkill.definition).toEqual(givenSkill.definition);
    expect(actualSkill.scopeNote).toEqual(givenSkill.scopeNote);
    expect(actualSkill.skillType).toEqual(givenSkill.skillType);
    expect(actualSkill.reuseLevel).toEqual(givenSkill.reuseLevel);
    expect(actualSkill.parents).toEqual(givenSkill.parents);
    expect(actualSkill.children).toEqual(givenSkill.children);
    expect(actualSkill.requiresSkills).toEqual(givenSkill.requiresSkills);
    expect(actualSkill.requiredBySkills).toEqual(givenSkill.requiredBySkills);
    expect(actualSkill.createdAt).toEqual(givenSkill.createdAt);
    expect(actualSkill.updatedAt).toEqual(expect.any(Date)); // updatedAt is updated
    expect(actualSkill.requiredByOccupations).toEqual(givenSkill.requiredByOccupations);
  };

  const checkISCOGroupFieldsNotChanged = (givenISCOGroup: IISCOGroup, actualISCOGroup: IISCOGroup) => {
    // check every field except UUID and UUIDHistory
    expect(actualISCOGroup.modelId).toEqual(givenISCOGroup.modelId);
    expect(actualISCOGroup.id).toEqual(givenISCOGroup.id);
    expect(actualISCOGroup.code).toEqual(givenISCOGroup.code);
    expect(actualISCOGroup.originUri).toEqual(givenISCOGroup.originUri);
    expect(actualISCOGroup.preferredLabel).toEqual(givenISCOGroup.preferredLabel);
    expect(actualISCOGroup.altLabels).toEqual(givenISCOGroup.altLabels);
    expect(actualISCOGroup.description).toEqual(givenISCOGroup.description);
    expect(actualISCOGroup.parent).toEqual(givenISCOGroup.parent);
    expect(actualISCOGroup.children).toEqual(givenISCOGroup.children);
    expect(actualISCOGroup.createdAt).toEqual(givenISCOGroup.createdAt);
    expect(actualISCOGroup.updatedAt).toEqual(expect.any(Date)); // updatedAt is updated
  };

  const checkSkillGroupFieldsNotChanged = (givenSkillGroup: ISkillGroup, actualSkillGroup: ISkillGroup) => {
    // check every field except UUID and UUIDHistory
    expect(actualSkillGroup.modelId).toEqual(givenSkillGroup.modelId);
    expect(actualSkillGroup.id).toEqual(givenSkillGroup.id);
    expect(actualSkillGroup.code).toEqual(givenSkillGroup.code);
    expect(actualSkillGroup.originUri).toEqual(givenSkillGroup.originUri);
    expect(actualSkillGroup.preferredLabel).toEqual(givenSkillGroup.preferredLabel);
    expect(actualSkillGroup.altLabels).toEqual(givenSkillGroup.altLabels);
    expect(actualSkillGroup.description).toEqual(givenSkillGroup.description);
    expect(actualSkillGroup.scopeNote).toEqual(givenSkillGroup.scopeNote);
    expect(actualSkillGroup.parents).toEqual(givenSkillGroup.parents);
    expect(actualSkillGroup.children).toEqual(givenSkillGroup.children);
    expect(actualSkillGroup.createdAt).toEqual(givenSkillGroup.createdAt);
    expect(actualSkillGroup.updatedAt).toEqual(expect.any(Date)); // updatedAt is updated
  };

  const checkModelInfoFieldsNotChanged = (givenModelInfo: IModelInfo, actualModelInfo: IModelInfo) => {
    // check every field except UUID and UUIDHistory
    expect(actualModelInfo.id).toEqual(givenModelInfo.id);
    expect(actualModelInfo.name).toEqual(givenModelInfo.name);
    expect(actualModelInfo.locale).toEqual(givenModelInfo.locale);
    expect(actualModelInfo.description).toEqual(givenModelInfo.description);
    expect(actualModelInfo.released).toEqual(givenModelInfo.released);
    expect(actualModelInfo.releaseNotes).toEqual(givenModelInfo.releaseNotes);
    expect(actualModelInfo.version).toEqual(givenModelInfo.version);
    expect(actualModelInfo.importProcessState).toEqual(givenModelInfo.importProcessState);
    expect(actualModelInfo.exportProcessState).toEqual(givenModelInfo.exportProcessState);
    expect(actualModelInfo.createdAt).toEqual(givenModelInfo.createdAt);
    expect(actualModelInfo.updatedAt).toEqual(expect.any(Date)); // updatedAt is updated
  };

  test("should remove UUID from history for all entities matching modelId", async () => {
    // GIVEN a model with a single item in the UUIDHistory
    const givenNewModelInfoSpec: INewModelInfoSpec = getNewModelInfoSpec();
    givenNewModelInfoSpec.UUIDHistory = [randomUUID()]; // the spec has a single item in the UUIDHistory
    const actualNewModel = await repositoryRegistry.modelInfo.create(givenNewModelInfoSpec); // the creation process adds a new UUID to the history

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
    // AND expect all the entities to have a UUID that matches the first item in the UUIDHistory
    expect(updatedOccupation?.UUID).toEqual(updatedOccupation?.UUIDHistory[0]);
    expect(updatedLocalOccupation?.UUID).toEqual(updatedLocalOccupation?.UUIDHistory[0]);
    expect(updatedSkill?.UUID).toEqual(updatedSkill?.UUIDHistory[0]);
    expect(updatedSkillGroup?.UUID).toEqual(updatedSkillGroup?.UUIDHistory[0]);
    expect(updatedISCOGroup?.UUID).toEqual(updatedISCOGroup?.UUIDHistory[0]);
    // AND expect that the other fields are not changed
    checkOccupationFieldsNotChanged(actualNewESCOOccupation, updatedOccupation as IOccupation);
    checkSkillFieldsNotChanged(actualNewSkill, updatedSkill as ISkill);
    checkISCOGroupFieldsNotChanged(actualNewISCOGroup, updatedISCOGroup as IISCOGroup);
    checkSkillGroupFieldsNotChanged(actualNewSkillGroup, updatedSkillGroup as ISkillGroup);
    // AND expect the modelInfo to have the first UUID removed from the history
    const updatedModelInfo = await repositoryRegistry.modelInfo.getModelById(actualNewModel.id);
    expect(updatedModelInfo?.UUIDHistory).toHaveLength(1);
    // AND expect the modelInfo to have a UUID that matches the first item in the UUIDHistory
    expect(updatedModelInfo?.UUID).toEqual(updatedModelInfo?.UUIDHistory[0]);
    // AND expect that the other fields are not changed
    checkModelInfoFieldsNotChanged(actualNewModel, updatedModelInfo as IModelInfo);
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