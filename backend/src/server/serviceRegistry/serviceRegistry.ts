import { IOccupationGroupService } from "esco/occupationGroup/occupationGroupService.type";
import { getRepositoryRegistry } from "../repositoryRegistry/repositoryRegistry";
import { OccupationService } from "esco/occupations/occupationService";
import { IOccupationService } from "esco/occupations/occupationService.types";
import { OccupationGroupService } from "esco/occupationGroup/occupationGroupService";

export class ServiceRegistry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly _services: Map<string, any> = new Map<string, any>();

  public get occupation(): IOccupationService {
    return this._services.get("OccupationService");
  }
  public get occupationGroup(): IOccupationGroupService {
    return this._services.get("OccupationGroupService");
  }

  public set occupation(service: IOccupationService) {
    this._services.set("OccupationService", service);
  }

  public set occupationGroup(service: IOccupationGroupService) {
    this._services.set("OccupationGroupService", service);
  }

  async initialize() {
    const repositoryRegistry = getRepositoryRegistry();
    this.occupation = new OccupationService(repositoryRegistry.occupation);
    this.occupationGroup = new OccupationGroupService(repositoryRegistry.OccupationGroup);
  }
}

const _serviceRegistryInstance: ServiceRegistry = new ServiceRegistry();

export function getServiceRegistry(): ServiceRegistry {
  return _serviceRegistryInstance;
}
