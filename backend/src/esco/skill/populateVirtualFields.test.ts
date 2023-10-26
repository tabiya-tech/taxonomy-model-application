// mute the console output
import "_test_utilities/consoleMock";

import {
  populateChildren,
  populateParents,
  populateRequiredBySkills,
  populateRequiresSkills,
} from "./populateVirtualFields";
import { Connection } from "mongoose";
import { ISkillRepository } from "esco/skill/skillRepository";
import { RepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getNewConnection } from "server/connection/newConnection";
import { getNewSkillSpec } from "esco/_test_utilities/getNewSpecs";

jest.mock("esco/skill/skillReference", () => ({
  getSkillReferenceWithModelId: jest.fn(),
  getSkillReferenceWithRelationType: jest.fn(),
}));
jest.mock("esco/skillGroup/skillGroupReference", () => ({
  getSkillGroupReferenceWithModelId: jest.fn(),
}));

describe("populate functions", () => {
  let dbConnection: Connection;
  let repository: ISkillRepository;
  let repositoryRegistry: RepositoryRegistry;
  beforeAll(async () => {
    // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("PopulateVirtualFieldsTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    repositoryRegistry = new RepositoryRegistry();
    await repositoryRegistry.initialize(dbConnection);
    repository = repositoryRegistry.skill;
  });

  afterAll(async () => {
    if (dbConnection) {
      await dbConnection.dropDatabase();
      await dbConnection.close(false);
    }
  });

  test("should call populate with the correct arguments for parents", async () => {
    // GIVEN a skill
    const givenSkillSpecs = getNewSkillSpec();
    const givenSkill = await repository.create(givenSkillSpecs);

    const Skill = repository.Model;
    jest.spyOn(Skill, "populate");

    //WHEN calling populateParents
    const skillMongooseDocument = await Skill.findById(givenSkill.id);
    await populateParents(skillMongooseDocument);

    expect(Skill.populate).toHaveBeenCalledWith(
      expect.objectContaining({
        parents: [],
      }),
      expect.anything()
    );
  });

  test("should call populate with the correct arguments for children", async () => {
    // GIVEN a skill
    const givenSkillSpecs = getNewSkillSpec();
    const givenSkill = await repository.create(givenSkillSpecs);

    const Skill = repository.Model;
    jest.spyOn(Skill, "populate");

    // WHEN calling populateChildren
    const skillMongooseDocument = await Skill.findById(givenSkill.id);
    await populateChildren(skillMongooseDocument);

    expect(Skill.populate).toHaveBeenCalledWith(
      expect.objectContaining({
        children: [],
      }),
      expect.anything()
    );
  });

  test("should call populate with the correct arguments for requiresSkills", async () => {
    // GIVEN a skill
    const givenSkillSpecs = getNewSkillSpec();
    const givenSkill = await repository.create(givenSkillSpecs);

    const Skill = repository.Model;
    jest.spyOn(Skill, "populate");

    // WHEN calling populateRequiresSkills
    const skillMongooseDocument = await Skill.findById(givenSkill.id);
    await populateRequiresSkills(skillMongooseDocument);

    expect(Skill.populate).toHaveBeenCalledWith(
      expect.objectContaining({
        requiresSkills: [],
      }),
      expect.anything()
    );
  });

  test("should call populate with the correct arguments for requiredBySkills", async () => {
    // GIVEN a skill
    const givenSkillSpecs = getNewSkillSpec();
    const givenSkill = await repository.create(givenSkillSpecs);

    const Skill = repository.Model;
    jest.spyOn(Skill, "populate");

    // WHEN calling populateRequiredBySkills
    const skillMongooseDocument = await Skill.findById(givenSkill.id);
    await populateRequiredBySkills(skillMongooseDocument);

    expect(Skill.populate).toHaveBeenCalledWith(
      expect.objectContaining({
        requiredBySkills: [],
      }),
      expect.anything()
    );
  });
});
