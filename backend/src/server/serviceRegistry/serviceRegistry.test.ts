// Suppress chatty console during the tests
import "_test_utilities/consoleMock";

import { getServiceRegistry, ServiceRegistry } from "./serviceRegistry";
import { OccupationService } from "esco/occupations/occupationService";
import { OccupationGroupService } from "esco/occupationGroup/occupationGroupService";
import { SkillGroupService } from "esco/skillGroup/skillGroupService";

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
    expect(serviceRegistry.skillGroup).toBeDefined();
    expect(serviceRegistry.skillGroup).toBeInstanceOf(SkillGroupService);
  });
});
