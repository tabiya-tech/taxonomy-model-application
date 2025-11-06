import { getRepositoryRegistry } from "../repositoryRegistry/repositoryRegistry";
import { OccupationService } from "esco/occupations/occupationService";
import { IOccupationService } from "esco/occupations/occupationService.types";

export class ServiceRegistry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly _services: Map<string, any> = new Map<string, any>();

  public get occupation(): IOccupationService {
    return this._services.get("OccupationService");
  }

  public set occupation(service: IOccupationService) {
    this._services.set("OccupationService", service);
  }

  async initialize() {
    const repositoryRegistry = getRepositoryRegistry();
    this.occupation = new OccupationService(repositoryRegistry.occupation);
  }
}

const _serviceRegistryInstance: ServiceRegistry = new ServiceRegistry();

export function getServiceRegistry(): ServiceRegistry {
  return _serviceRegistryInstance;
}
