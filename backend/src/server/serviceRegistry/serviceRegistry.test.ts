// Suppress chatty console during the tests
import "_test_utilities/consoleMock";

import { SQSClient } from "@aws-sdk/client-sqs";
import { getEmbeddingsQueueRegion } from "server/config/config";
import { getServiceRegistry, ServiceRegistry } from "./serviceRegistry";
import { SkillService } from "esco/skill/services/skill.service";
import { OccupationService } from "esco/occupations/services/occupation.service";
import { OccupationGroupService } from "esco/occupationGroup/services/occupationGroup.service";
import { SkillGroupService } from "esco/skillGroup/services/skillGroup.service";
import { OccupationHierarchyService } from "esco/occupationHierarchy/occupationHierarchy.service";
import { OccupationToSkillRelationService } from "esco/occupationToSkillRelation/occupationToSkillRelation.service";
import { SkillHierarchyService } from "esco/skillHierarchy/skillHierarchy.service";
import { SkillToSkillRelationService } from "esco/skillToSkillRelation/skillToSkillRelation.service";
import { EmbeddingProcessService } from "embeddings/embeddingProcess/embeddingProcess.service";

jest.mock("@aws-sdk/client-sqs", () => ({
  SQSClient: jest.fn(),
}));

jest.mock("server/config/config", () => ({
  ...jest.requireActual("server/config/config"),
  getEmbeddingsQueueRegion: jest.fn(),
}));

describe("test the ServiceRegistry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return a singleton ServiceRegistry", () => {
    // WHEN trying to get the ServiceRegistry
    const serviceRegistry = getServiceRegistry();

    // THEN the ServiceRegistry should be returned
    expect(serviceRegistry).toBeInstanceOf(ServiceRegistry);

    // AND the ServiceRegistry should be a singleton
    const serviceRegistry2 = getServiceRegistry();
    expect(serviceRegistry).toEqual(serviceRegistry2);
  });

  test("should initialize and set services successfully", async () => {
    // GIVEN the embeddings queue region is configured
    const givenEmbeddingsQueueRegion = "eu-west-1";
    (getEmbeddingsQueueRegion as jest.Mock).mockReturnValue(givenEmbeddingsQueueRegion);

    // WHEN trying to initialize the ServiceRegistry
    const serviceRegistry = new ServiceRegistry();
    await serviceRegistry.initialize();

    // THEN the SQSClient should be constructed with the configured region
    expect(SQSClient).toHaveBeenCalledWith({ region: givenEmbeddingsQueueRegion });

    // THEN the services should be initialized
    expect(serviceRegistry.occupation).toBeDefined();
    expect(serviceRegistry.occupation).toBeInstanceOf(OccupationService);
    expect(serviceRegistry.occupationGroup).toBeDefined();
    expect(serviceRegistry.occupationGroup).toBeInstanceOf(OccupationGroupService);
    expect(serviceRegistry.skill).toBeDefined();
    expect(serviceRegistry.skill).toBeInstanceOf(SkillService);
    expect(serviceRegistry.skillGroup).toBeDefined();
    expect(serviceRegistry.skillGroup).toBeInstanceOf(SkillGroupService);
    expect(serviceRegistry.occupationHierarchy).toBeDefined();
    expect(serviceRegistry.occupationHierarchy).toBeInstanceOf(OccupationHierarchyService);
    expect(serviceRegistry.occupationToSkillRelation).toBeDefined();
    expect(serviceRegistry.occupationToSkillRelation).toBeInstanceOf(OccupationToSkillRelationService);
    expect(serviceRegistry.skillHierarchy).toBeDefined();
    expect(serviceRegistry.skillHierarchy).toBeInstanceOf(SkillHierarchyService);
    expect(serviceRegistry.skillToSkillRelation).toBeDefined();
    expect(serviceRegistry.skillToSkillRelation).toBeInstanceOf(SkillToSkillRelationService);
    expect(serviceRegistry.embeddingProcess).toBeDefined();
    expect(serviceRegistry.embeddingProcess).toBeInstanceOf(EmbeddingProcessService);
  });
});
