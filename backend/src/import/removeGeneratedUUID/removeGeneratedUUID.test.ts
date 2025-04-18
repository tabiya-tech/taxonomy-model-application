//mute chatty console
import "_test_utilities/consoleMock";

import { RemoveGeneratedUUID } from "./removeGeneratedUUID";
import { Connection } from "mongoose";
import { RepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getNewConnection } from "server/connection/newConnection";
import { IModelInfo, INewModelInfoSpec } from "modelInfo/modelInfo.types";
import { getTestString } from "_test_utilities/getMockRandomData";
import ModelInfoAPISpecs from "api-specifications/modelInfo";
import LocaleAPISpecs from "api-specifications/locale";
import { randomUUID } from "crypto";
import {
  getNewESCOOccupationSpec,
  getNewISCOGroupSpecs,
  getNewLocalGroupSpecs,
  getNewLocalOccupationSpec,
  getNewSkillGroupSpec,
  getNewSkillSpec,
} from "esco/_test_utilities/getNewSpecs";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { IOccupation } from "esco/occupations/occupation.types";
import { ISkill } from "esco/skill/skills.types";
import { IOccupationGroup } from "esco/occupationGroup/OccupationGroup.types";
import { ISkillGroup } from "esco/skillGroup/skillGroup.types";
import { generateRandomUUIDs } from "_test_utilities/generateRandomUUIDs";

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
    license: getTestString(ModelInfoAPISpecs.Constants.LICENSE_MAX_LENGTH),
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
      repositoryRegistry.OccupationGroup.Model,
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
      repositoryRegistry.OccupationGroup.Model.deleteMany({}),
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
    expect(actualOccupation.occupationGroupCode).toEqual(givenOccupation.occupationGroupCode);
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

  const checkOccupationGroupFieldsNotChanged = (
    givenOccupationGroup: IOccupationGroup,
    actualOccupationGroup: IOccupationGroup
  ) => {
    // check every field except UUID and UUIDHistory
    expect(actualOccupationGroup.modelId).toEqual(givenOccupationGroup.modelId);
    expect(actualOccupationGroup.id).toEqual(givenOccupationGroup.id);
    expect(actualOccupationGroup.code).toEqual(givenOccupationGroup.code);
    expect(actualOccupationGroup.originUri).toEqual(givenOccupationGroup.originUri);
    expect(actualOccupationGroup.preferredLabel).toEqual(givenOccupationGroup.preferredLabel);
    expect(actualOccupationGroup.altLabels).toEqual(givenOccupationGroup.altLabels);
    expect(actualOccupationGroup.description).toEqual(givenOccupationGroup.description);
    expect(actualOccupationGroup.parent).toEqual(givenOccupationGroup.parent);
    expect(actualOccupationGroup.children).toEqual(givenOccupationGroup.children);
    expect(actualOccupationGroup.createdAt).toEqual(givenOccupationGroup.createdAt);
    expect(actualOccupationGroup.updatedAt).toEqual(expect.any(Date)); // updatedAt is updated
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

  test("should not remove UUID from history for all entities with one UUID", async () => {
    // GIVEN a model with a single item in the UUIDHistory
    const givenNewModelInfoSpec: INewModelInfoSpec = getNewModelInfoSpec();
    givenNewModelInfoSpec.UUIDHistory = generateRandomUUIDs(1);
    const givenCreatedModel = await repositoryRegistry.modelInfo.create(givenNewModelInfoSpec); // the creation process adds a new UUID to the history
    // AND a new UUID is added to the history
    expect(givenCreatedModel.UUIDHistory).toHaveLength(2);
    // AND the new UUID is added on the top
    expect(givenCreatedModel.UUIDHistory[1]).toEqual(givenNewModelInfoSpec.UUIDHistory[0]);

    // AND an occupation is created with the modelId and a single item in the UUIDHistory
    const givenNewOccupationSpec = getNewESCOOccupationSpec();
    givenNewOccupationSpec.modelId = givenCreatedModel.id;
    givenNewOccupationSpec.UUIDHistory = generateRandomUUIDs(0);
    const givenCreatedOccupation = await repositoryRegistry.occupation.create(givenNewOccupationSpec);
    // AND a new UUID Item is added
    expect(givenCreatedOccupation.UUIDHistory).toHaveLength(1);

    // AND a local occupation is created with the modelId and a single item in the UUIDHistory
    const givenNewLocalOccupationSpec = getNewLocalOccupationSpec();
    givenNewLocalOccupationSpec.modelId = givenCreatedModel.id;
    givenNewLocalOccupationSpec.UUIDHistory = generateRandomUUIDs(0);
    const givenCreatedLocalOccupation = await repositoryRegistry.occupation.create(givenNewLocalOccupationSpec);
    // AND a new UUID Item is added
    expect(givenCreatedLocalOccupation.UUIDHistory).toHaveLength(1);

    // AND a skill is created with the modelId and a single item in the UUIDHistory
    const givenNewSkillSpec = getNewSkillSpec();
    givenNewSkillSpec.modelId = givenCreatedModel.id;
    givenNewSkillSpec.UUIDHistory = generateRandomUUIDs(0);
    const givenCreatedSkill = await repositoryRegistry.skill.create(givenNewSkillSpec);
    // AND a new UUID Item is added
    expect(givenCreatedSkill.UUIDHistory).toHaveLength(1);

    // AND a skill group is created with the modelId and a single item in the UUIDHistory
    const givenNewSkillGroupSpec = getNewSkillGroupSpec();
    givenNewSkillGroupSpec.modelId = givenCreatedModel.id;
    givenNewSkillGroupSpec.UUIDHistory = generateRandomUUIDs(0);
    const givenCreatedSkillGroup = await repositoryRegistry.skillGroup.create(givenNewSkillGroupSpec);
    // AND a new UUID Item is added
    expect(givenCreatedSkillGroup.UUIDHistory).toHaveLength(1);

    // AND an ISCO group is created with the modelId and a single item in the UUIDHistory
    const givenNewOccupationGroupSpec = getNewISCOGroupSpecs();
    givenNewOccupationGroupSpec.modelId = givenCreatedModel.id;
    givenNewOccupationGroupSpec.UUIDHistory = generateRandomUUIDs(0);
    const givenCreatedOccupationGroup = await repositoryRegistry.OccupationGroup.create(givenNewOccupationGroupSpec);

    // AND a Local group is created with the modelId and a single item in the UUIDHistory
    const givenNewLocalOccupationGroupSpec = getNewLocalGroupSpecs();
    givenNewLocalOccupationGroupSpec.modelId = givenCreatedModel.id;
    givenNewLocalOccupationGroupSpec.UUIDHistory = generateRandomUUIDs(0);
    const givenCreatedLocalOccupationGroup = await repositoryRegistry.OccupationGroup.create(
      givenNewLocalOccupationGroupSpec
    );
    // AND a new UUID Item is added
    expect(givenCreatedOccupationGroup.UUIDHistory).toHaveLength(1);

    // WHEN removeUUIDFromHistory method is called with the modelId
    await removeUUIDInstance.removeUUIDFromHistory(givenCreatedModel.id);

    // THEN expect all the entities to have the first UUID removed from the history
    let [actualOccupation, actualLocalOccupaiton, actualSkill, actualSkillGroup, actualOccupationGroup] =
      await Promise.all([
        repositoryRegistry.occupation.findById(givenCreatedOccupation.id),
        repositoryRegistry.occupation.findById(givenCreatedLocalOccupation.id),
        repositoryRegistry.skill.findById(givenCreatedSkill.id),
        repositoryRegistry.skillGroup.findById(givenCreatedSkillGroup.id),
        repositoryRegistry.OccupationGroup.findById(givenCreatedOccupationGroup.id),
        repositoryRegistry.OccupationGroup.findById(givenCreatedLocalOccupationGroup.id),
      ]);

    // AND expect all the entities to be truthy
    expect(actualOccupation).toBeTruthy();
    expect(actualLocalOccupaiton).toBeTruthy();
    expect(actualSkill).toBeTruthy();
    expect(actualSkillGroup).toBeTruthy();
    expect(actualOccupationGroup).toBeTruthy();

    actualOccupation = actualOccupation!;
    actualLocalOccupaiton = actualLocalOccupaiton!;
    actualSkill = actualSkill!;
    actualSkillGroup = actualSkillGroup!;
    actualOccupationGroup = actualOccupationGroup!;

    // AND expect all the entities to have the first UUID removed from the history
    expect(actualOccupation.UUIDHistory).toHaveLength(1);
    expect(actualLocalOccupaiton.UUIDHistory).toHaveLength(1);
    expect(actualSkill.UUIDHistory).toHaveLength(1);
    expect(actualSkillGroup.UUIDHistory).toHaveLength(1);
    expect(actualOccupationGroup.UUIDHistory).toHaveLength(1);

    // AND expect all the entities to have a UUID that matches the first item in the UUIDHistory
    expect(actualOccupation.UUID).toEqual(givenCreatedOccupation.UUIDHistory[0]);
    expect(actualLocalOccupaiton.UUID).toEqual(givenCreatedLocalOccupation.UUIDHistory[0]);
    expect(actualSkill.UUID).toEqual(givenCreatedSkill.UUIDHistory[0]);
    expect(actualSkillGroup.UUID).toEqual(givenCreatedSkillGroup.UUIDHistory[0]);
    expect(actualOccupationGroup.UUID).toEqual(givenCreatedOccupationGroup.UUIDHistory[0]);

    // AND expect that the other fields are not changed
    checkOccupationFieldsNotChanged(givenCreatedOccupation, actualOccupation);
    checkOccupationFieldsNotChanged(givenCreatedLocalOccupation, actualLocalOccupaiton);
    checkSkillFieldsNotChanged(givenCreatedSkill, actualSkill);
    checkOccupationGroupFieldsNotChanged(givenCreatedOccupationGroup, actualOccupationGroup);
    checkSkillGroupFieldsNotChanged(givenCreatedSkillGroup, actualSkillGroup);

    // AND expect the modelInfo to have the first UUID removed from the history
    const updatedModelInfo = await repositoryRegistry.modelInfo.getModelById(givenCreatedModel.id);
    expect(updatedModelInfo?.UUIDHistory).toHaveLength(1);

    // AND expect the modelInfo to have a UUID that matches the first item in the UUIDHistory
    expect(updatedModelInfo?.UUID).toEqual(updatedModelInfo?.UUIDHistory[0]);

    // AND expect that the other fields are not changed
    checkModelInfoFieldsNotChanged(givenCreatedModel, updatedModelInfo as IModelInfo);
  });

  test.each([1, 2, 3])(
    "should remove UUID from history for all entities matching modelId, given UUIDHistory has %i UUIDs",
    async (count: number) => {
      // GIVEN a model with a single item in the UUIDHistory
      const givenNewModelInfoSpec: INewModelInfoSpec = getNewModelInfoSpec();
      givenNewModelInfoSpec.UUIDHistory = generateRandomUUIDs(count);
      const givenCreatedModel = await repositoryRegistry.modelInfo.create(givenNewModelInfoSpec); // the creation process adds a new UUID to the history
      // AND UUIDHistory is increaased by 1 (1 new UUID is added)
      expect(givenCreatedModel.UUIDHistory).toHaveLength(count + 1);
      // AND the givenUUIDHistory is added on the bottom.
      expect([givenCreatedModel.UUID, ...givenNewModelInfoSpec.UUIDHistory]).toEqual(givenCreatedModel.UUIDHistory);

      // AND an occupation is created with the modelId and a single item in the UUIDHistory
      const givenNewOccupationSpec = getNewESCOOccupationSpec();
      givenNewOccupationSpec.modelId = givenCreatedModel.id;
      givenNewOccupationSpec.UUIDHistory = generateRandomUUIDs(count);
      const givenCreatedOccupation = await repositoryRegistry.occupation.create(givenNewOccupationSpec);
      // AND UUIDHistory is increaased by 1 (1 new UUID is added)
      expect(givenCreatedOccupation.UUIDHistory).toHaveLength(count + 1);
      // AND the givenUUIDHistory is added on the bottom.
      expect([givenCreatedOccupation.UUID, ...givenNewOccupationSpec.UUIDHistory]).toEqual(
        givenCreatedOccupation.UUIDHistory
      );

      // AND a local occupation is created with the modelId and a single item in the UUIDHistory
      const givenNewLocalOccupationSpec = getNewLocalOccupationSpec();
      givenNewLocalOccupationSpec.modelId = givenCreatedModel.id;
      givenNewLocalOccupationSpec.UUIDHistory = generateRandomUUIDs(count);
      const givenCreatedLocalOccupation = await repositoryRegistry.occupation.create(givenNewLocalOccupationSpec);
      // AND UUIDHistory is increaased by 1 (1 new UUID is added)
      expect(givenCreatedLocalOccupation.UUIDHistory).toHaveLength(count + 1);
      // AND the givenUUIDHistory is added on the bottom.
      expect([givenCreatedLocalOccupation.UUID, ...givenNewLocalOccupationSpec.UUIDHistory]).toEqual(
        givenCreatedLocalOccupation.UUIDHistory
      );

      // AND a skill is created with the modelId and a single item in the UUIDHistory
      const givenNewSkillSpec = getNewSkillSpec();
      givenNewSkillSpec.modelId = givenCreatedModel.id;
      givenNewSkillSpec.UUIDHistory = generateRandomUUIDs(count);
      const givenCreatedSkill = await repositoryRegistry.skill.create(givenNewSkillSpec);
      // AND UUIDHistory is increaased by 1 (1 new UUID is added)
      expect(givenCreatedSkill.UUIDHistory).toHaveLength(count + 1);
      // AND the givenUUIDHistory is added on the bottom.
      expect([givenCreatedSkill.UUID, ...givenNewSkillSpec.UUIDHistory]).toEqual(givenCreatedSkill.UUIDHistory);

      // AND a skill group is created with the modelId and a single item in the UUIDHistory
      const givenNewSkillGroupSpec = getNewSkillGroupSpec();
      givenNewSkillGroupSpec.modelId = givenCreatedModel.id;
      givenNewSkillGroupSpec.UUIDHistory = generateRandomUUIDs(count);
      const givenCreatedSkillGroup = await repositoryRegistry.skillGroup.create(givenNewSkillGroupSpec);
      // AND UUIDHistory is increaased by 1 (1 new UUID is added)
      expect(givenCreatedSkillGroup.UUIDHistory).toHaveLength(count + 1);
      // AND the givenUUIDHistory is added on the bottom.
      expect([givenCreatedSkillGroup.UUID, ...givenNewSkillGroupSpec.UUIDHistory]).toEqual(
        givenCreatedSkillGroup.UUIDHistory
      );

      // AND an ISCO group is created with the modelId and a single item in the UUIDHistory
      const givenNewOccupationGroupSpec = getNewISCOGroupSpecs();
      givenNewOccupationGroupSpec.modelId = givenCreatedModel.id;
      givenNewOccupationGroupSpec.UUIDHistory = generateRandomUUIDs(count);
      const givenCreatedOccupationGroup = await repositoryRegistry.OccupationGroup.create(givenNewOccupationGroupSpec);

      // AND a Local group is created with the modelId and a single item in the UUIDHistory
      const givenNewLocalOccupationGroupSpec = getNewLocalGroupSpecs();
      givenNewLocalOccupationGroupSpec.modelId = givenCreatedModel.id;
      givenNewLocalOccupationGroupSpec.UUIDHistory = generateRandomUUIDs(count);
      const givenCreatedLocalOccupationGroup = await repositoryRegistry.OccupationGroup.create(
        givenNewLocalOccupationGroupSpec
      );

      // AND UUIDHistory is increaased by 1 (1 new UUID is added)
      expect(givenCreatedOccupationGroup.UUIDHistory).toHaveLength(count + 1);
      // AND the givenUUIDHistory is added on the bottom.
      expect([givenCreatedOccupationGroup.UUID, ...givenNewOccupationGroupSpec.UUIDHistory]).toEqual(
        givenCreatedOccupationGroup.UUIDHistory
      );

      // WHEN removeUUIDFromHistory method is called with the modelId
      await removeUUIDInstance.removeUUIDFromHistory(givenCreatedModel.id);

      // THEN expect all the entities to have the first UUID removed from the history
      let [actualOccupation, actualLocalOccupaiton, actualSkill, actualSkillGroup, actualOccupationGroup] =
        await Promise.all([
          repositoryRegistry.occupation.findById(givenCreatedOccupation.id),
          repositoryRegistry.occupation.findById(givenCreatedLocalOccupation.id),
          repositoryRegistry.skill.findById(givenCreatedSkill.id),
          repositoryRegistry.skillGroup.findById(givenCreatedSkillGroup.id),
          repositoryRegistry.OccupationGroup.findById(givenCreatedOccupationGroup.id),
          repositoryRegistry.OccupationGroup.findById(givenCreatedLocalOccupationGroup.id),
        ]);

      // AND expect Occupation Entity to be truthy
      // AND UUIDHistory is decreased by 1 (1 UUID is removed)
      // AND the first UUID is removed
      // AND Nothing changed
      expect(actualOccupation).toBeTruthy();
      actualOccupation = actualOccupation!;
      expect(actualOccupation.UUIDHistory).toHaveLength(count);
      expect(actualOccupation.UUID).toEqual(givenNewOccupationSpec.UUIDHistory[0]);
      checkOccupationFieldsNotChanged(givenCreatedOccupation, actualOccupation);
      expect(actualOccupation.UUIDHistory).toEqual(givenNewOccupationSpec.UUIDHistory);

      // AND expect LocalOccupation Entity to be truthy
      // AND UUIDHistory is decreased by 1 (1 UUID is removed)
      // AND the first UUID is removed
      // AND Nothing changed
      expect(actualLocalOccupaiton).toBeTruthy();
      actualLocalOccupaiton = actualLocalOccupaiton!;
      expect(actualLocalOccupaiton.UUIDHistory).toHaveLength(count);
      expect(actualLocalOccupaiton.UUID).toEqual(givenNewLocalOccupationSpec.UUIDHistory[0]);
      checkOccupationFieldsNotChanged(givenCreatedLocalOccupation, actualLocalOccupaiton);
      expect(actualLocalOccupaiton.UUIDHistory).toEqual(givenNewLocalOccupationSpec.UUIDHistory);

      // AND expect Skill Entity to be truthy
      // AND UUIDHistory is decreased by 1 (1 UUID is removed)
      // AND the first UUID is removed
      // AND Nothing changed
      expect(actualSkill).toBeTruthy();
      actualSkill = actualSkill!;
      expect(actualSkill.UUIDHistory).toHaveLength(count);
      expect(actualSkill.UUID).toEqual(givenNewSkillSpec.UUIDHistory[0]);
      checkSkillFieldsNotChanged(givenCreatedSkill, actualSkill);
      expect(actualSkill.UUIDHistory).toEqual(givenNewSkillSpec.UUIDHistory);

      // AND expect SkillGroup Entity to be truthy
      // AND UUIDHistory is decreased by 1 (1 UUID is removed)
      // AND the first UUID is removed
      // AND Nothing changed
      expect(actualSkillGroup).toBeTruthy();
      actualSkillGroup = actualSkillGroup!;
      expect(actualSkillGroup.UUIDHistory).toHaveLength(count);
      expect(actualSkillGroup.UUID).toEqual(givenNewSkillGroupSpec.UUIDHistory[0]);
      checkSkillGroupFieldsNotChanged(givenCreatedSkillGroup, actualSkillGroup);
      expect(actualSkillGroup.UUIDHistory).toEqual(givenNewSkillGroupSpec.UUIDHistory);

      // AND expect OccupationGroup Entity to be truthy
      // AND UUIDHistory is decreased by 1 (1 UUID is removed)
      // AND the first UUID is removed
      // AND Nothing changed
      expect(actualOccupationGroup).toBeTruthy();
      actualOccupationGroup = actualOccupationGroup!;
      expect(actualOccupationGroup.UUIDHistory).toHaveLength(count);
      expect(actualOccupationGroup.UUID).toEqual(givenNewOccupationGroupSpec.UUIDHistory[0]);
      checkOccupationGroupFieldsNotChanged(givenCreatedOccupationGroup, actualOccupationGroup);
      expect(actualOccupationGroup.UUIDHistory).toEqual(givenNewOccupationGroupSpec.UUIDHistory);

      // AND expect the modelInfo to have the first UUID removed from the history
      const updatedModelInfo = await repositoryRegistry.modelInfo.getModelById(givenCreatedModel.id);
      expect(updatedModelInfo?.UUIDHistory).toHaveLength(count);

      // AND expect the modelInfo to have a UUID that matches the first item in the UUIDHistory
      expect(updatedModelInfo?.UUID).toEqual(updatedModelInfo?.UUIDHistory[0]);

      // AND expect that the other fields are not changed
      checkModelInfoFieldsNotChanged(givenCreatedModel, updatedModelInfo as IModelInfo);
    }
  );

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
    // AND an ISCO group is created with the modelId and a single item in the UUIDHistory
    const givenNewOccupationGroupSpec = getNewISCOGroupSpecs();
    givenNewOccupationGroupSpec.modelId = actualNewModel.id;
    givenNewOccupationGroupSpec.UUIDHistory = [randomUUID()];
    const actualNewOccupationGroup = await repositoryRegistry.OccupationGroup.create(givenNewOccupationGroupSpec);

    // AND a Local group is created with the modelId and a single item in the UUIDHistory
    const givenNewLocalOccupationGroupSpec = getNewLocalGroupSpecs();
    givenNewLocalOccupationGroupSpec.modelId = actualNewModel.id;
    givenNewLocalOccupationGroupSpec.UUIDHistory = [randomUUID()];
    const actualNewLocalOccupationGroup = await repositoryRegistry.OccupationGroup.create(
      givenNewLocalOccupationGroupSpec
    );

    // AND a different model exists in the database
    const givenNewModelInfoSpec2: INewModelInfoSpec = getNewModelInfoSpec();
    givenNewModelInfoSpec2.UUIDHistory = [randomUUID()];
    const actualNewModel2 = await repositoryRegistry.modelInfo.create(givenNewModelInfoSpec2);

    // WHEN removeUUIDFromHistory method is called with a different modelId
    await removeUUIDInstance.removeUUIDFromHistory(actualNewModel2.id);

    // THEN expect none of the entities to have the first UUID removed from the history
    const [updatedOccupation, updatedLocalOccupation, updatedSkill, updatedSkillGroup, updatedOccupationGroup] =
      await Promise.all([
        repositoryRegistry.occupation.findById(actualNewESCOOccupation.id),
        repositoryRegistry.occupation.findById(actualNewLocalOccupation.id),
        repositoryRegistry.skill.findById(actualNewSkill.id),
        repositoryRegistry.skillGroup.findById(actualNewSkillGroup.id),
        repositoryRegistry.OccupationGroup.findById(actualNewOccupationGroup.id),
        repositoryRegistry.OccupationGroup.findById(actualNewLocalOccupationGroup.id),
      ]);
    expect(updatedOccupation?.UUIDHistory).toHaveLength(2);
    expect(updatedLocalOccupation?.UUIDHistory).toHaveLength(2);
    expect(updatedSkill?.UUIDHistory).toHaveLength(2);
    expect(updatedSkillGroup?.UUIDHistory).toHaveLength(2);
    expect(updatedOccupationGroup?.UUIDHistory).toHaveLength(2);
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
