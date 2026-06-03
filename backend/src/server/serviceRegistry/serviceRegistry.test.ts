// Suppress chatty console during the tests
import "_test_utilities/consoleMock";

import { getServiceRegistry, ServiceRegistry } from "./serviceRegistry";
import { SkillService } from "esco/skill/services/skill.service";
import { OccupationService } from "esco/occupations/services/occupation.service";
import { OccupationGroupService } from "esco/occupationGroup/services/occupationGroup.service";
import { SkillGroupService } from "esco/skillGroup/services/skillGroup.service";
import { OccupationHierarchyService } from "esco/occupationHierarchy/occupationHierarchy.service";
import { OccupationToSkillRelationService } from "esco/occupationToSkillRelation/occupationToSkillRelation.service";

describe("test the ServiceRegistry", () => {
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
    // WHEN trying to initialize the ServiceRegistry
    const serviceRegistry = new ServiceRegistry();
    await serviceRegistry.initialize();

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
  });
});
